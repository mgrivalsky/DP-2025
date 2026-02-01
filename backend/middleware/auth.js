const jwt = require('jsonwebtoken');

// Allow disabling auth via env (default: auth ENABLED)
// Set DISABLE_AUTH=true to bypass token checks (dev-only).
const DISABLE_AUTH = String(process.env.DISABLE_AUTH || '').toLowerCase() === 'true';

const authenticateToken = (req, res, next) => {
  if (DISABLE_AUTH) {
    // Pass through with a minimal user identity for downstream logic
    req.user = req.user || { id: 2, role: 'ucitel', email: 'ucitel@skolka.sk' };
    return next();
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET nie je nastavený na serveri' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Prístup odmietnutý - chýba token' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Neplatný token' });
  }
};

module.exports = { authenticateToken };
