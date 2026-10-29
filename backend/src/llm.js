// A thin wrapper over the LLM provider: Claude (Anthropic Messages API) or
// Google Gemini, chosen by LLM_PROVIDER.
//
// Uses fetch rather than the SDKs on purpose: this is one HTTP call per
// provider, and pulling in dependencies plus their supply chain for that is
// weight we do not need. Node 18+ has fetch built in.
//
// Nothing here knows about PIQs. Keeping the provider behind one small module
// means swapping it is a setting in .env, not a hunt through routes.
//
// Gemini's free tier is for local testing. Google may use free-tier prompts to
// improve its products, so real aspirants' PIQs should go through a paid tier.

const pool = require('./db');

const ANTHROPIC_URL   = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-5';
// Google retires Gemini models for new keys quickly; override with GEMINI_MODEL
const GEMINI_MODEL    = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
// A full PIQ report can take ~50s on Gemini's free tier; stays under the page's 90s wait
const TIMEOUT_MS = 85000;

// Explicit LLM_PROVIDER wins; otherwise Claude if its key is set, else Gemini.
function provider() {
  const p = (process.env.LLM_PROVIDER || '').trim().toLowerCase();
  if (p === 'gemini' || p === 'anthropic') return p;
  return process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'gemini';
}

function configured() {
  return Boolean(provider() === 'gemini' ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY);
}

function fail(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// The key and the aspirant's data are both in play here, so log the status
// and a short excerpt only — never the request body.
async function upstreamError(res, name) {
  const body = await res.text().catch(() => '');
  console.error(`[llm] ${name} responded ${res.status}: ${body.slice(0, 300)}`);
  return fail('The analysis service is unavailable right now.', res.status === 429 ? 'BUSY' : 'UPSTREAM');
}

async function callAnthropic({ system, user, maxTokens, schema, signal, meta }) {
  meta.model = ANTHROPIC_MODEL;
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
      ...(schema && { output_config: { format: { type: 'json_schema', schema } } }),
    }),
  });
  if (!res.ok) throw await upstreamError(res, 'Anthropic');

  const data = await res.json();
  meta.inputTokens  = data.usage?.input_tokens ?? null;
  meta.outputTokens = data.usage?.output_tokens ?? null;
  if (data.stop_reason === 'refusal') throw fail('The analysis service declined this request.', 'REFUSED');
  return (data.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

// The free tier often answers 503 "high demand" on the main model; the lite
// model is usually free when it is busy, so one retry there saves the attempt.
const GEMINI_FALLBACK = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';

async function callGemini({ system, user, maxTokens, schema, signal, meta }) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(schema && { responseMimeType: 'application/json', responseJsonSchema: schema }),
    },
  });
  const send = model => fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    { method: 'POST', signal, body, headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY } }
  );

  meta.model = GEMINI_MODEL;
  let res = await send(GEMINI_MODEL);
  if ((res.status === 503 || res.status === 429) && GEMINI_FALLBACK !== GEMINI_MODEL) {
    console.warn(`[llm] ${GEMINI_MODEL} busy (${res.status}), retrying on ${GEMINI_FALLBACK}`);
    meta.fallback = true;
    meta.model = GEMINI_FALLBACK;
    res = await send(GEMINI_FALLBACK);
  }
  if (!res.ok) throw await upstreamError(res, 'Gemini');

  const data = await res.json();
  const candidate = data.candidates?.[0];
  // Thinking tokens are billed as output, so count them in
  const u = data.usageMetadata || {};
  meta.inputTokens  = u.promptTokenCount ?? null;
  meta.outputTokens = (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) || null;
  if (data.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY')
    throw fail('The analysis service declined this request.', 'REFUSED');
  return (candidate?.content?.parts || [])
    .filter(part => part.text && !part.thought)
    .map(part => part.text)
    .join('\n');
}

// One row per call in llm_calls, for the admin dashboard: which feature, which
// model, did it work, how long, how many tokens. Never awaited by the caller
// and never allowed to throw — a logging problem must not cost a user their
// analysis. No prompt or answer text is stored.
function logCall(row) {
  pool.query(
    `INSERT INTO llm_calls (feature, provider, model, user_id, ok, error_code, latency_ms, input_tokens, output_tokens, fallback)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [row.feature, row.provider, row.model, row.userId, row.ok, row.errorCode, row.latencyMs,
     row.inputTokens, row.outputTokens, row.fallback]
  ).catch(err => console.error('[llm] could not log call:', err.message));
}

// Throws with code NO_KEY when unconfigured, so a route can return a clear
// "not switched on yet" rather than a 500 that looks like a bug.
// Pass schema (a JSON Schema object) to have the API return JSON in that
// shape, instead of asking nicely in the prompt. Pass feature and userId so
// the call shows up correctly on the admin dashboard.
async function complete({ system, user, maxTokens = 2000, schema = null, feature = 'other', userId = null }) {
  if (!configured()) throw fail('Analysis is not switched on yet.', 'NO_KEY');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const meta = { model: null, inputTokens: null, outputTokens: null, fallback: false };
  const started = Date.now();
  let errorCode = null;

  try {
    const call = provider() === 'gemini' ? callGemini : callAnthropic;
    const text = (await call({ system, user, maxTokens, schema, signal: controller.signal, meta })).trim();
    if (!text) throw fail('The analysis came back empty.', 'EMPTY');
    return text;
  } catch (err) {
    if (err.name === 'AbortError') {
      errorCode = 'TIMEOUT';
      throw fail('The analysis took too long. Please try again.', 'TIMEOUT');
    }
    errorCode = err.code || 'ERROR';
    throw err;
  } finally {
    clearTimeout(timer);
    logCall({
      feature, provider: provider(), model: meta.model, userId,
      ok: errorCode === null, errorCode, latencyMs: Date.now() - started,
      inputTokens: meta.inputTokens, outputTokens: meta.outputTokens, fallback: meta.fallback,
    });
  }
}

module.exports = { complete, configured, provider };
