// A thin wrapper over the Anthropic Messages API.
//
// Uses fetch rather than the SDK on purpose: this is one HTTP call, and pulling
// in a dependency plus its supply chain for that is weight we do not need.
// Node 18+ has fetch built in.
//
// Nothing here knows about PIQs. Keeping the provider behind one small module
// means swapping it later is a single file, not a hunt through routes.

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-sonnet-5';
const TIMEOUT_MS = 60000;

function configured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Throws with code NO_KEY when unconfigured, so a route can return a clear
// "not switched on yet" rather than a 500 that looks like a bug.
async function complete({ system, user, maxTokens = 2000 }) {
  if (!configured()) {
    const err = new Error('Analysis is not switched on yet.');
    err.code = 'NO_KEY';
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // The key and the aspirant's data are both in play here, so log the status
      // and a short excerpt only — never the request body.
      console.error(`[llm] Anthropic responded ${res.status}: ${body.slice(0, 300)}`);
      const err = new Error('The analysis service is unavailable right now.');
      err.code = res.status === 429 ? 'BUSY' : 'UPSTREAM';
      throw err;
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    if (!text) throw new Error('The analysis came back empty.');
    return text;
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('The analysis took too long. Please try again.');
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { complete, configured, MODEL };
