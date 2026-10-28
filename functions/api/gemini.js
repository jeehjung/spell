const MAX_REQUEST_BYTES = 40 * 1024 * 1024;
const ALLOWED_PAYLOAD_FIELDS = [
  "contents",
  "generationConfig",
  "systemInstruction",
  "safetySettings",
  "tools",
  "toolConfig",
];

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function onRequestPost({ request }) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: { message: "Request is too large." } }, 413);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: { message: "Expected a JSON request body." } }, 400);
  }

  const apiKey = typeof input?.apiKey === "string" ? input.apiKey.trim() : "";
  const model = typeof input?.model === "string" ? input.model : "";
  if (!apiKey) {
    return jsonResponse({ error: { message: "A personal Gemini API key is required." } }, 400);
  }
  if (!/^gemini-[A-Za-z0-9.-]{1,100}$/.test(model)) {
    return jsonResponse({ error: { message: "Unsupported Gemini model name." } }, 400);
  }

  const payload = {};
  for (const field of ALLOWED_PAYLOAD_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field)) payload[field] = input[field];
  }
  if (!Array.isArray(payload.contents) || payload.contents.length === 0) {
    return jsonResponse({ error: { message: "Gemini contents are required." } }, 400);
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonResponse({ error: { message: "Could not reach the Gemini service." } }, 502);
  }
}
