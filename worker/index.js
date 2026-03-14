/**
 * PromptLab Cloudflare Worker — AI Proxy + Session Control
 *
 * KV Namespace: PROMPTLAB_KV
 * Required KV keys:
 *   OPENAI_KEY       — OpenAI API key
 *   ANTHROPIC_KEY    — Anthropic API key
 *   GOOGLE_KEY       — Google AI API key
 *   ADMIN_SECRET     — Strong random secret for admin endpoints
 *   SESSION_ACTIVE   — "true" | "false" (default: "false")
 *
 * Endpoints:
 *   POST /session/start   { secret }  → sets SESSION_ACTIVE=true
 *   POST /session/end     { secret }  → sets SESSION_ACTIVE=false
 *   GET  /session/status             → { active: bool }
 *   POST /proxy/openai              → proxies to OpenAI if session active
 *   POST /proxy/anthropic           → proxies to Anthropic if session active
 *   POST /proxy/google              → proxies to Gemini if session active
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access',
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/session/status') return handleStatus(env);
      if (path === '/session/start')  return handleStart(request, env);
      if (path === '/session/end')    return handleEnd(request, env);
      if (path === '/proxy/openai')   return handleProxyOpenAI(request, env);
      if (path === '/proxy/anthropic') return handleProxyAnthropic(request, env);
      if (path === '/proxy/google')   return handleProxyGoogle(request, env);

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }
};

// ── Session control ───────────────────────────────────────────

async function handleStatus(env) {
  const active = await env.PROMPTLAB_KV.get('SESSION_ACTIVE');
  return jsonResponse({ active: active === 'true' });
}

async function handleStart(request, env) {
  const body = await request.json().catch(() => ({}));
  const secret = await env.PROMPTLAB_KV.get('ADMIN_SECRET');
  if (!secret || body.secret !== secret) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  await env.PROMPTLAB_KV.put('SESSION_ACTIVE', 'true');
  return jsonResponse({ ok: true, active: true });
}

async function handleEnd(request, env) {
  const body = await request.json().catch(() => ({}));
  const secret = await env.PROMPTLAB_KV.get('ADMIN_SECRET');
  if (!secret || body.secret !== secret) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  await env.PROMPTLAB_KV.put('SESSION_ACTIVE', 'false');
  return jsonResponse({ ok: true, active: false });
}

// ── Session gate ──────────────────────────────────────────────

async function assertSessionActive(env) {
  const active = await env.PROMPTLAB_KV.get('SESSION_ACTIVE');
  if (active !== 'true') {
    throw new SessionInactiveError('Session is not active. Admin must start the session first.');
  }
}

class SessionInactiveError extends Error {
  constructor(msg) { super(msg); this.name = 'SessionInactiveError'; }
}

// ── OpenAI Proxy ──────────────────────────────────────────────

async function handleProxyOpenAI(request, env) {
  await assertSessionActive(env);
  const key = await env.PROMPTLAB_KV.get('OPENAI_KEY');
  if (!key) return jsonResponse({ error: 'OpenAI key not configured' }, 503);

  const body = await request.text();
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
  });
}

// ── Anthropic Proxy ───────────────────────────────────────────

async function handleProxyAnthropic(request, env) {
  await assertSessionActive(env);
  const key = await env.PROMPTLAB_KV.get('ANTHROPIC_KEY');
  if (!key) return jsonResponse({ error: 'Anthropic key not configured' }, 503);

  const body = await request.text();
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
  });
}

// ── Google Gemini Proxy ───────────────────────────────────────

async function handleProxyGoogle(request, env) {
  await assertSessionActive(env);
  const key = await env.PROMPTLAB_KV.get('GOOGLE_KEY');
  if (!key) return jsonResponse({ error: 'Google key not configured' }, 503);

  const url = new URL(request.url);
  const model = url.searchParams.get('model') || 'gemini-2.0-flash';
  const body = await request.text();

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
