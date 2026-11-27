// Default Gemini key proxy for Word Study (Cloudflare Pages Function).
// The app calls this when the user has not entered a personal key. The key lives only in the
// Pages project's secret GEMINI_API_KEY and is never sent to the browser.
// Allowed callers: this site itself and the GitHub Pages production copy.

import { logGemini } from '../_usage.js';

const EXTRA_ALLOWED_ORIGINS = ['https://jeehjung.github.io'];
const MODEL_PATTERN = /^gemini-[a-z0-9.\-]+$/i;
const MAX_BODY_BYTES = 20 * 1024 * 1024;

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

function allowedOrigin(request) {
    const origin = request.headers.get('Origin') || '';
    const self = new URL(request.url).origin;
    return origin === self || EXTRA_ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

function json(status, body, origin) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(origin ? corsHeaders(origin) : {}) }
    });
}

export async function onRequestOptions({ request }) {
    const origin = allowedOrigin(request);
    if (!origin) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost({ request, env }) {
    const origin = allowedOrigin(request);
    if (!origin) return json(403, { error: { code: 'FORBIDDEN_ORIGIN', message: '허용되지 않은 주소에서 온 요청입니다.' } }, null);
    if (!env.GEMINI_API_KEY) {
        return json(503, { error: { code: 'NO_DEFAULT_KEY', message: '기본 Gemini 키가 아직 설정되지 않았습니다.' } }, origin);
    }
    const length = Number(request.headers.get('Content-Length') || 0);
    if (length > MAX_BODY_BYTES) return json(413, { error: { code: 'TOO_LARGE', message: '요청이 너무 큽니다.' } }, origin);

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return json(400, { error: { code: 'BAD_JSON', message: '요청 형식이 올바르지 않습니다.' } }, origin);
    }
    const model = String(body?.model || '');
    if (!MODEL_PATTERN.test(model) || typeof body?.payload !== 'object' || body.payload === null) {
        return json(400, { error: { code: 'BAD_REQUEST', message: '요청 형식이 올바르지 않습니다.' } }, origin);
    }

    const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
            body: JSON.stringify(body.payload)
        }
    );
    await logGemini(env, 'spell', upstream.status);
    // Pass Gemini's answer (and its status) straight through so the app handles it as before.
    return new Response(upstream.body, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(origin) }
    });
}
