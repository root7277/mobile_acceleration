const db = require('../config/database');
const { checkAndCreateCertificate } = require('./certificatesController');

const markLessonComplete = (req, res) => {
  try {
    const { enrollmentId, lessonId } = req.params;
    const userId = req.user.id;

    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ? AND user_id = ?').get(enrollmentId, userId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(lessonId, enrollment.course_id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    const existing = db.prepare('SELECT id FROM progress WHERE enrollment_id = ? AND lesson_id = ?').get(enrollmentId, lessonId);
    if (existing) {
      return res.json({ message: 'Lesson already completed.', completed: true });
    }

    db.prepare('INSERT INTO progress (enrollment_id, lesson_id) VALUES (?, ?)').run(enrollmentId, lessonId);

    const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(enrollment.course_id).count;
    const completedCount = db.prepare(`
      SELECT COUNT(*) as count FROM progress p
      JOIN lessons l ON l.id = p.lesson_id
      WHERE p.enrollment_id = ? AND l.course_id = ?
    `).get(enrollmentId, enrollment.course_id).count;

    const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
    const isCompleted = completedCount === lessonCount && lessonCount > 0;

    let certificate = null;
    if (isCompleted) {
      certificate = checkAndCreateCertificate(enrollmentId, userId, enrollment.course_id);
    }

    res.json({
      message: 'Lesson marked as complete',
      progress,
      completed_lessons: completedCount,
      total_lessons: lessonCount,
      is_course_completed: isCompleted,
      certificate: certificate ? {
        certificate_id: certificate.certificate_id,
        completion_date: certificate.completion_date
      } : null
    });
  } catch (error) {
    console.error('Mark progress error:', error);
    res.status(500).json({ error: 'Failed to update progress.' });
  }
};

const getEnrollmentProgress = (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    const enrollment = db.prepare(`
      SELECT e.*, c.title as course_title
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.id = ? AND e.user_id = ?
    `).get(enrollmentId, userId);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    const lessons = db.prepare(`
      SELECT l.*, p.completed_at as completed
      FROM lessons l
      LEFT JOIN progress p ON p.lesson_id = l.id AND p.enrollment_id = ?
      WHERE l.course_id = ?
      ORDER BY l.order_index, l.id
    `).all(enrollmentId, enrollment.course_id);

    const completedCount = lessons.filter(l => l.completed).length;
    const totalCount = lessons.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    res.json({
      enrollment,
      lessons,
      progress,
      completed_lessons: completedCount,
      total_lessons: totalCount,
      is_completed: completedCount === totalCount && totalCount > 0
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
};

module.exports = {
  markLessonComplete,
  getEnrollmentProgress
};
