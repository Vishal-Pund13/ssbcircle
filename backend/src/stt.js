// Speech-to-text through Sarvam AI, which is trained on Indian speech and
// handles Indian-accented English and Indian place names far better than the
// browser's built-in recognition.
//
// Uses fetch for the same reason llm.js does: one HTTP call, no SDK needed.
// Node 18+ has fetch, FormData and Blob built in.
//
// The synchronous endpoint takes at most 30 seconds of audio per request, so
// the browser records in pieces shorter than that and sends each one here.

const API_URL = 'https://api.sarvam.ai/speech-to-text';
const MODEL = 'saaras:v4';
const TIMEOUT_MS = 30000;

function configured() {
  return Boolean(process.env.SARVAM_API_KEY);
}

// audio: Buffer. mimeType: what the browser recorded (webm/opus, or mp4 on
// Safari — both accepted). keyterms: up to 50 names to bias recognition
// towards, such as the aspirant's home town.
async function transcribe(audio, mimeType, keyterms = []) {
  if (!configured()) {
    const err = new Error('Speech-to-text is not switched on yet.');
    err.code = 'NO_KEY';
    throw err;
  }

  const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
  const form = new FormData();
  form.append('file', new Blob([audio], { type: mimeType }), `answer.${ext}`);
  form.append('model', MODEL);
  form.append('language_code', 'en-IN');
  if (keyterms.length) form.append('keyterms', JSON.stringify(keyterms.slice(0, 50)));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[stt] Sarvam responded ${res.status}: ${body.slice(0, 300)}`);
      const err = new Error('Speech-to-text is unavailable right now.');
      err.code = res.status === 429 ? 'BUSY' : 'UPSTREAM';
      throw err;
    }
    const data = await res.json();
    return (data.transcript || '').trim();
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('Speech-to-text took too long.');
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { transcribe, configured };
