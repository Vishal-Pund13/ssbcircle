const rateLimit = require('express-rate-limit');

const msg = (text) => ({ error: text });

// Brute-force protection for login / register / google auth
// 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: msg('Too many attempts. Please wait 15 minutes and try again.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Prevent room spam — 8 rooms per user per hour
const createRoomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: msg('You\'ve created too many rooms. Please wait before creating another.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// General API guard — 120 req/min per IP (covers polling, token fetching, etc.)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: msg('Too many requests. Please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, createRoomLimiter, generalLimiter };
