const jwt = require('jsonwebtoken');

// Temporary: allow disabling auth via env (default: disabled for easier testing)
const DISABLE_AUTH = process.env.DISABLE_AUTH !== 'false';

const authenticateToken = (req, res, next) => {
  if (DISABLE_AUTH) {
    // Pass through with a minimal user identity for downstream logic
    req.user = req.user || { id: 2, role: 'ucitel', email: 'ucitel@skolka.sk' };
    return next();
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
