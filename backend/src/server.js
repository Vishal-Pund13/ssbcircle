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
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS host_reminder_sent BOOLEAN DEFAULT false`);

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
        INSERT INTO articles (title, category, summary, content, tags, is_published, published_at, reading_time, difficulty, ssb_relevance)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7, $8)
      `, [
        'The Rupee Story: Why India\'s Currency Falls — and Why That\'s Not Always Bad',
        'economic',
        'India\'s rupee hit ₹90 per dollar in 2025. But is a falling rupee always bad? This beginner-friendly explainer breaks down currency depreciation, its causes, who wins and who loses — and how to discuss it confidently in SSB GD, Lecturette and PI.',
        content,
        ['economy', 'rupee', 'RBI', 'forex', 'current-affairs', 'GD-topics', 'lecturette', 'PI-prep'],
        '8 min',
        'Beginner',
        ['GD Topics', 'Lecturette', 'PI'],
      ]);
      console.log('✓ Seeded first article: The Rupee Story');
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
