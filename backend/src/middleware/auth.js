const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    req.displayName = payload.displayName;
    req.email = payload.email || '';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
