const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Prep = require('../models/Prep');
const { complete, configured } = require('../llm');
const stt = require('../stt');
const { getForUser: getPiq } = require('../models/Piq');

// The sheet itself is public and lives in the frontend. These routes only
// store one aspirant's own progress through it, keyed by the token's user id.

// Topic ids are slugs from frontend/src/data/prepSheet.js. The backend does not
// keep a copy of that list, so it checks the shape and caps the row count
// instead — enough to stop the table being used as free storage.
const TOPIC_ID = /^[a-z0-9][a-z0-9-]{1,79}$/;
const MAX_TOPICS = 1000;
const MAX_NOTE = 2000;

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [progress, activity] = await Promise.all([
      Prep.getAll(req.userId),
      Prep.getActivity(req.userId),
    ]);
    // stt tells the page whether to record audio for Sarvam or fall back to
    // the browser's own speech recognition.
    res.json({ progress, activity, stt: stt.configured() });
  } catch (err) {
    console.error('Prep fetch error:', err);
    res.status(500).json({ error: 'Could not load your progress' });
  }
});

router.put('/:topicId', authMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    if (!TOPIC_ID.test(topicId)) return res.status(400).json({ error: 'Unknown topic.' });

    const body = req.body || {};
    const patch = {};
    if (body.status !== undefined) {
      if (![0, 1, 2].includes(body.status)) return res.status(400).json({ error: 'Bad status.' });
      patch.status = body.status;
    }
    if (body.starred !== undefined) {
      if (typeof body.starred !== 'boolean') return res.status(400).json({ error: 'Bad star.' });
      patch.starred = body.starred;
    }
    if (body.note !== undefined) {
      if (typeof body.note !== 'string') return res.status(400).json({ error: 'Bad note.' });
      if (body.note.length > MAX_NOTE)
        return res.status(400).json({ error: `Notes can be up to ${MAX_NOTE} characters.` });
      patch.note = body.note;
    }
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to save.' });

    if (await Prep.countTopics(req.userId) >= MAX_TOPICS)
      return res.status(400).json({ error: 'Too many topics saved.' });

    const row = await Prep.update(req.userId, topicId, patch);
    // Only real progress counts towards the streak — starring or typing a note
    // is not a day of study.
    if (patch.status) await Prep.logActivity(req.userId);
    res.json({ progress: row });
  } catch (err) {
    console.error('Prep save error:', err);
    res.status(500).json({ error: 'Could not save' });
  }
});

router.post('/:topicId/review', authMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    if (!TOPIC_ID.test(topicId)) return res.status(400).json({ error: 'Unknown topic.' });
    const recalled = (req.body || {}).recalled;
    if (typeof recalled !== 'boolean') return res.status(400).json({ error: 'Bad review.' });

    const row = await Prep.review(req.userId, topicId, recalled);
    if (!row) return res.status(404).json({ error: 'Mark this topic "Can speak" first.' });
    await Prep.logActivity(req.userId);
    res.json({ progress: row });
  } catch (err) {
    console.error('Prep review error:', err);
    res.status(500).json({ error: 'Could not save' });
  }
});

// ── Spoken answer feedback ────────────────────────────────────────────────────
// The aspirant answers a topic's question out loud; the browser turns speech
// into text and sends it here. The model judges it the way an assessor would.
// If the verdict is "ready" the topic is marked "can speak" — that tick now
// means someone other than the aspirant thought so too.
const FEEDBACK_DAILY_LIMIT = 15;
// A fact question needs a word, a personal one about a minute, an opinion
// about two. Matches ANSWER in frontend/src/data/prepSheet.js.
const ANSWER_MIN_WORDS = { short: 1, medium: 12, long: 30 };
const ANSWER_EXPECT = {
  short:  'Expected answer: a word or one short line. This is a fact question. Judge only whether the answer is correct and clearly said. Do not ask for more length, two sides, structure or an opening; leave missed, better_opening and language empty unless something is actually wrong.',
  medium: 'Expected answer: about one minute. Judge content, specific details and clarity. Two sides are not needed unless the question asks for a view.',
  long:   'Expected answer: about two minutes, with both sides and then a clear view of their own. Under one minute is too short.',
};
const MAX_TRANSCRIPT = 6000;

// The topic text comes from the client, because the sheet lives in the
// frontend. It is only ever placed inside the user message under a fixed
// system prompt and a fixed output schema, so the most a tampered request can
// do is spend that person's own daily allowance.
function cleanTopic(t) {
  if (!t || typeof t !== 'object') return null;
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const topic = {
    title: str(t.title, 200),
    ask: str(t.ask, 300),
    points: Array.isArray(t.points) ? t.points.slice(0, 8).map(p => str(p, 300)).filter(Boolean) : [],
    personal: t.personal === true,
    answer: ANSWER_MIN_WORDS[t.answer] ? t.answer : 'long',
  };
  return topic.title && topic.ask ? topic : null;
}

const SPEAK_SYSTEM = `You coach Indian defence aspirants for the SSB interview, Group Discussion and Lecturette. You listen like an experienced assessor.

The aspirant was given a question and answered it out loud. You get a transcript made by the browser's speech recognition. Ignore small recognition errors, missing punctuation and odd spellings of names. Judge what they meant to say.

Judge five things:
1. Content — are the facts right, and did they cover the key points?
2. Balance — for an opinion question, did they show more than one side, then give a clear view of their own?
3. Structure — for a longer answer, a clear opening, two or three points, a short conclusion.
4. Clarity and confidence — filler words, repeating themselves, going off topic, sounding unsure.
5. Length — judge it against the expected length given with the question. Never mark an answer down for being short when a short answer was expected.

For a personal question (about their own life, family, home town or choices), there are no "right facts". Judge honesty, specific details and real examples instead. Never invent facts about their life.

Write in simple, plain English. Short sentences. Everyday words. Many readers are not native English speakers. Be honest and kind. Point to their own words where you can. Do not flatter.

verdict:
- "ready" — they could say this at SSB as it is, with only small polish.
- "almost" — the core is there, but one or two clear gaps.
- "not_yet" — too short, mostly wrong, off the question, or no clear view.

score is a whole number from 1 to 10 and must match the verdict: ready is 8 or above, almost is 5 to 7, not_yet is 4 or below.
did_well: 1 to 3 items. improve: 1 to 4 items, most important first. missed: key points they did not mention, at most 4, may be empty. better_opening: one or two sentences they could open with next time, in their voice. language: up to 3 short tips on how they spoke (fillers, repetition, tone), may be empty.`;

const SPEAK_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ready', 'almost', 'not_yet'] },
    score: { type: 'integer' },
    summary: { type: 'string' },
    did_well: { type: 'array', items: { type: 'string' } },
    improve: {
      type: 'array',
      items: {
        type: 'object',
        properties: { point: { type: 'string' }, how: { type: 'string' } },
        required: ['point', 'how'],
        additionalProperties: false,
      },
    },
    missed: { type: 'array', items: { type: 'string' } },
    better_opening: { type: 'string' },
    language: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'score', 'summary', 'did_well', 'improve', 'missed', 'better_opening', 'language'],
  additionalProperties: false,
};

router.post('/:topicId/speak', authMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    if (!TOPIC_ID.test(topicId)) return res.status(400).json({ error: 'Unknown topic.' });
    if (!configured()) return res.status(503).json({ error: 'Spoken feedback is not switched on yet.' });

    const body = req.body || {};
    const topic = cleanTopic(body.topic);
    if (!topic) return res.status(400).json({ error: 'Unknown topic.' });

    const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : '';
    if (transcript.length > MAX_TRANSCRIPT)
      return res.status(400).json({ error: 'That answer is too long. Keep it to about three minutes.' });
    const words = transcript.split(/\s+/).filter(Boolean).length;
    const minWords = ANSWER_MIN_WORDS[topic.answer];
    if (words < minWords)
      return res.status(400).json({ error: minWords === 1 ? 'Say your answer first.' : `Speak a little more first — at least ${minWords} words.` });
    const seconds = Number.isInteger(body.seconds) ? Math.min(Math.max(body.seconds, 0), 600) : null;

    const used = await Prep.feedbackUsedToday(req.userId);
    if (used >= FEEDBACK_DAILY_LIMIT)
      return res.status(429).json({ error: `You can get feedback ${FEEDBACK_DAILY_LIMIT} times a day. Try again tomorrow.` });

    const userMsg = [
      `Topic: ${topic.title}`,
      `Question: ${topic.ask}`,
      topic.personal ? 'This is a personal question about the aspirant\'s own life.' : '',
      ANSWER_EXPECT[topic.answer],
      topic.points.length ? `Key points a good answer would touch:\n${topic.points.map(p => `- ${p}`).join('\n')}` : '',
      seconds != null ? `They spoke for ${seconds} seconds (${words} words).` : `${words} words.`,
      `Transcript:\n"""\n${transcript}\n"""`,
    ].filter(Boolean).join('\n\n');

    const text = await complete({ system: SPEAK_SYSTEM, user: userMsg, maxTokens: 4000, schema: SPEAK_SCHEMA, feature: 'prep_speak', userId: req.userId });
    let feedback;
    try {
      feedback = JSON.parse(text);
    } catch {
      feedback = { verdict: 'almost', score: 5, summary: text, did_well: [], improve: [], missed: [], better_opening: '', language: [] };
    }

    await Prep.logFeedback(req.userId);
    await Prep.saveAttempt(req.userId, topicId, {
      transcript, seconds, words, feedback, at: new Date().toISOString(),
    });

    // A good answer earns the tick. Any honest attempt at least counts as read.
    const current = (await Prep.getAll(req.userId)).find(r => r.topic_id === topicId);
    let row = current;
    if (feedback.verdict === 'ready' && current.status < 2) row = await Prep.update(req.userId, topicId, { status: 2 });
    else if (current.status < 1) row = await Prep.update(req.userId, topicId, { status: 1 });

    res.json({ progress: row, feedback, used_today: used + 1, daily_limit: FEEDBACK_DAILY_LIMIT });
  } catch (err) {
    if (err.code === 'NO_KEY')  return res.status(503).json({ error: err.message });
    if (err.code === 'TIMEOUT') return res.status(504).json({ error: err.message });
    if (err.code === 'BUSY')    return res.status(503).json({ error: 'The feedback service is busy. Try again shortly.' });
    if (err.code === 'REFUSED') return res.status(422).json({ error: 'We could not give feedback on that answer.' });
    console.error('Prep speak error:', err);
    res.status(500).json({ error: 'Could not get feedback' });
  }
});

// ── Speech-to-text ────────────────────────────────────────────────────────────
// One piece of a spoken answer (under 30 seconds — Sarvam's limit for a single
// request), sent as the raw audio body. Pieces are transcribed as the aspirant
// speaks, so only the last one is left to wait for after they stop.
const STT_DAILY_LIMIT = 80;          // ~35 minutes of speaking a day
const MAX_AUDIO = 2 * 1024 * 1024;   // 27s of opus is ~200kB; Safari's mp4 is larger

// Names that the recogniser should expect: the aspirant's own places from
// their PIQ — the words it gets wrong most, and the ones an IO asks about —
// plus names from the topic, sent by the page.
const PIQ_PLACE_FIELDS = ['max_residence', 'present_residence', 'permanent_residence', 'state_district'];

async function keytermsFor(userId, extra) {
  const terms = new Set();
  const add = v => {
    for (const part of String(v || '').split(/[,/;|]+/)) {
      const t = part.trim();
      if (t.length >= 3 && t.length <= 64) terms.add(t);
    }
  };
  try {
    const row = await getPiq(userId);
    for (const f of PIQ_PLACE_FIELDS) add(row?.data?.[f]);
  } catch { /* no PIQ is fine */ }
  for (const t of extra) add(t);
  return [...terms].slice(0, 50);
}

router.post('/transcribe', authMiddleware,
  express.raw({ type: ['audio/*', 'video/webm', 'video/mp4'], limit: MAX_AUDIO }),
  async (req, res) => {
    try {
      if (!stt.configured()) return res.status(503).json({ error: 'Speech-to-text is not switched on yet.' });
      if (!Buffer.isBuffer(req.body) || req.body.length < 1000)
        return res.status(400).json({ error: 'No audio received.' });

      const used = await Prep.sttUsedToday(req.userId);
      if (used >= STT_DAILY_LIMIT)
        return res.status(429).json({ error: 'You have spoken a lot today! Type your answer, or come back tomorrow.' });

      let extra = [];
      try { extra = JSON.parse(String(req.query.terms || '[]')); } catch { /* ignore */ }
      if (!Array.isArray(extra)) extra = [];
      const keyterms = await keytermsFor(req.userId, extra.slice(0, 30).filter(t => typeof t === 'string'));

      const mime = String(req.headers['content-type'] || 'audio/webm').split(';')[0];
      const text = await stt.transcribe(req.body, mime, keyterms);
      await Prep.logStt(req.userId);
      res.json({ text });
    } catch (err) {
      if (err.code === 'NO_KEY')  return res.status(503).json({ error: err.message });
      if (err.code === 'TIMEOUT') return res.status(504).json({ error: err.message });
      if (err.code === 'BUSY')    return res.status(503).json({ error: 'Speech-to-text is busy. Try again shortly.' });
      if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That piece of audio is too long.' });
      console.error('Prep transcribe error:', err);
      res.status(500).json({ error: 'Could not turn your speech into text' });
    }
  });

module.exports = router;
