const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const {
  createUser, createGoogleUser, linkGoogleToUser,
  findByUsername, findByEmail, findByGoogleId, findById,
  verifyPassword,
} = require('../models/User');
const authMiddleware = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, displayName: user.display_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Email/password register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, displayName, password } = req.body;
    if (!username || !displayName || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (!/^[a-z0-9_]{3,20}$/i.test(username))
      return res.status(400).json({ error: 'Username: 3–20 chars, letters/numbers/underscore only' });
    if (displayName.trim().length < 2)
      return res.status(400).json({ error: 'Display name must be at least 2 characters' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    if (await findByUsername(username))
      return res.status(409).json({ error: 'Username already taken' });

    const user = await createUser(username, displayName.trim(), password);
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Email/password login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const user = await findByUsername(username);
    if (!user || !(await verifyPassword(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid username or password' });

    const { password_hash, ...safeUser } = user;
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Google OAuth ─────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

    // Verify token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // 1. Already linked Google account
    let user = await findByGoogleId(googleId);
    if (!user) {
      // 2. Existing email/password account — link Google to it
      const existing = await findByEmail(email);
      if (existing) {
        user = await linkGoogleToUser(existing.id, googleId, picture);
      } else {
        // 3. Brand new user — create from Google profile
        user = await createGoogleUser(googleId, email, name, picture);
      }
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
