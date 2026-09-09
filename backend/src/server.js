require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const compression = require('compression');
const pool        = require('./db');
const { authLimiter, createRoomLimiter, generalLimiter } = require('./middleware/rateLimit');
const roomsRouter    = require('./routes/rooms');
const authRouter     = require('./routes/auth');
const adminRouter    = require('./routes/admin');
const sessionsRouter = require('./routes/sessions');
const articlesRouter = require('./routes/articles');
const eventRouter    = require('./routes/event');
const { startCleanup, runCleanup } = require('./cleanup');
const { sendReminder, sendHostStartReminder } = require('./email');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Trust proxy (Render / Railway / Heroku sit behind one) ───────────────────
// Needed so rate-limiter reads the real client IP, not the proxy IP
app.set('trust proxy', 1);

// ── Compression (gzip) ───────────────────────────────────────────────────────
app.use(compression());

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '16kb' })); // Reject suspiciously large bodies

// ── Routes with targeted rate limits ─────────────────────────────────────────
// Auth: strict — protects against brute force & account spam
app.use('/api/auth', authLimiter, authRouter);

// Rooms: general guard on all room endpoints
// createRoomLimiter is applied inside rooms.js on POST / only
app.use('/api/rooms', generalLimiter, roomsRouter);

// Admin: strict limit on login endpoint, general on everything else
app.use('/api/admin/login', authLimiter);
app.use('/api/admin', generalLimiter, adminRouter);

// Sessions
app.use('/api/sessions', generalLimiter, sessionsRouter);

// Articles (public read)
app.use('/api/articles', generalLimiter, articlesRouter);

// Event registration (public)
app.use('/api/event', generalLimiter, eventRouter);

// Report a user (any signed-in user)
const authMw = require('./middleware/auth');
app.post('/api/reports', generalLimiter, authMw, async (req, res) => {
  try {
    const { reported_user_id, room_code, reason, description } = req.body;
    if (!reported_user_id || !reason)
      return res.status(400).json({ error: 'reported_user_id and reason are required' });
    if (reported_user_id === req.userId)
      return res.status(400).json({ error: 'You cannot report yourself' });
    await pool.query(
      `INSERT INTO user_reports (reporter_id, reported_user_id, room_code, reason, description)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, reported_user_id, room_code || null, reason.slice(0, 100), (description || '').slice(0, 500)]
    );
    res.json({ message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Featured aspirants — public, lightweight
app.get('/api/featured', generalLimiter, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.display_name, u.avatar_url,
             COUNT(r.id)::int AS rooms_hosted
      FROM users u
      JOIN rooms r ON r.created_by = u.id
      WHERE u.is_banned = false
      GROUP BY u.id
      HAVING COUNT(r.id) > 0
      ORDER BY COUNT(r.id) DESC, u.created_at DESC
      LIMIT 8
    `);
    res.json({ aspirants: rows });
  } catch {
    res.json({ aspirants: [] });
  }
});

// ── External cron trigger — call this every 2 min from cron-job.org / UptimeRobot
app.get('/api/cron', async (_req, res) => {
  try {
    await Promise.all([runCleanup(), sendSessionReminders()]);
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error('[cron] Error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS db_time');
    // Run cleanup on every health ping — keeps it working even if server was sleeping
    runCleanup().catch(() => {});
    // Send 30-min reminders for upcoming sessions
    sendSessionReminders().catch(() => {});
    res.json({
      status: 'ok',
      db: 'connected',
      db_time: rows[0].db_time,
      uptime_s: Math.floor(process.uptime()),
    });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

// ── 404 / error handlers ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function sendSessionReminders() {
  try {
    // Find sessions starting in 25–35 min, reminder not yet sent
    const { rows: sessions } = await pool.query(`
      SELECT s.id, s.topic, s.category, s.scheduled_at
      FROM scheduled_sessions s
      WHERE s.is_active = true
        AND s.reminder_sent = false
        AND s.scheduled_at BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes'
    `);
    console.log(`[reminders] Checked — ${sessions.length} session(s) in window`);
    for (const session of sessions) {
      const { rows: users } = await pool.query(`
        SELECT u.email, u.display_name FROM session_interests si
        JOIN users u ON u.id = si.user_id WHERE si.session_id = $1
      `, [session.id]);
      for (const u of users) {
        if (u.email) {
          await sendReminder({
            to: u.email, name: u.display_name,
            topic: session.topic, category: session.category,
            scheduled_at: session.scheduled_at,
          }).catch(err => console.error(`[reminders] Reminder failed for ${u.email}:`, err.message));
        }
      }
      await pool.query('UPDATE scheduled_sessions SET reminder_sent=true WHERE id=$1', [session.id]);
      console.log(`[reminders] Sent reminders for session: ${session.topic}`);
    }

    // Host start reminder — sent at scheduled time if room not yet active
    const { rows: starting } = await pool.query(`
      SELECT s.id, s.topic, s.category, s.scheduled_at, s.created_by,
             u.email, u.display_name
      FROM scheduled_sessions s
      JOIN users u ON u.id = s.created_by
      WHERE s.is_active = true
        AND s.host_reminder_sent = false
        AND NOT EXISTS (
          SELECT 1 FROM rooms r WHERE r.room_code = s.room_code AND r.is_active = true
        )
        AND s.scheduled_at BETWEEN NOW() - INTERVAL '5 minutes' AND NOW() + INTERVAL '5 minutes'
    `);
    for (const session of starting) {
      if (session.email) {
        await sendHostStartReminder({
          to: session.email, name: session.display_name,
          topic: session.topic, category: session.category,
          scheduled_at: session.scheduled_at,
        }).catch(err => console.error(`[reminders] Host reminder failed for ${session.topic}:`, err.message));
      }
      await pool.query('UPDATE scheduled_sessions SET host_reminder_sent=true WHERE id=$1', [session.id]);
      console.log(`[reminders] Sent host start reminder: ${session.topic}`);
    }
  } catch (err) {
    console.error('[reminders] Error:', err.message);
  }
}

async function start() {
  try {
    await pool.query('SELECT 1'); // verify DB connectivity
    console.log('✓ Database connected');

    // Auto-migrate: safe to run on every boot
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS emptied_at TIMESTAMP`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_participants INT DEFAULT 8`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS summary TEXT`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS article_slug VARCHAR(200)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS host_reminder_sent BOOLEAN DEFAULT false`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id                  SERIAL PRIMARY KEY,
        name                VARCHAR(100) NOT NULL,
        email               VARCHAR(255) NOT NULL UNIQUE,
        phone               VARCHAR(20),
        entry_type          VARCHAR(60),
        attempts            INT,
        prev_recommendation VARCHAR(60),
        registered_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS entry_type          VARCHAR(60)`);
    await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS attempts            INT`);
    await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS prev_recommendation VARCHAR(60)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        room_code VARCHAR(10),
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Performance indexes — safe to run repeatedly
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_rooms_active      ON rooms(created_at DESC) WHERE is_active = true`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_rooms_created_by  ON rooms(created_by)      WHERE is_active = true`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_active   ON scheduled_sessions(scheduled_at ASC) WHERE is_active = true`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interests_session ON session_interests(session_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_google      ON users(google_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title        VARCHAR(300) NOT NULL,
        category     VARCHAR(50)  NOT NULL,
        summary      TEXT         NOT NULL,
        content      TEXT         NOT NULL,
        tags         TEXT[]       DEFAULT '{}',
        is_published BOOLEAN      DEFAULT false,
        published_at TIMESTAMP,
        created_at   TIMESTAMP    DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_articles_category  ON articles(category)     WHERE is_published = true`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC) WHERE is_published = true`);
    await pool.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time  VARCHAR(20)  DEFAULT NULL`);
    await pool.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS difficulty    VARCHAR(20)  DEFAULT NULL`);
    await pool.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS ssb_relevance TEXT[]       DEFAULT '{}'`);
    await pool.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug          VARCHAR(200) DEFAULT NULL`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug) WHERE slug IS NOT NULL`);

    // Article votes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS article_votes (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_slug VARCHAR(200) NOT NULL,
        user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
        value        INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5),
        created_at   TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_article_votes_user ON article_votes(article_slug, user_id) WHERE user_id IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_article_votes_slug ON article_votes(article_slug)`);

    // Backfill slug for the first seeded article
    await pool.query(`UPDATE articles SET slug = 'rupee-depreciation' WHERE slug IS NULL AND title LIKE '%Rupee Story%'`);

    // Seed first article if none exist
    const { rows: existingArticles } = await pool.query('SELECT id FROM articles LIMIT 1');
    if (existingArticles.length === 0) {
      const content = `[CALLOUT]Before you read: You don't need to be an economics student to understand this. If you've ever wondered why your petrol price goes up when the news says "rupee falls" — this article will make that click for you.[/CALLOUT]

## The Headline That Confused a Million Aspirants

**₹90 per dollar.**

In 2025, the Indian rupee hit an all-time low against the US dollar. News channels went into overdrive. WhatsApp forwards declared economic doom.

But here's what nobody told you clearly:

**A falling rupee is not always a crisis. Sometimes, it's a calculated move.**

By the end of this article, you'll be able to explain this confidently in a GD or Lecturette — without sounding like you're reading from a textbook.

## What Even Is the Rupee's Value?

Imagine you're buying apples. If everyone wants apples and there aren't many, the price goes up. If nobody wants them and there are too many, the price falls.

**Currency works the same way.**

The rupee's value against the dollar is just a price — determined by supply and demand. When more people want dollars and fewer want rupees, the rupee's price falls.

**₹84 per dollar → ₹90 per dollar** means you now need MORE rupees to buy the same dollar. That's depreciation.

[INFOGRAPHIC:1]

## Who Decides the Rupee's Value?

Short answer: **the market does. But RBI watches carefully.**

Before 1991, the Indian government fixed the rupee's value — like a shopkeeper deciding the price regardless of what buyers want. That system nearly broke India when we ran out of dollars in 1991 — the famous Balance of Payments crisis.

After 1991, India switched to a **managed float system**:

- The market sets the rate based on demand and supply
- RBI steps in only when things get too volatile — not to fix a price, but to prevent panic

Think of RBI as a traffic cop — it doesn't build the roads or decide where you're going, but it ensures there's no accident at the junction.

[INFOGRAPHIC:2]

## Why Does the Rupee Fall? The 5 Real Reasons

### Reason 1 — We Import More Than We Export

India buys a lot from the world — crude oil, electronics, gold, machinery. We pay in **dollars**, not rupees. So importers flood the forex market with rupees and buy dollars. More demand for dollars → dollar becomes expensive → rupee becomes cheap.

In October 2025, India's exports fell 11.8% while imports surged 16.6%. That gap — the **trade deficit** — put enormous pressure on the rupee.

[INFOGRAPHIC:3]

### Reason 2 — Foreign Investors Pulling Out (FPI Outflows)

Foreign Portfolio Investors are large global funds that invest in Indian stocks and bonds. When they leave, they sell Indian stocks → get rupees → convert to dollars → exit. That last step floods the market with rupees and sucks up dollars, weakening the rupee.

In 2025, FPIs pulled out over **₹1.48 lakh crore** from Indian markets.

[INFOGRAPHIC:4]

### Reason 3 — The Dollar Got Stronger

The US Federal Reserve raised interest rates aggressively. Higher US rates = better returns on dollar investments = global investors prefer dollars. When the whole world wants dollars, **every currency weakens** — not just the rupee. This is a global phenomenon, not an India-specific failure.

### Reason 4 — Gold & Oil: India's Two Expensive Habits

India is the world's second-largest gold consumer and one of the largest oil importers. In FY26, India imported gold worth **$72 billion** and oil worth **$135 billion** — over **$206 billion** on just two items. Every dollar spent is a dollar that leaves India, weakening the rupee.

### Reason 5 — Sentiment and Expectations

Sometimes the rupee falls simply because people expect it to fall. This becomes self-fulfilling — investors rush to buy dollars now, which weakens the rupee immediately. Currency markets run 20% on fundamentals and 80% on sentiment.

## Is a Falling Rupee Always Bad?

**No. And this is the part most people miss.**

[INFOGRAPHIC:5]

India's IT sector — which earns billions in dollars — actually profits when the rupee weakens. Companies like TCS and Infosys often see profits rise on rupee depreciation news because they earn in dollars but pay salaries in rupees.

## What Does RBI Actually Do?

**RBI's actual job:** Prevent chaos, not prevent change.

In 2025, RBI shifted strategy — instead of defending specific rupee levels, it lets the market determine direction but steps in when the fall becomes too steep, too sudden.

If you're letting air out of a tyre — controlled deflation is fine. Blowout is not.

[INFOGRAPHIC:6]

## The Big Picture — Is India in Trouble?

Context matters. The rupee has been depreciating since 1991 — from ₹17 to ₹90. That's 34 years at roughly 4.5% per year on average. **This is structural, not sudden.**

Despite depreciation, India remains one of the fastest-growing major economies, a net recipient of FDI, a country with strong forex reserves, and a growing services export powerhouse in IT, healthcare, and education.

The rupee is adjusting — not collapsing. There's a difference.

[SSB-GD]**Don't say:** "The rupee falling is bad for India."

**Say instead:** "Rupee depreciation is a double-edged sword — while it hurts importers and raises inflation risks, it makes Indian exports more competitive and boosts IT sector earnings. The key question is whether RBI can manage the pace of depreciation without letting it become disorderly."

That one line shows analytical thinking — an Officer-Like Quality.[/SSB-GD]

[SSB-LECTURETTE]**Suggested structure (under 3 minutes):**
1. Open with the headline — "₹90 to a dollar — crisis or correction?"
2. Explain depreciation — simple supply-demand
3. Give 2–3 causes — trade deficit, FPI outflows, strong dollar
4. Balance it — winners and losers
5. Close with RBI's role and India's resilience[/SSB-LECTURETTE]

[SSB-PI]**If asked:** "What do you think about the falling rupee?"

**Say:** "Sir, a falling rupee reflects structural economic realities — our trade deficit, global dollar strength, and capital flows. It's not a one-dimensional problem. The more important question is whether India has the forex reserves, institutional strength, and policy framework to manage the adjustment — and currently, we do."[/SSB-PI]

[KEY-TERMS]
Depreciation|Rupee falls naturally due to market forces
Devaluation|Government deliberately reduces rupee's value
Trade Deficit|India imports more than it exports
Current Account Deficit (CAD)|Broader trade gap including services and income flows
FPI|Foreign Portfolio Investors — invest in stocks/bonds, can leave quickly
FDI|Foreign Direct Investment — companies building factories, stay longer
Forex Reserves|RBI's stockpile of foreign currency — India's financial shield
Managed Float|Market sets the rate; RBI prevents extreme swings
REER|Rupee's value adjusted for inflation — the real exchange rate
[/KEY-TERMS]

[QUOTE]The rupee's fall is not a collapse — it's a managed descent. The goal isn't to hold the parachute shut, it's to make sure it opens at the right time.[/QUOTE]`;

      await pool.query(`
        INSERT INTO articles (title, category, summary, content, tags, is_published, published_at, reading_time, difficulty, ssb_relevance, slug)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7, $8, $9)
      `, [
        'The Rupee Story: Why India\'s Currency Falls — and Why That\'s Not Always Bad',
        'economic',
        'India\'s rupee hit ₹90 per dollar in 2025. But is a falling rupee always bad? This beginner-friendly explainer breaks down currency depreciation, its causes, who wins and who loses — and how to discuss it confidently in SSB GD, Lecturette and PI.',
        content,
        ['economy', 'rupee', 'RBI', 'forex', 'current-affairs', 'GD-topics', 'lecturette', 'PI-prep'],
        '8 min',
        'Beginner',
        ['GD Topics', 'Lecturette', 'PI'],
        'rupee-depreciation',
      ]);
      console.log('✓ Seeded first article: The Rupee Story');
    }

    // Seed Super El Niño article if not already present
    const { rows: elNinoExists } = await pool.query("SELECT id FROM articles WHERE slug = 'super-el-nino' LIMIT 1");
    if (!elNinoExists.length) {
      await pool.query(`
        INSERT INTO articles (title, category, summary, content, tags, is_published, published_at, reading_time, difficulty, ssb_relevance, slug)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7, $8, $9)
      `, [
        'Super El Niño: When the Pacific Runs a Fever, India Pays the Price',
        'geographic',
        'A Super El Niño is forming in the Pacific — potentially the strongest since the 1870s. Here\'s what it means for India\'s monsoon, food prices, and 600 million farmers.',
        'A Super El Niño is forming in 2026. NOAA says it could be the largest since the 1870s. India\'s monsoon, food security, and 600 million livelihoods are directly in its path.',
        ['el-nino', 'monsoon', 'climate', 'food-security', 'ENSO', 'pacific', 'IMD', 'geography'],
        '5 min',
        'Beginner',
        ['GD Topics', 'Lecturette', 'PI'],
        'super-el-nino',
      ]);
      console.log('✓ Seeded article: Super El Niño');
    }

    // Seed INS Sudarshini / Lokayan 26 article. Upserts on slug so edits to the
    // content below actually propagate on restart instead of being skipped.
    {
      const sudarshiniContent = `## An unarmed ship just did more for India's image than a warship could

[IMAGE:/Blog_Images/Lokayan_3.jpeg|INS Sudarshini docked in Lisbon, flying the Tricolour — 22 August 2026]

INS Sudarshini sailed into Lisbon on 22 August 2026 — her 15th port call in seven months, no weapons on board. She's a training ship, not a warship, and that's the whole story: an unarmed vessel gets invited to dinner where a destroyer would get pointed questions.

There's a real naval term for this: **"showing the flag."** Park a ship somewhere friendly, let people see the uniform up close, and let goodwill do the work a treaty table can't.

[IMAGE:/Blog_Images/Lokayan_1.jpeg|Indian Navy crew during the flag ceremony ashore in Lisbon]

## The concept: hard power vs soft power

This is the idea the whole story rests on, and it's one of the most reliably useful concepts in the entire SSB syllabus.

Every country has exactly **three ways** to get another country to do what it wants. It can **threaten** — sanctions, troops, missile tests. It can **pay** — aid, trade deals, investment. Or it can **attract** — make the other side actually *want* the same outcome.

The first two are **hard power**: coercion and payment, the carrot and the stick. The third is **soft power**, and it's the one most people never think of as power at all.

The scholar who coined the term, Harvard's **Joseph Nye**, defined it in his 1990 book *Bound to Lead*:

[QUOTE]Soft power is the ability to obtain preferred outcomes by attraction rather than coercion or payment.|Joseph Nye, who coined the term in Bound to Lead (1990)[/QUOTE]

Nye's sharpest observation was about cost. When others are attracted to your goals, **carrots and sticks become less necessary** — you spend less to get the same result, because the other side sees your position as legitimate rather than imposed.

[COMPARE:Hard Power|Soft Power]
Carriers, missiles, sanctions, troops | Training ships, scholarships, cinema, yoga, diaspora
Works by threat or payment | Works by attraction
Fast, visible, very expensive | Slow, cumulative, remarkably cheap
Produces compliance — they obey | Produces preference — they agree
Can create resentment | Builds durable goodwill
Deters an enemy | Wins a friend
[/COMPARE]

INS Sudarshini sits entirely in the right-hand column. She has no capability in the left-hand one — and that isn't a weakness, it's the design.

[CALLOUT]Nye's own warning is worth remembering in a GD: soft power alone is not a strategy. He argued the real skill is "smart power" — knowing when to use attraction and when to use force. A country that only has one column is not powerful, it's predictable.[/CALLOUT]

[KEY-TERMS]
Hard power|Getting your way through coercion or payment — force, sanctions, aid
Soft power|Getting your way through attraction — culture, values, credibility
Smart power|Combining both, and knowing which situation calls for which
Showing the flag|Peacetime ship visits used to build goodwill, not threaten anyone
Gunboat diplomacy|The opposite — using force, or the threat of it, to pressure a country
Public diplomacy|A state engaging foreign publics directly, not just their governments
[/KEY-TERMS]

## Why this topic matters

Three reasons this is worth more than a passing glance.

**It's a lens, not a fact.** Most current affairs you memorise expire in months. Hard vs soft power is a *framework* — once you have it, you can analyse Operation Sindoor, India's vaccine diplomacy during Covid, G20 hosting, Bollywood's reach, or an aircraft carrier commissioning with the same tool. One concept, dozens of possible topics.

**It's where India is genuinely competitive.** India can't outspend larger militaries on hard power. But yoga, cinema, a 32-million-strong diaspora, democratic credibility, and being the country that shipped vaccines to 100+ nations — that's a soft power base most countries can't buy. Understanding this is understanding India's actual strategic position, not the one people assume.

**It's why this ship is in the news at all.** A rival navy is steadily racking up port visits across the Indo-Pacific and beyond, building exactly this kind of familiarity for itself. In that contest, every country that recognises India's flag on sight is worth more than it was a decade ago. Sudarshini isn't a photo-op — she's a cheap, slow, deliberate move in a long game.

[SSB-PI]**If asked:** "Give a recent example of India using soft power in its foreign policy."

**Say:** "Sir, INS Sudarshini, the Navy's sail training ship, reached Lisbon on 22 August 2026 — her fifteenth port call in seven months. She's unarmed and crewed largely by officer cadets, so her purpose isn't deterrence — it's soft power, what Joseph Nye described as getting preferred outcomes through attraction rather than coercion or payment. Navies call it 'showing the flag.' It reflects India using more than one instrument in its foreign policy toolkit, which I'd argue is a sign of strategic maturity rather than weakness."[/SSB-PI]

[SSB-GD]Don't argue whether this "matters" or not — that's the wrong fight. The sharper point is sequencing: soft power builds the trust that makes harder, costlier cooperation possible later.[/SSB-GD]

[DETAILS:Go deeper — the full picture]
## Two toolkits, one navy

Every navy runs two playbooks. One threatens — destroyers, submarines, missile tests. The other is built to be liked — training ships, disaster relief, a band playing on a foreign quay. Sudarshini belongs entirely to the second kind: a barque, an old wind-powered design the Navy keeps around for exactly one reason — she can't fight.

[IMAGE:/Blog_Images/Lokayan_2.jpeg|Sailing up the Tagus River into Lisbon]

### Why India bothers with a 300-year-old ship design

- **It gets a "yes" where a warship gets a polite "no thanks."** Smaller nations wary of picking sides in a rivalry don't hesitate to host an unarmed training ship.
- **The cadets on board are the actual product.** They're learning celestial navigation and seamanship while getting a crash course in representing India to people who've never met an Indian sailor.
- **It reaches people warships never get near.** Cross-deck visits, a cultural evening, a stop to meet the local Indian diaspora.
- **It buys presence without buying enemies.** Every extra port on the map is a cheap, low-friction claim to India being a familiar name.

[CALLOUT]Sudarshini isn't the first of her kind to do this — her sister ship, INS Tarangini, has circled the globe on similar training cruises before her. This is a Navy tradition, not a one-off gesture.[/CALLOUT]

### Where the sailing stops being enough

- **Deterrence** — nobody redraws a war plan because a sail ship dropped by.
- **Crisis response** — if citizens need evacuating tomorrow, this isn't the ship coming to get them.
- **Hard bargaining power** — you don't renegotiate a trade deal on the strength of one friendly port call.

[QUOTE]Soft power doesn't replace hard power. It buys the meeting where hard power gets discussed.[/QUOTE]

[SSB-LECTURETTE]**Suggested structure (under 3 minutes):**
1. Open with the image — an unarmed Navy ship sailing up a European river, cadets on the rigging, nothing but a warm welcome waiting
2. Name the concept — naval or soft diplomacy, presence built on trust rather than threat
3. Give it a term worth remembering — "showing the flag"
4. Balance it — soft power buys access and goodwill, but can't deter, evacuate, or force a negotiation
5. Land it — a country using both toolkits together is running a mature foreign policy[/SSB-LECTURETTE]

Nobody makes a friend by sailing in with the guns pointed at the horizon. Sudarshini doesn't carry any — and that's exactly why Lisbon rolled out the welcome.
[/DETAILS]`;

      await pool.query(`
        INSERT INTO articles (title, category, summary, content, tags, is_published, published_at, reading_time, difficulty, ssb_relevance, slug)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7, $8, $9)
        ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
          title         = EXCLUDED.title,
          category      = EXCLUDED.category,
          summary       = EXCLUDED.summary,
          content       = EXCLUDED.content,
          tags          = EXCLUDED.tags,
          reading_time  = EXCLUDED.reading_time,
          difficulty    = EXCLUDED.difficulty,
          ssb_relevance = EXCLUDED.ssb_relevance
      `, [
        "INS Sudarshini's Voyage of Soft Power",
        'polity',
        "An unarmed Navy training ship just made her 15th goodwill port call in seven months. Hard power vs soft power — the one framework that unlocks a dozen GD topics.",
        sudarshiniContent,
        ['geopolitics', 'soft-power', 'hard-power', 'naval-diplomacy', 'indian-navy', 'lokayan', 'foreign-policy'],
        '4 min',
        'Beginner',
        ['GD Topics', 'Lecturette', 'PI'],
        'ins-sudarshini-lokayan-2026',
      ]);
      console.log('✓ Seeded article: INS Sudarshini\'s Voyage of Soft Power');
    }

    // Seed Terrier Cyber Quest 2026 article. Upserts on slug like the others.
    {
      const tcqContent = `## The Army is asking for your code. Registration closes 31 August.

The Territorial Army has opened **Terrier Cyber Quest 2026 (TCQ 3.0)** — a national-level hackathon, run with CyberPeace, hunting for indigenous solutions to real defence and cybersecurity problems. It is free to enter, open to students, and it closes on **31 August 2026**.

If you are an SSB aspirant with any technical ability at all, read the next section carefully. This is not a coding competition you enter for a certificate.

[CALLOUT]No registration fee. Open to Indian students, professionals, ethical hackers and researchers. Teams of up to 3–4 depending on the track.[/CALLOUT]

[CTA:Register free — closes 31 August|https://www.cyberchallenge.in/tcq2026]

## Why this matters for your SSB — more than you think

Every aspirant has heard that the SSB rewards **Officer Like Qualities**. Almost everyone tries to demonstrate them by talking. This is a chance to demonstrate them by *doing*.

**1. It puts real evidence on your PIQ.** Your Personal Information Questionnaire asks what you do outside academics. "Interested in technology" is a claim. "Competed in the Territorial Army's national cyber hackathon, built a deepfake-detection model, cleared the online qualifier" is **evidence**. The IO cannot cross-examine an interest. They can only explore an achievement — and that conversation runs in your favour.

**2. It survives contact with the interview.** Interviewing Officers probe claims until they break. A hobby you listed but never acted on breaks in about ninety seconds. A project you actually built does not — you can explain the problem, your approach, what failed, what you learned. That is precisely the ground where **effective intelligence**, **reasoning ability** and **initiative** become visible instead of asserted.

**3. It is defence-relevant, not generic.** Any hackathon shows technical skill. This one shows technical skill *pointed at national security*, run by the Army itself. It answers the question sitting underneath every SSB interview — "why the armed forces, and what do you actually bring?" — with something concrete.

**4. The OLQs are structural, not incidental.** Look at what the format demands: **initiative** (nobody made you enter), **organising ability** (assembling and running a team), **determination** (a 36-hour finale), **responsibility** (a working deliverable, not an idea), and **courage** (competing nationally with no guarantee). Those are not adjectives you are borrowing. They are things you will have done.

[QUOTE]An interest is something you can talk about. An achievement is something they can question you about — and questioning is where recommendations are won.[/QUOTE]

## The three tracks — there's one for non-coders too

[COMPARE:Track|What you actually do]
Bug Hunting | Online Capture-the-Flag qualifier, then a 36-hour in-person finale finding and documenting vulnerabilities in simulated critical infrastructure
AI Kavach | Build AI/ML solutions for deepfake detection, predictive threat intelligence and anomaly detection
Creators Challenge | Make a 1–3 minute awareness video on deepfakes, phishing, online scams and misinformation
[/COMPARE]

That third track deserves a second look. **Creators Challenge needs no coding at all** — it is storytelling and communication, judged on impact. If you have ever edited a reel, written a script, or explained something clearly on camera, you are eligible. And communication under judgement is the exact skill the SSB screens for.

[CALLOUT]Winners in each track receive medallions, certificates, national recognition — and the opportunity to collaborate with the Territorial Army. That last one is not a line for your PIQ. It is a line for your life.[/CALLOUT]

## Dates you cannot miss

- **31 August 2026** — registration closes. This is the hard deadline.
- **1–10 September 2026** — online shortlisting phase
- **6–8 October 2026** — Grand Finale, New Delhi
- **9 October 2026** — award ceremony

[DETAILS:Go deeper — context, eligibility and how to use this in SSB]
### What is the Territorial Army?

The Territorial Army is India's citizen-soldier force — professionals who keep their civilian careers while serving part-time in uniform. TCQ 3.0 runs under the banner of **75 Years of the Territorial Army**, and the concept behind this hackathon is the TA's own logic applied to the digital domain: civilians contributing real capability to national defence without leaving their day jobs.

That framing is worth remembering. It is a clean, credible answer to "how can a civilian contribute to national security?" — and you would be answering it from experience rather than theory.

### Who can enter

- Indian citizens
- Students, cybersecurity professionals, ethical hackers, Armed Forces personnel and researchers
- Teams of up to 3–4 members, depending on the track
- No registration fee
- Minors need parental consent for the Creators Challenge

### Why the Army is running a hackathon at all

Modern conflict is not only kinetic. Deepfakes, phishing campaigns, misinformation and attacks on critical infrastructure are live threats to national security, and the talent to counter them sits largely outside uniform — in colleges, startups and research labs. Initiatives like TCQ are how a military reaches that talent, and the emphasis on **indigenous** solutions ties directly into Atmanirbhar Bharat in defence technology.

This is also a genuinely good GD and lecturette topic in its own right: civil-military fusion, cyber warfare, indigenisation, the information domain as a battlefield.

[SSB-PI]**If asked:** "What have you done outside academics?" or "How can a civilian contribute to national security?"

**Say:** "Sir, I participated in Terrier Cyber Quest 2026, a national hackathon run by the Territorial Army with CyberPeace. I worked on the [track] challenge, where my team built [what you built]. What it taught me was [specific, honest lesson — including what went wrong]. It also showed me that contributing to national security isn't limited to those in uniform, which is part of why I want to serve formally."

**Only say this if you actually enter.** A fabricated project collapses the moment the IO asks a follow-up question.[/SSB-PI]

[SSB-GD]On topics like cyber warfare, AI in defence, or indigenisation, initiatives like TCQ are a strong concrete example — they show civil-military fusion in practice rather than as theory. Specific examples beat abstract argument in a GD, and this one is recent enough that most of the group won't have it.[/SSB-GD]

[KEY-TERMS]
Territorial Army|India's citizen-soldier force — civilians serving part-time in uniform
CTF (Capture the Flag)|A cybersecurity contest format where you find hidden vulnerabilities
Deepfake|AI-generated fake video or audio impersonating a real person
Civil-military fusion|Channelling civilian talent and technology into defence capability
Atmanirbhar Bharat|India's self-reliance push, including indigenous defence technology
PIQ|Personal Information Questionnaire — the SSB form your interview is built from
[/KEY-TERMS]
[/DETAILS]

## Put thoughts into action

Most aspirants spend the year *preparing to be selected*. A smaller number spend it *becoming the kind of person who gets selected*. The difference is usually visible in what they have actually done.

You have until 31 August. Registration is free and takes minutes.

[CTA:Register on cyberchallenge.in|https://www.cyberchallenge.in/tcq2026]

Then come back and tell us how it went — bring it into a GD room and practise talking about it. That is exactly the kind of thing an IO will ask you to explain.`;

      await pool.query(`
        INSERT INTO articles (title, category, summary, content, tags, is_published, published_at, reading_time, difficulty, ssb_relevance, slug)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7, $8, $9)
        ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
          title         = EXCLUDED.title,
          category      = EXCLUDED.category,
          summary       = EXCLUDED.summary,
          content       = EXCLUDED.content,
          tags          = EXCLUDED.tags,
          reading_time  = EXCLUDED.reading_time,
          difficulty    = EXCLUDED.difficulty,
          ssb_relevance = EXCLUDED.ssb_relevance
      `, [
        'Terrier Cyber Quest 2026: The Army Wants Your Code',
        'defence',
        "The Territorial Army's national hackathon is free, open to students, and closes 31 August. Why entering gives you something for your PIQ that no amount of preparation can fake.",
        tcqContent,
        ['terrier-cyber-quest', 'territorial-army', 'cybersecurity', 'hackathon', 'AI', 'PIQ', 'OLQ', 'opportunity'],
        '4 min',
        'Beginner',
        ['PIQ', 'PI', 'GD Topics'],
        'terrier-cyber-quest-2026',
      ]);
      console.log('✓ Seeded article: Terrier Cyber Quest 2026');
    }

    // Seed "Cut the Noise" study-sources article. Upserts on slug like the others.
    {
      const cutNoiseContent = `## There are ten thousand SSB videos on YouTube. Maybe twenty hours of them are worth your time.

Type "SSB interview" into YouTube and you are handed an infinite feed: day-by-day vlogs, "50 TAT stories with model answers", conference predictions, cut-off news, and a hundred people telling you exactly what to say in the interview.

That feed is not built to get you recommended. It is built to keep you watching. And there is a quiet cost to it — an aspirant who has watched four hundred videos and practised nothing arrives at the board sounding rehearsed, which is the one thing an assessor is trained to spot.

So here is our honest recommendation. **Two playlists. Finish both. Skip almost everything else.** One builds the personality the board is actually testing. The other teaches you the ground you will be standing on.

[CALLOUT]Rule of thumb for any SSB video: if it tells you **what to say**, it is noise. If it tells you **how to think**, or shows you **what the ground actually looks like**, it is signal.[/CALLOUT]

## Source 1 — 5BRCC by Col Yudhvir Singh

[IMAGE:/Blog_Images/SSB_5BRCC_Lakshya.jpg|Col Yudhvir Singh on the 5BRCC approach — The Lakshya Academy]

Col Yudhvir Singh served 27 years in the Indian Army, including Siachen and the Line of Control, and was a **Senior Group Testing Officer at SSB Bhopal and Bangalore**. He now runs The Lakshya Academy. That matters for one simple reason: he has sat on the assessing side of the table, which most of YouTube has not.

**5BRCC** is his framework for personality development. The name unpacks into five habits:

[COMPARE:The habit|What it actually trains]
5-point perception | Seeing any picture, person or situation in five different ways before you settle on one. This is the raw material for PPDT and TAT — and for not being the candidate whose story is the obvious one.
Brainstorming | Research, think, discuss, then conclude. In that order. This is the engine behind GD, Lecturette and GPE.
Role play | Stepping into the other person's position before you judge it. Empathy of the practical kind — the sort that shows up in every "what would you do if" question.
Connectivity | Linking people, events and ideas to each other. In a group discussion it makes you the one who joins the threads, instead of the one adding a sixth unrelated point.
Curiosity | The engine under the other four. Without it, they become an exercise you perform for five days.
[/COMPARE]

Notice what is missing from that list: templates, model answers, lines to memorise. **5BRCC is not a script — it is a set of daily habits.** Watching the playlist end to end changes nothing by itself. Running these five habits on ordinary days is the entire point.

[CTA:Watch the 5BRCC playlist — The Lakshya Academy|https://www.youtube.com/watch?v=w6Rr2YKkf2I&list=PLxZ3LilwEuSVSxNMTx2R4x62CqDBH29TK]

## Source 2 — GTO structures, explained in 3D

[IMAGE:/Blog_Images/SSB_GTO_Structures.jpg|GTO structures rendered in 3D — a full PGT ground laid out end to end, from the playlist]

The second playlist is Ankur Kumar's breakdown of **GTO structure analysis using 3D structures**, covering the **PGT, HGT, Command Task and Final Group Task**.

Here is why it earns a place next to a personality framework. The GTO ground is the one part of the SSB where candidates lose out through plain ignorance rather than personality. They have never seen a start line, a rule board, or how a structure is actually crossed — so the first twenty minutes go on working out what is happening. Twenty minutes is a large slice of what the GTO has to assess you on.

Seeing the structures in 3D fixes exactly that, and nothing more. **It will not get you recommended.** The GTO is not scoring your obstacle knowledge; he is scoring the officer-like qualities you show while solving it. But you cannot show initiative, cooperation or reasoning while you are still working out which colour you are allowed to touch.

[QUOTE]Knowing the rules earns you no marks. Not knowing them costs you the chance to earn any.|The point of the GTO playlist[/QUOTE]

**How to watch it properly:** open a structure video, pause before the solution, solve it on paper yourself, and only then watch the explanation. Passive viewing here is close to worthless — the skill being tested is generating a solution under time pressure, and you cannot practise that by watching someone else do it.

[CTA:Watch the GTO structures playlist — Ankur Kumar|https://www.youtube.com/watch?v=RL6MXcropl8&list=PLpcKHP5W45TNjFaAsvDvTJknfIlBciMA1]

## What to cut, and why

- **"50 TAT stories with best answers"** — memorised stories read as memorised. The psychologist compares your three tests against each other, and borrowed stories do not survive that comparison.
- **OLQ lists learnt as vocabulary** — being able to name fifteen qualities is not the same as having any of them. Nobody is asked to recite the list.
- **Endless day-by-day SSB vlogs** — watch two, to remove the fear of the unknown. The twentieth teaches you nothing further about yourself.
- **Cut-off, date and notification channels** — worth ten minutes a month, not a daily habit disguised as preparation.
- **Anything promising a trick, hack or guaranteed line** — these tests have been running since the 1940s. There is no line the board has not heard.

## A four-week way to use both

- **Week 1 —** Finish the 5BRCC playlist. Then pick one habit and run it daily: five perceptions on one news photograph every morning, written down.
- **Week 2 —** Add brainstorming and connectivity. One current affairs issue a day — argue both sides on paper, then link it to two other events.
- **Week 3 —** Start the GTO playlist. One structure a day, solved on paper first and the explanation watched second. Learn the rules cold, so they stop occupying your attention on the ground.
- **Week 4 —** Stop watching. Talk. Group discussions, lecturettes out loud against a timer, and someone asking you hard questions about your own PIQ.

That last week is the one most aspirants skip, and it is the one that decides things. Every habit in 5BRCC is finally measured in a room with other people in it.

## Then close the laptop

Two playlists. Perhaps twenty hours. After that the returns on watching drop close to zero, and what is left is practice — with people, out loud, being corrected.

The board is not testing how many videos you have watched. It is testing how many thoughts you have actually had, and whether you can hold your own with other people in the room.

[CTA:Practise in a live GD room|/join]`;

      await pool.query(`
        INSERT INTO articles (title, category, summary, content, tags, is_published, published_at, reading_time, difficulty, ssb_relevance, slug)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7, $8, $9)
        ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
          title         = EXCLUDED.title,
          category      = EXCLUDED.category,
          summary       = EXCLUDED.summary,
          content       = EXCLUDED.content,
          tags          = EXCLUDED.tags,
          reading_time  = EXCLUDED.reading_time,
          difficulty    = EXCLUDED.difficulty,
          ssb_relevance = EXCLUDED.ssb_relevance
      `, [
        'Cut the Noise: The Only Two SSB Playlists You Need',
        'defence',
        "Ten thousand SSB videos, and maybe twenty hours worth watching. Col Yudhvir Singh's 5BRCC for personality, a 3D GTO structures playlist for the ground, and a four-week plan for using both.",
        cutNoiseContent,
        ['ssb-preparation', '5BRCC', 'Col Yudhvir Singh', 'GTO', 'PPDT', 'TAT', 'OLQ', 'resources'],
        '5 min',
        'Beginner',
        ['GTO', 'Psychology', 'PI'],
        'cut-the-noise-ssb-sources',
      ]);
      console.log('✓ Seeded article: Cut the Noise — two SSB playlists');
    }

    // Seed Women in India series (4 cards)
    const womenSeries = [
      {
        slug: 'women-workforce-paradox',
        title: 'The Workforce Paradox',
        category: 'economic',
        summary: "India is growing richer — but women are working less. The story behind India's female labour force participation puzzle, and what it means for our economy.",
        tags: ['FLFPR', 'pink-collar', 'women-employment', 'economy', 'care-economy'],
        reading_time: '5 min',
        difficulty: 'Beginner',
      },
      {
        slug: 'women-proxy-representation',
        title: 'Power Without Authority',
        category: 'polity',
        summary: "46.6% of panchayat seats are held by women. But in thousands of villages, their husbands run the office. Meet the Sarpanch Pati — democracy's most stubborn loophole.",
        tags: ['sarpanch-pati', 'proxy-representation', 'panchayati-raj', '73rd-amendment', 'women-in-politics'],
        reading_time: '4 min',
        difficulty: 'Beginner',
      },
      {
        slug: 'women-glass-ceiling',
        title: 'The Invisible Ceiling',
        category: 'economic',
        summary: "Women make up half the entry-level workforce. Only 17% reach the C-suite. The glass ceiling, glass cliff, and broken rung — three invisible forces that stop women at the top.",
        tags: ['glass-ceiling', 'glass-cliff', 'broken-rung', 'corporate-leadership', 'gender-gap'],
        reading_time: '5 min',
        difficulty: 'Intermediate',
      },
      {
        slug: 'women-gender-pay-gap',
        title: 'The Pay Gap Nobody Talks About',
        category: 'economic',
        summary: "For every ₹100 a man earns, a woman earns ₹76 in urban India — and less in rural areas. The gender pay gap is real, measurable, and getting worse at the top.",
        tags: ['gender-pay-gap', 'equal-remuneration', 'unpaid-care-work', 'wage-discrimination', 'women-economy'],
        reading_time: '4 min',
        difficulty: 'Beginner',
      },
      {
        slug: 'women-safety-economy',
        title: 'Safety Is an Economic Problem',
        category: 'socio-cultural',
        summary: "An unsafe city doesn't just endanger women — it locks them out of the economy. The direct link between women's safety, workforce participation, and India's GDP.",
        tags: ['women-safety', 'nirbhaya-fund', 'POCSO', 'safe-cities', 'POSH-act'],
        reading_time: '5 min',
        difficulty: 'Beginner',
      },
      {
        slug: 'women-education-gap',
        title: "Education's Broken Promise",
        category: 'socio-cultural',
        summary: "Girls are enrolling in schools at record rates. Then they disappear before Class 10. The education-to-employment pipeline for women in India — where it works and where it breaks.",
        tags: ['female-education', 'dropout-rate', 'STEM-gender-gap', 'NEP-2020', 'child-marriage'],
        reading_time: '4 min',
        difficulty: 'Beginner',
      },
      {
        slug: 'women-health-india',
        title: 'The Health Silence',
        category: 'socio-cultural',
        summary: "India loses a woman every 2 minutes to preventable causes. Maternal mortality, anaemia, malnutrition, and missing women — the health crisis nobody talks about loudly enough.",
        tags: ['maternal-mortality', 'anaemia', 'missing-women', 'sex-ratio', 'women-health'],
        reading_time: '5 min',
        difficulty: 'Beginner',
      },
    ];
    for (const art of womenSeries) {
      const { rows: exists } = await pool.query('SELECT id FROM articles WHERE slug = $1 LIMIT 1', [art.slug]);
      if (!exists.length) {
        await pool.query(
          `INSERT INTO articles (title, category, summary, content, tags, is_published, published_at, reading_time, difficulty, ssb_relevance, slug)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7, $8, $9)`,
          [art.title, art.category, art.summary, art.summary, art.tags, art.reading_time, art.difficulty, ['GD Topics', 'Lecturette', 'PI'], art.slug]
        );
        console.log(`✓ Seeded article: ${art.title}`);
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'GD',
        subcategory VARCHAR(50),
        scheduled_at TIMESTAMP NOT NULL,
        created_by UUID REFERENCES users(id),
        admin_username VARCHAR(100),
        room_code VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_interests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES scheduled_sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(session_id, user_id)
      )
    `);
    console.log('✓ Schema up to date');

    const server = app.listen(PORT, () =>
      console.log(`SSBCircle backend running on port ${PORT}`)
    );

    startCleanup();

    // ── Graceful shutdown (PM2 / Docker send SIGTERM on restart/deploy) ───────
    function shutdown(signal) {
      console.log(`\n${signal} received — shutting down gracefully`);
      server.close(async () => {
        await pool.end().catch(() => {});
        console.log('Server and DB pool closed. Bye.');
        process.exit(0);
      });
      // Force-exit if graceful shutdown takes > 10 s
      setTimeout(() => process.exit(1), 10_000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
