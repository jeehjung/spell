const ANDROID_APP_ORIGIN = "https://appassets.androidplatform.net";
const GITHUB_PAGES_ORIGIN = "https://jeehjung.github.io";
const MAX_REQUEST_BYTES = 1024 * 1024;
const ALLOWED_PAYLOAD_FIELDS = [
  "contents", "generationConfig", "systemInstruction", "safetySettings", "tools", "toolConfig",
];

function corsHeaders(origin) {
  if (origin !== ANDROID_APP_ORIGIN && origin !== GITHUB_PAGES_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders(origin),
    },
  });
}
function getRequestOrigin(request) {
  const origin = request.headers.get("origin");
  const sameOrigin = new URL(request.url).origin;
  if (!origin || origin === sameOrigin) return { allowed: true, corsOrigin: null };
  if (origin === ANDROID_APP_ORIGIN || origin === GITHUB_PAGES_ORIGIN) return { allowed: true, corsOrigin: origin };
  return { allowed: false, corsOrigin: null };
}
function validJobId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin");
  const sameOrigin = new URL(request.url).origin;
  if (origin !== ANDROID_APP_ORIGIN && origin !== GITHUB_PAGES_ORIGIN && origin !== sameOrigin) {
    return jsonResponse({ error: { message: "Origin not allowed." } }, 403);
  }
  return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Cache-Control": "no-store, private" } });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const { allowed, corsOrigin } = getRequestOrigin(request);
  if (!allowed) return jsonResponse({ error: { message: "Origin not allowed." } }, 403);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: { message: "Request is too large for a background job. Select a smaller photo." } }, 413, corsOrigin);
  }
  let input;
  try { input = await request.json(); }
  catch { return jsonResponse({ error: { message: "Expected a JSON request body." } }, 400, corsOrigin); }

  const apiKey = typeof input?.apiKey === "string" ? input.apiKey.trim() : "";
  const model = typeof input?.model === "string" ? input.model : "";
  const jobId = input?.jobId;
  if (!apiKey) return jsonResponse({ error: { message: "A personal Gemini API key is required." } }, 400, corsOrigin);
  if (!/^gemini-[A-Za-z0-9.-]{1,100}$/.test(model)) {
    return jsonResponse({ error: { message: "Unsupported Gemini model name." } }, 400, corsOrigin);
  }
  if (!validJobId(jobId)) return jsonResponse({ error: { message: "A valid background job ID is required." } }, 400, corsOrigin);

  const payload = {};
  for (const field of ALLOWED_PAYLOAD_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field)) payload[field] = input[field];
  }
  if (!Array.isArray(payload.contents) || payload.contents.length === 0) {
    return jsonResponse({ error: { message: "Gemini contents are required." } }, 400, corsOrigin);
  }
  if (!env.GEMINI_JOBS) {
    return jsonResponse({ error: { message: "Background job service is not connected yet." } }, 503, corsOrigin);
  }
  try {
    const job = await env.GEMINI_JOBS.createJob({ id: jobId, apiKey, model, payload });
    return jsonResponse({ jobId, status: job.status || "queued" }, 202, corsOrigin);
  } catch {
    return jsonResponse({ error: { message: "Could not start the background Gemini job." } }, 503, corsOrigin);
  }
}
