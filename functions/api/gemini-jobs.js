const ANDROID_APP_ORIGIN = "https://appassets.androidplatform.net";
const GITHUB_PAGES_ORIGIN = "https://jeehjung.github.io";
function corsHeaders(origin) {
  if (origin !== ANDROID_APP_ORIGIN && origin !== GITHUB_PAGES_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
function requestOrigin(request) {
  const origin = request.headers.get("origin");
  const sameOrigin = new URL(request.url).origin;
  if (!origin || origin === sameOrigin) return { allowed: true, corsOrigin: null };
  if (origin === ANDROID_APP_ORIGIN || origin === GITHUB_PAGES_ORIGIN) return { allowed: true, corsOrigin: origin };
  return { allowed: false, corsOrigin: null };
}
export async function onRequestOptions({ request }) {
  const origin = request.headers.get("origin");
  const sameOrigin = new URL(request.url).origin;
  if (origin !== ANDROID_APP_ORIGIN && origin !== GITHUB_PAGES_ORIGIN && origin !== sameOrigin) {
    return jsonResponse({ error: { message: "Origin not allowed." } }, 403);
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
export async function onRequestGet({ request, env }) {
  const { allowed, corsOrigin } = requestOrigin(request);
  if (!allowed) return jsonResponse({ error: { message: "Origin not allowed." } }, 403);
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId || "")) {
    return jsonResponse({ error: { message: "A valid job ID is required." } }, 400, corsOrigin);
  }
  if (!env.GEMINI_JOBS) return jsonResponse({ error: { message: "Background job service is not connected yet." } }, 503, corsOrigin);
  try {
    return jsonResponse(await env.GEMINI_JOBS.getJob(jobId), 200, corsOrigin);
  } catch {
    return jsonResponse({ error: { message: "Background job was not found or has expired." } }, 404, corsOrigin);
  }
}
