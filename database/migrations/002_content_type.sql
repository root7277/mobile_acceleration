-- Migration: Add content_type to lessons for video/article/file
ALTER TABLE lessons ADD COLUMN content_type TEXT DEFAULT 'article';
