#!/usr/bin/env node
/**
 * Ensures lessons table has content_type column.
 * Run: node backend/scripts/ensureLessonsSchema.js
 */
require('dotenv').config();
const db = require('../config/database');

try {
  const info = db.prepare('PRAGMA table_info(lessons)').all();
  const hasContentType = info.some(col => col.name === 'content_type');

  if (!hasContentType) {
    console.log('Adding content_type column to lessons table...');
    db.prepare('ALTER TABLE lessons ADD COLUMN content_type TEXT DEFAULT "article"').run();
    console.log('OK: content_type column added.');
  } else {
    console.log('OK: content_type column already exists.');
  }
} catch (err) {
  console.error('Schema fix failed:', err.message);
  process.exit(1);
} finally {
  db.close();
}
