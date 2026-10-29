const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Tat = require('../models/Tat');
const Piq = require('../models/Piq');
const { TAT_PICTURES } = require('../data/tatPictures');
const { complete, configured } = require('../llm');

// TAT (Thematic Apperception Test) practice: the aspirant sees a picture for
// 30 seconds, writes a story in 4 minutes, and gets feedback on it.

// Each analysis costs money, so it is capped per aspirant per day. A real TAT
// series is 12 stories; this leaves room for most of one sitting.
const DAILY_LIMIT = 10;
const MIN_WORDS = 30;
const MAX_CHARS = 4000;

// How a psychologist reads a TAT story, taken from our mentors' guidance:
// the series is read as a whole to build a profile, so one story is never a
// verdict; what counts is the candidate's own honest thinking reaching the
// assessor, not a memorised theme. Feedback coaches the person, not the test.
const SYSTEM = `You are an experienced SSB psychologist coaching an Indian defence aspirant on one practice TAT (Thematic Apperception Test) story. The candidate saw the picture for 30 seconds and wrote the story in 4 minutes.

How an assessor reads a TAT story:
- It is not a mathematical test. There is no right answer and no marks. The assessor builds a profile of the person from the whole series of stories. One story alone never decides a result, so never give a score or a pass/fail.
- The assessor looks at five things in every story:
  1. Imagination and perception: how the candidate sees the picture and what they make of it.
  2. Processing: how they think it through, the reasons, the order of actions, practical steps.
  3. Group behaviour: how the hero treats and works with other people.
  4. Reaction: how the hero reacts when there is trouble, pressure or a setback.
  5. Social attitude: how the hero looks at society and the people around them.
- Own thoughts beat memorised ones. The biggest problem is copied, rote themes. Example: every farmer picture becomes "drip irrigation and hybrid seeds" and the farmers' problems vanish in one line. That shows the candidate is pasting something they read, not thinking. If such solutions were that easy, they would already be done. A short, simple, honest idea in the candidate's own words is worth more than a polished copied one.
- The story must grow out of the picture. Do not force a favourite theme onto a picture where it does not fit.
- The hero should solve the problem with normal means. Making the hero a convenient expert (suddenly a national swimmer when a child is drowning, an agriculture engineer for every farm picture) is a shortcut that hides how they would really act.
- Solutions must be practical and believable, with clear steps. A problem solved in one line shows shallow thinking.
- Show belief, not self-doubt. Candidates often weaken their own hero for no reason (the athlete got injured the day before and came second; the hero is poor and helpless). If the hero worked hard, let the effort pay off. Conviction in your own story shows conviction in yourself.
- The hero should take responsibility and act like someone ready for bigger duties. The assessor is selecting a future officer, so a hero who leads, decides and helps others shows that potential.
- A simple story structure helps: what led to the scene, what is happening now and what the hero does, and how it ends.

Writing rules:
- Simple, plain English. Short sentences. Everyday words. The reader is often not a native English speaker.
- Speak to the candidate as "you". Be kind and direct. Do not flatter.
- Base every comment on what the story actually says. Quote short phrases from it where useful.
- Never write a model story for them. Help them rewrite it in their own way with questions instead. Copying a model story is exactly the habit that fails candidates.

What to produce (as JSON in the given schema):
- summary: 2 or 3 sentences on what this story shows about the writer, the way an assessor might read it.
- picture_fit: does the story come from the picture? verdict is "fits", "partly" or "off", with a one-line note.
- structure: in one short line each, what the story says about what led to the scene (before), what the hero does (action) and how it ends (outcome). Write "Missing" if the story does not cover it.
- hero: one or two lines on the hero: who they are, whether they act with normal means, take responsibility and show belief.
- pillars: exactly 5 items, one for each of the five things above, in that order, named "Imagination", "Processing", "Group behaviour", "Reaction", "Social attitude". level is "strong", "developing" or "weak". If the story gives nothing for one, say so and mark it "weak".
- borrowed: lines that look memorised, copied or too convenient, each with a short quote and why. Empty if none.
- strengths: 2 to 4 real strong points.
- improve: 2 to 4 things to change, each with what is wrong and how to fix it.
- rethink: 3 or 4 questions that help the candidate rewrite this same story in their own words.`;

// Added only when the aspirant has filled a PIQ. Real experience is the best
// cure for borrowed themes: a candidate who has organised a blood camp can
// write a believable rescue or relief story because they know the steps. But
// the picture still comes first — a forced PIQ detail is just another
// memorised theme.
const PIQ_GUIDE = `

The candidate's own PIQ (Personal Information Questionnaire) is given after the story. Use it ONLY for one extra, optional section. Do not judge the story on whether it uses the PIQ, and do not mention the PIQ anywhere else in the feedback.
- from_your_life.link: one or two lines naming real experiences from their PIQ (a sport, NCC, a place they know, a role they held, a setback they faced) that could make a story for THIS picture feel more natural, if they want.
- from_your_life.ideas: 2 or 3 gentle suggestions starting with words like "You could" or "If it fits". Each must still fit what the picture shows. Never tell them they should or must use it. Do not make the hero a copy of the candidate, and do not push a PIQ detail where the picture does not support it. If nothing in the PIQ honestly fits, say so in link and give an empty ideas list.
- Never mention religion, caste, category or income. Do not repeat private family details back in full.`;

const str = { type: 'string' };
const obj = (properties) => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) });
const arr = (items) => ({ type: 'array', items });
const oneOf = (...values) => ({ type: 'string', enum: values });

const SCHEMA = obj({
  summary:     str,
  picture_fit: obj({ verdict: oneOf('fits', 'partly', 'off'), note: str }),
  structure:   obj({ before: str, action: str, outcome: str }),
  hero:        str,
  pillars:     arr(obj({ name: str, level: oneOf('strong', 'developing', 'weak'), note: str })),
  borrowed:    arr(obj({ quote: str, why: str })),
  strengths:   arr(str),
  improve:     arr(obj({ issue: str, fix: str })),
  rethink:     arr(str),
});

const SCHEMA_WITH_PIQ = {
  ...SCHEMA,
  properties: { ...SCHEMA.properties, from_your_life: obj({ link: str, ideas: arr(str) }) },
  required: [...SCHEMA.required, 'from_your_life'],
};

const wordCount = s => (s.trim().match(/\S+/g) || []).length;

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [used, attempts] = await Promise.all([Tat.usedToday(req.userId), Tat.recent(req.userId)]);
    res.json({ used_today: used, daily_limit: DAILY_LIMIT, attempts });
  } catch (err) {
    console.error('TAT fetch error:', err);
    res.status(500).json({ error: 'Could not load your TAT practice' });
  }
});

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    if (!configured())
      return res.status(503).json({ error: 'TAT analysis is not switched on yet.' });

    const pictureId = Number(req.body?.picture_id);
    const picture = TAT_PICTURES[pictureId];
    if (!picture) return res.status(400).json({ error: 'That picture is not in the set.' });

    const story = String(req.body?.story || '').trim().slice(0, MAX_CHARS);
    if (wordCount(story) < MIN_WORDS)
      return res.status(400).json({ error: `Write at least ${MIN_WORDS} words so there is a story to read.` });

    if (await Tat.usedToday(req.userId) >= DAILY_LIMIT)
      return res.status(429).json({ error: `You can analyse ${DAILY_LIMIT} stories a day. Try again tomorrow.` });

    // A PIQ with only a field or two says nothing useful about the person
    const piqRow  = await Piq.getForUser(req.userId);
    const piqText = piqRow?.data ? Piq.describe(piqRow.data) : '';
    const withPiq = piqText.trim().length >= 80;

    const user = `Picture: ${picture}\n\nThe candidate's story (${wordCount(story)} words):\n${story}`
      + (withPiq ? `\n\nThe candidate's PIQ:\n${piqText}` : '');
    const text = await complete({
      system: withPiq ? SYSTEM + PIQ_GUIDE : SYSTEM,
      user, maxTokens: 8000, feature: 'tat', userId: req.userId,
      schema: withPiq ? SCHEMA_WITH_PIQ : SCHEMA,
    });

    let analysis;
    try {
      analysis = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
    } catch {
      analysis = { summary: text };
    }

    const attempt = await Tat.save(req.userId, pictureId, story, analysis);
    res.json({ attempt, has_piq: withPiq, used_today: await Tat.usedToday(req.userId), daily_limit: DAILY_LIMIT });
  } catch (err) {
    if (err.code === 'NO_KEY')   return res.status(503).json({ error: err.message });
    if (err.code === 'TIMEOUT')  return res.status(504).json({ error: err.message });
    if (err.code === 'BUSY')     return res.status(503).json({ error: 'The analysis service is busy. Try again shortly.' });
    if (err.code === 'UPSTREAM') return res.status(503).json({ error: err.message });
    if (err.code === 'REFUSED')  return res.status(422).json({ error: 'This story could not be analysed. Try editing it and analysing again.' });
    console.error('TAT analyse error:', err);
    res.status(500).json({ error: 'Could not analyse your story' });
  }
});

module.exports = router;
