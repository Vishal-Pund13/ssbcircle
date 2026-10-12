const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getForUser, getWithUsage, saveForUser, saveAnalysis, removeForUser } = require('../models/Piq');
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

// Religion, category and date of birth are stored because the paper form has
// them, but they say nothing about how someone will interview, and there is no
// reason to hand special-category data to a third party. Place names stay —
// an IO genuinely asks about your home district.
const OMIT = new Set(['religion', 'category', 'dob']);

const title = k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Flatten the form into labelled lines. Empty fields are dropped rather than
// sent as blanks, so the model sees what was actually filled in.
function describe(data) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (OMIT.has(key) || value == null || value === '') continue;

    if (Array.isArray(value)) {
      const rows = value
        .map(row => Object.entries(row || {})
          .filter(([, v]) => v != null && String(v).trim() !== '')
          .map(([k, v]) => `${title(k)}: ${v}`)
          .join('; '))
        .filter(Boolean);
      if (rows.length) lines.push(`${title(key)}:\n` + rows.map(r => `  - ${r}`).join('\n'));
    } else if (typeof value !== 'object') {
      lines.push(`${title(key)}: ${value}`);
    }
  }
  return lines.join('\n');
}

const SYSTEM = `You help Indian defence aspirants prepare for the SSB interview.

The Personal Information Questionnaire below is what the Interviewing Officer reads before calling a candidate in. Most interview questions come straight out of it.

Write in simple, plain English. Short sentences. Everyday words. The reader is a student, often not a native English speaker, so do not use literary or clever phrasing.

Work only from what the form says. Do not invent facts, do not flatter, and do not guess at things the candidate did not write.

Reply with JSON only. No markdown fence, no text before or after. Use exactly this shape:
{
  "summary": "two or three sentences on what this PIQ says about the candidate",
  "strengths": ["things an IO will likely probe in a good way"],
  "likely_questions": [{"area": "Family", "questions": ["...", "..."]}],
  "gaps": [{"issue": "what is thin or vague", "why": "why an IO will press on it", "fix": "what to do before the interview"}]
}

Rules:
- 4 to 6 areas in likely_questions, 3 to 5 questions in each.
- 3 to 6 gaps.
- If an important section is blank, say so in gaps rather than inventing an answer.`;

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

    const text = await complete({ system: SYSTEM, user: described, maxTokens: 2500 });

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
    console.error('PIQ analyse error:', err);
    res.status(500).json({ error: 'Could not analyse your PIQ' });
  }
});

module.exports = router;
