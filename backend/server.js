require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const lessonProgressRoutes = require('./routes/lessonProgressRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/lesson-progress', lessonProgressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Initialize database if not exists
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database/mobil_acceleration.db');
if (!fs.existsSync(dbPath)) {
  console.log('Database not found. Run: npm run init-db');
}

app.listen(PORT, () => {
  console.log(`Mobil Acceleration API running on http://localhost:${PORT}`);
});
