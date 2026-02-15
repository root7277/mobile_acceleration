const db = require('../config/database');

const getLessonsByCourse = (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = db.prepare(`
      SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index, id
    `).all(courseId);
    res.json(lessons);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch lessons.' });
  }
};

const getLessonById = (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Lesson ID is required.' });

    let row;
    try {
      row = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    } catch (sqlErr) {
      console.error('SQL Error:', sqlErr);
      return res.status(500).json({ error: 'Database error. Run: node backend/scripts/ensureLessonsSchema.js' });
    }

    if (!row) return res.status(404).json({ error: 'Lesson not found in database' });

    const lesson = {
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      description: row.description ?? '',
      content_type: (row.content_type || 'article').toLowerCase(),
      content: row.content ?? '',
      video_url: row.video_url ?? null,
      external_video_url: row.external_video_url ?? null,
      file_url: row.file_url ?? null,
      duration: row.duration ?? 0,
      order_index: row.order_index ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    res.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson.' });
  }
};

const emptyToNull = (v) => (v === '' || v === undefined || v === null ? null : v);
const emptyToBlank = (v) => (v === undefined || v === null ? '' : String(v));

const createLesson = (req, res) => {
  try {
    const { course_id, title, description, content_type, content, video_url, external_video_url, file_url, duration, order_index } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Lesson title is required.' });
    const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const ct = ['video', 'article', 'file'].includes((content_type || '').toLowerCase()) ? (content_type || 'article').toLowerCase() : 'article';
    const idx = order_index !== undefined ? parseInt(order_index) : (db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 as n FROM lessons WHERE course_id = ?').get(course_id).n);

    const result = db.prepare(`
      INSERT INTO lessons (course_id, title, description, content_type, content, video_url, external_video_url, file_url, duration, order_index, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      course_id,
      String(title).trim(),
      emptyToBlank(description),
      ct,
      emptyToNull(content) ?? '',
      emptyToNull(video_url),
      emptyToNull(external_video_url),
      emptyToNull(file_url),
      parseInt(duration) || 0,
      idx
    );

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson.' });
  }
};

const updateLesson = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content_type, content, video_url, external_video_url, file_url, duration, order_index } = req.body;

    const existing = db.prepare('SELECT id FROM lessons WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Lesson not found.' });

    const updates = [];
    const params = [];
    const urlFields = ['video_url', 'external_video_url', 'file_url'];
    const setVal = (k, v) => {
      if (v === undefined) return;
      updates.push(`${k} = ?`);
      if (k === 'duration' || k === 'order_index') params.push(parseInt(v) || 0);
      else if (urlFields.includes(k)) params.push(emptyToNull(v));
      else if (k === 'content_type') params.push(['video', 'article', 'file'].includes((v || '').toLowerCase()) ? (v || 'article').toLowerCase() : 'article');
      else if (k === 'content') params.push(v === null || v === '' ? '' : String(v));
      else params.push(v === null || v === '' ? '' : String(v));
    };
    setVal('title', title);
    setVal('description', description);
    if (content_type !== undefined) setVal('content_type', content_type);
    setVal('content', content);
    setVal('video_url', video_url);
    setVal('external_video_url', external_video_url);
    setVal('file_url', file_url);
    setVal('duration', duration);
    setVal('order_index', order_index);
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    res.json(lesson);
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson.' });
  }
};

const deleteLesson = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM lessons WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Lesson not found.' });
    db.prepare('DELETE FROM lessons WHERE id = ?').run(id);
    res.json({ message: 'Lesson deleted.' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson.' });
  }
};

const reorderLessons = (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonIds } = req.body;
    if (!Array.isArray(lessonIds)) return res.status(400).json({ error: 'lessonIds array required.' });

    const updateStmt = db.prepare('UPDATE lessons SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND course_id = ?');
    lessonIds.forEach((lid, idx) => updateStmt.run(idx, lid, courseId));

    const lessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index').all(courseId);
    res.json(lessons);
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder.' });
  }
};

module.exports = {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons
};
