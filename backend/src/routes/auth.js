const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const {
  createGoogleUser, linkGoogleToUser,
  findByEmail, findByGoogleId, findById,
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

module.exports = router;
