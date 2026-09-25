const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const {
  createGoogleUser, linkGoogleToUser,
  findByEmail, findByGoogleId, findById, saveOnboarding,
} = require('../models/User');
const authMiddleware = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, displayName: user.display_name, email: user.email || '' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Google OAuth (only sign-in method) ───────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Find existing Google account, or link to existing email account, or create new
    let user = await findByGoogleId(googleId);
    if (!user) {
      const existing = await findByEmail(email);
      user = existing
        ? await linkGoogleToUser(existing.id, googleId, picture)
        : await createGoogleUser(googleId, email, name, picture);
    }

    const { password_hash, ...safeUser } = user;
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// ── Me ───────────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── Onboarding ───────────────────────────────────────────────────────────────
// Saved from the welcome screen shown once after the first Google sign-in, and
// re-used by the profile page for later edits. Only the exam is required. Phone
// is optional on purpose: it is the field most likely to lose a signup, and the
// one that carries real obligations once held.
// Keep these two lists in step with frontend/src/data/examTypes.js.
const EXAM_TYPES = [
  'NDA', 'CDS', 'AFCAT', 'SSC Tech (Army)', 'TGC (Army)',
  'Navy (Tech)', 'Navy (Non-Tech)', 'Other',
];

const REFERRAL_SOURCES = [
  'Instagram', 'YouTube', 'WhatsApp group', 'Telegram',
  'A friend or coursemate', 'Google search', 'Coaching academy', 'Other',
];

// Accepts a 10-digit Indian mobile, with or without +91 and any spacing.
// Returns a canonical +91XXXXXXXXXX, null when blank, false when unusable.
function normalizePhone(input) {
  const v = String(input == null ? '' : input).replace(/[\s()-]/g, '').trim();
  if (!v) return null;
  const m = v.match(/^(?:\+?91)?([6-9]\d{9})$/);
  return m ? '+91' + m[1] : false;
}

router.post('/me/onboarding', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};

    const name = String(body.display_name || '').trim();
    if (name.length < 2 || name.length > 60)
      return res.status(400).json({ error: 'Please enter your name.' });

    const exam = String(body.exam_type || '').trim();
    if (!EXAM_TYPES.includes(exam))
      return res.status(400).json({ error: 'Please choose which exam you are preparing for.' });

    const phone = normalizePhone(body.phone);
    if (phone === false)
      return res.status(400).json({ error: 'That does not look like an Indian mobile number. Enter 10 digits, or leave it blank.' });

    const source = String(body.referral_source || '').trim();
    if (source && !REFERRAL_SOURCES.includes(source))
      return res.status(400).json({ error: 'Please pick one of the listed options.' });

    const user = await saveOnboarding(req.userId, {
      display_name:    name,
      phone,
      exam_type:       exam,
      referral_source: source || null,
    });
    res.json({ user });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Could not save your details' });
  }
});

module.exports = router;
