/* Tiny Cloudflare Worker that keeps your Gemini key secret.
   1) Cloudflare dashboard > Workers > Create > paste this file > Deploy
   2) Settings > Variables > add secret  GEMINI_API_KEY = your key
   3) Put the worker URL in js/config.js  ->  geminiProxy: 'https://your-worker.workers.dev'
   4) Change ALLOW below to your real website address. */
const ALLOW = ['https://your-clinic-site.com'];           // add 'http://localhost:8000' while testing

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const ok = ALLOW.includes(origin);
    const cors = { 'Access-Control-Allow-Origin': ok ? origin : ALLOW[0], 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST' || !ok) return new Response('forbidden', { status: 403, headers: cors });
    const { model, body } = await req.json();
    if (!/^gemini-[\w.-]+$/.test(model || '')) return new Response('bad model', { status: 400, headers: cors });
    const up = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(body)
    });
    return new Response(up.body, { status: up.status, headers: { ...cors, 'Content-Type': 'text/event-stream' } });
  }
};
