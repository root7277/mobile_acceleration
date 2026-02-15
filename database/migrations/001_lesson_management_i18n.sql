-- Migration: Lesson Management System, lesson_progress, preferred_language
-- Run this migration to extend the existing schema
-- SQLite-compatible: no non-constant DEFAULT in ALTER TABLE

-- Add preferred_language to users
ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'en';

-- Extend lessons table with new columns (no CURRENT_TIMESTAMP in ALTER - SQLite restriction)
ALTER TABLE lessons ADD COLUMN content TEXT;
ALTER TABLE lessons ADD COLUMN video_url TEXT;
ALTER TABLE lessons ADD COLUMN external_video_url TEXT;
ALTER TABLE lessons ADD COLUMN file_url TEXT;
ALTER TABLE lessons ADD COLUMN duration INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN updated_at DATETIME;

-- Trigger to auto-maintain lessons.updated_at on UPDATE
CREATE TRIGGER IF NOT EXISTS trigger_lessons_updated_at
AFTER UPDATE ON lessons
FOR EACH ROW
BEGIN
  UPDATE lessons SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Create lesson_progress table for video watch tracking and completion
CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    video_watch_percent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
