const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getForUser, getWithUsage, saveForUser, saveAnalysis, removeForUser, describe } = require('../models/Piq');
const { complete, configured } = require('../llm');

// A filled PIQ is only ever read by the person who wrote it. Every route here
// takes the user id from the token, never from the request, so there is no path
// by which one aspirant can reach another's form.

// A generously sized form still comes to a few kilobytes. The cap is here to
// stop someone using this as free storage, not to constrain honest answers.
const MAX_BYTES = 48 * 1024;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const row = await getForUser(req.userId);
    res.json({
      piq:         row ? row.data        : null,
      updated_at:  row ? row.updated_at  : null,
      analysis:    row ? row.analysis    : null,
      analysed_at: row ? row.analysed_at : null,
    });
  } catch (err) {
    console.error('PIQ fetch error:', err);
    res.status(500).json({ error: 'Could not load your PIQ' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const data = (req.body || {}).data;
    if (!isPlainObject(data))
      return res.status(400).json({ error: 'Nothing to save.' });

    const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (size > MAX_BYTES)
      return res.status(400).json({ error: 'That PIQ is too large to save. Please shorten your answers.' });

    const row = await saveForUser(req.userId, data);
    res.json({ piq: row.data, updated_at: row.updated_at });
  } catch (err) {
    console.error('PIQ save error:', err);
    res.status(500).json({ error: 'Could not save your PIQ' });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    const removed = await removeForUser(req.userId);
    res.json({ removed });
  } catch (err) {
    console.error('PIQ delete error:', err);
    res.status(500).json({ error: 'Could not delete your PIQ' });
  }
});

// ── Analysis ─────────────────────────────────────────────────────────────────
// Each call costs money, so it is capped per aspirant per day.
const DAILY_LIMIT = 3;

// How the analysis reads a PIQ. The lens is our mentors' view of leadership:
// an officer is someone who understands a situation fully, cares enough about
// the people in it to feel its urgency, and then brings their own solution to
// change it. SSB is only a small test of that, so the report coaches the
// person, not tricks for the test.
const SYSTEM = `You are an experienced SSB mentor helping an Indian defence aspirant understand themselves through their Personal Information Questionnaire (PIQ). The Interviewing Officer (IO) reads this form before the interview, and most questions come straight out of it.

How to look at the candidate:
- SSB checks leadership potential, not exam answers. Leadership here means three things working together:
  1. Understanding: seeing a situation fully, from about five sides, not just one or two. People who think narrowly give one-point answers ("the biggest problem is unemployment").
  2. Character: caring about other people, not only about oneself. Understanding plus caring creates a sense of urgency: the feeling that something must change.
  3. Solutions: acting on that urgency with their own ideas to change the situation for the better (a "status change"). Borrowed or rehearsed ideas do not count.
- Truth makes a leader. A candidate who answers honestly has nothing to remember. Never coach the candidate to make things up or to give "safe" textbook answers.
- Nobody is perfect. Candidates get selected with weaknesses when they keep improving. Your job is to show where to improve, kindly and clearly.
- Think in five parts. Any topic (home town, college, a sport, family) can be understood through about five main parts. Teach this habit through your examples.

Writing rules:
- Simple, plain English. Short sentences. Everyday words. The reader is often not a native English speaker.
- Speak to the candidate as "you".
- Work only from what the form says. Do not invent facts. Do not flatter. Every judgment must point to something in the form ("evidence").
- If an important section is blank or thin, say so instead of guessing.

What to produce (as JSON in the given schema):
- summary: 2 or 3 sentences on how an IO will likely see this candidate on first reading.
- leadership: for understanding, character and solutions, write what the PIQ already shows (with evidence) and one clear way to grow it.
- strengths: 3 to 5 strong points, each with the evidence from the form.
- likely_questions: exactly 5 areas, chosen from this PIQ (for example Family, Education, Friends and activities, Sports and NCC, Home region, Why the forces, Previous attempts). 4 or 5 questions in each, the way an IO asks them in a quick round. Add a short tip for each area on how to answer it honestly and fully.
- gaps: 3 to 6 things an IO will press on: what is thin or unclear, why the IO will ask, and what to do before the interview.
- practice: 3 to 5 short daily exercises built on this candidate's own life. Include at least one five-part exercise (for example "list 5 problems of your home district and 2 solutions for each") and one "change you made" exercise (recall or plan a time you saw a problem around you and fixed it).`;

// Structured output keeps the report in a shape the page can always render.
// Counts live in the prompt; schema-level array limits are not supported by
// every provider.
const str = { type: 'string' };
const obj = (properties) => ({
  type: 'object', additionalProperties: false,
  properties, required: Object.keys(properties),
});
const arr = (items) => ({ type: 'array', items });

const SCHEMA = obj({
  summary: str,
  leadership: obj({
    understanding: obj({ seen: str, grow: str }),
    character:     obj({ seen: str, grow: str }),
    solutions:     obj({ seen: str, grow: str }),
  }),
  strengths:        arr(obj({ point: str, evidence: str })),
  likely_questions: arr(obj({ area: str, questions: arr(str), tip: str })),
  gaps:             arr(obj({ issue: str, why: str, fix: str })),
  practice:         arr(obj({ title: str, task: str })),
});

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    if (!configured())
      return res.status(503).json({ error: 'PIQ analysis is not switched on yet.' });

    const row = await getWithUsage(req.userId);
    if (!row || !row.data || Object.keys(row.data).length === 0)
      return res.status(400).json({ error: 'Fill in your PIQ and save it first.' });

    if (row.used_today >= DAILY_LIMIT)
      return res.status(429).json({ error: `You can run ${DAILY_LIMIT} analyses a day. Try again tomorrow.` });

    const described = describe(row.data);
    if (described.trim().length < 80)
      return res.status(400).json({ error: 'There is not enough filled in yet to analyse. Add more and save.' });

    // Thinking counts against max_tokens, so leave room or the JSON gets cut off
    const text = await complete({ system: SYSTEM, user: described, maxTokens: 8000, schema: SCHEMA, feature: 'piq', userId: req.userId });

    // A model that ignores the format should degrade to readable text rather
    // than throwing away a call the aspirant has already spent.
    let analysis;
    try {
      analysis = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
    } catch {
      analysis = { summary: text, strengths: [], likely_questions: [], gaps: [] };
    }

    const saved = await saveAnalysis(req.userId, analysis);
    res.json({
      analysis:    saved.analysis,
      analysed_at: saved.analysed_at,
      used_today:  row.used_today + 1,
      daily_limit: DAILY_LIMIT,
    });
  } catch (err) {
    if (err.code === 'NO_KEY')  return res.status(503).json({ error: err.message });
    if (err.code === 'TIMEOUT') return res.status(504).json({ error: err.message });
    if (err.code === 'BUSY')    return res.status(503).json({ error: 'The analysis service is busy. Try again shortly.' });
    // llm.js has already logged the provider's reason; the aspirant gets a plain one
    if (err.code === 'UPSTREAM') return res.status(503).json({ error: err.message });
    if (err.code === 'REFUSED')  return res.status(422).json({ error: 'The analysis could not be run on this PIQ. Try editing it and analysing again.' });
    console.error('PIQ analyse error:', err);
    res.status(500).json({ error: 'Could not analyse your PIQ' });
  }
});

module.exports = router;
