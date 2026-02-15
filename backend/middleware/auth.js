const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-me');

    let user;
    try {
      user = db.prepare(`
        SELECT id, full_name, username, role, region, district, neighborhood, phone_number, is_active, preferred_language
        FROM users WHERE id = ?
      `).get(decoded.userId);
    } catch (e) {
      user = db.prepare(`
        SELECT id, full_name, username, role, region, district, neighborhood, phone_number, is_active
        FROM users WHERE id = ?
      `).get(decoded.userId);
      if (user) user.preferred_language = 'en';
    }

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { auth, requireRole };
