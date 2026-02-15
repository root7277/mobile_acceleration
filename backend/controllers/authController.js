const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const register = async (req, res) => {
  try {
    const { full_name, region, district, neighborhood, phone_number, username, password } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (full_name, region, district, neighborhood, phone_number, username, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'student')
    `).run(full_name, region, district, neighborhood, phone_number, username, passwordHash);

    const user = db.prepare(`
      SELECT id, full_name, username, role, region, district, neighborhood, phone_number
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'Registration successful',
      user: { ...user, password_hash: undefined },
      token,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare(`
      SELECT id, full_name, username, password_hash, role, region, district, neighborhood, phone_number, is_active
      FROM users WHERE username = ?
    `).get(username);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    delete user.password_hash;

    res.json({
      message: 'Login successful',
      user,
      token,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
};

const getProfile = (req, res) => {
  res.json({ user: req.user });
};

const verifyToken = (req, res) => {
  res.json({ valid: true, user: req.user });
};

module.exports = {
  register,
  login,
  getProfile,
  verifyToken
};
