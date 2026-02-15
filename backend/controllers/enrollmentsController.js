const db = require('../config/database');

const enroll = (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = db.prepare('SELECT id, is_published FROM courses WHERE id = ?').get(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    if (!course.is_published) {
      return res.status(400).json({ error: 'Course is not available for enrollment.' });
    }

    const existing = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course.' });
    }

    db.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)').run(userId, courseId);

    const enrollment = db.prepare(`
      SELECT e.*, c.title as course_title, c.instructor_name
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ? AND e.course_id = ?
    `).get(userId, courseId);

    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Enrollment failed.' });
  }
};

const getMyEnrollments = (req, res) => {
  try {
    const enrollments = db.prepare(`
      SELECT e.*, c.title as course_title, c.description, c.instructor_name, c.course_id as course_code
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(req.user.id);

    const withProgress = enrollments.map(enr => {
      const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(enr.course_id).count;
      const completedCount = db.prepare(`
        SELECT COUNT(*) as count FROM progress p
        JOIN lessons l ON l.id = p.lesson_id
        WHERE p.enrollment_id = ? AND l.course_id = ?
      `).get(enr.id, enr.course_id).count;
      return {
        ...enr,
        progress: lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0,
        completed_lessons: completedCount,
        total_lessons: lessonCount,
        is_completed: completedCount === lessonCount && lessonCount > 0
      };
    });

    res.json(withProgress);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments.' });
  }
};

const getAllEnrollments = (req, res) => {
  try {
    const { courseId, userId } = req.query;
    let sql = `
      SELECT e.*, u.full_name, u.username, u.region, u.district,
        c.title as course_title, c.instructor_name
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      JOIN courses c ON c.id = e.course_id
      WHERE 1=1
    `;
    const params = [];
    if (courseId) { sql += ' AND e.course_id = ?'; params.push(courseId); }
    if (userId) { sql += ' AND e.user_id = ?'; params.push(userId); }
    sql += ' ORDER BY e.enrolled_at DESC';

    const enrollments = db.prepare(sql).all(...params);
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments.' });
  }
};

module.exports = {
  enroll,
  getMyEnrollments,
  getAllEnrollments
};
