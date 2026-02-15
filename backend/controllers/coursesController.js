const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const getAllCourses = (req, res) => {
  try {
    const { search, published } = req.query;
    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
      FROM courses c WHERE 1=1
    `;
    const params = [];

    if (published !== undefined) {
      sql += ' AND c.is_published = ?';
      params.push(published === 'true' ? 1 : 0);
    }
    if (search) {
      sql += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.instructor_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY c.created_at DESC';

    const courses = db.prepare(sql).all(...params);
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
};

const getCourseById = (req, res) => {
  try {
    const { id } = req.params;
    const course = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
      FROM courses c WHERE c.id = ?
    `).get(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const lessons = db.prepare(`
      SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index, id
    `).all(course.id);

    res.json({ ...course, lessons });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course.' });
  }
};

const createCourse = (req, res) => {
  try {
    const { course_id, title, description, instructor_name, lessons = [] } = req.body;

    const existing = db.prepare('SELECT id FROM courses WHERE course_id = ?').get(course_id);
    if (existing) {
      return res.status(400).json({ error: 'Course ID already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO courses (course_id, title, description, instructor_name, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(course_id, title, description || '', instructor_name, req.user.id);

    const courseId = result.lastInsertRowid;

    const validateLessonContent = (l, idx) => {
      const ct = (l.content_type || 'article').toLowerCase();
      const hasVideo = !!(l.video_url || l.external_video_url);
      const hasArticle = !!(l.content && String(l.content).trim());
      const hasFile = !!(l.file_url && String(l.file_url).trim());
      if (ct === 'video' && !hasVideo) throw new Error(`Lesson ${idx + 1}: Video type requires video URL (YouTube/Vimeo).`);
      if (ct === 'article' && !hasArticle) throw new Error(`Lesson ${idx + 1}: Article type requires lesson content.`);
      if (ct === 'file' && !hasFile) throw new Error(`Lesson ${idx + 1}: File type requires attachment URL.`);
      if (!hasVideo && !hasArticle && !hasFile) throw new Error(`Lesson ${idx + 1}: Must have at least one content type (video, article text, or file).`);
    };

    const insertLesson = db.prepare(`
      INSERT INTO lessons (course_id, title, description, content_type, content, video_url, external_video_url, file_url, duration, order_index, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    lessons.forEach((l, idx) => {
      validateLessonContent(l, idx);
      const ct = ['video', 'article', 'file'].includes((l.content_type || '').toLowerCase()) ? (l.content_type || 'article').toLowerCase() : 'article';
      insertLesson.run(
        courseId,
        l.title || `Lesson ${idx + 1}`,
        l.description || '',
        ct,
        l.content || null,
        l.video_url || null,
        l.external_video_url || null,
        l.file_url || null,
        parseInt(l.duration) || 0,
        l.order_index !== undefined ? l.order_index : idx
      );
    });

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    const newLessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index').all(courseId);

    res.status(201).json({ ...course, lessons: newLessons });
  } catch (error) {
    console.error('Create course error:', error);
    const msg = error.message || 'Failed to create course.';
    const code = msg.includes('Lesson') && (msg.includes('requires') || msg.includes('Must have')) ? 400 : 500;
    res.status(code).json({ error: msg });
  }
};

const updateCourse = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, instructor_name, is_published, lessons } = req.body;

    const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (instructor_name !== undefined) { updates.push('instructor_name = ?'); params.push(instructor_name); }
    if (is_published !== undefined) { updates.push('is_published = ?'); params.push(is_published ? 1 : 0); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    if (lessons && Array.isArray(lessons)) {
      const validateLessonContent = (l, idx) => {
        const ct = (l.content_type || 'article').toLowerCase();
        const hasVideo = !!(l.video_url || l.external_video_url);
        const hasArticle = !!(l.content && String(l.content).trim());
        const hasFile = !!(l.file_url && String(l.file_url).trim());
        if (ct === 'video' && !hasVideo) throw new Error(`Lesson ${idx + 1}: Video type requires video URL.`);
        if (ct === 'article' && !hasArticle) throw new Error(`Lesson ${idx + 1}: Article type requires lesson content.`);
        if (ct === 'file' && !hasFile) throw new Error(`Lesson ${idx + 1}: File type requires attachment URL.`);
        if (!hasVideo && !hasArticle && !hasFile) throw new Error(`Lesson ${idx + 1}: Must have at least one content type.`);
      };
      db.prepare('DELETE FROM lessons WHERE course_id = ?').run(id);
      const insertLesson = db.prepare(`
        INSERT INTO lessons (course_id, title, description, content_type, content, video_url, external_video_url, file_url, duration, order_index, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      lessons.forEach((l, idx) => {
        validateLessonContent(l, idx);
        const ct = ['video', 'article', 'file'].includes((l.content_type || '').toLowerCase()) ? (l.content_type || 'article').toLowerCase() : 'article';
        insertLesson.run(
          id, l.title || `Lesson ${idx + 1}`, l.description || '',
          ct, l.content || null, l.video_url || null, l.external_video_url || null, l.file_url || null,
          parseInt(l.duration) || 0, l.order_index !== undefined ? l.order_index : idx
        );
      });
    }

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    const courseLessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index').all(id);

    res.json({ ...course, lessons: courseLessons });
  } catch (error) {
    console.error('Update course error:', error);
    const msg = error.message || 'Failed to update course.';
    const code = msg.includes('Lesson') && (msg.includes('requires') || msg.includes('Must have')) ? 400 : 500;
    res.status(code).json({ error: msg });
  }
};

const deleteCourse = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
