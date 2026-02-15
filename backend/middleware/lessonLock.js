const db = require('../config/database');

const checkLessonAccess = (req, res, next) => {
  if (['admin', 'super_admin'].includes(req.user?.role)) return next();

  const lessonId = req.params.id || req.params.lessonId;
  if (!lessonId) return res.status(400).json({ error: 'Lesson ID is required.' });

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, lesson.course_id);
  if (!enrollment) return res.status(403).json({ locked: true, message: 'Enroll in the course first.' });

  const completedIds = db.prepare(`
    SELECT p.lesson_id FROM progress p
    JOIN lessons l ON l.id = p.lesson_id
    WHERE p.enrollment_id = ? AND l.course_id = ?
  `).all(enrollment.id, lesson.course_id).map(r => r.lesson_id);

  const allLessons = db.prepare('SELECT id, order_index FROM lessons WHERE course_id = ? ORDER BY order_index').all(lesson.course_id);
  const maxCompletedOrder = allLessons
    .filter(l => completedIds.includes(l.id))
    .reduce((max, l) => Math.max(max, l.order_index), -1);

  const thisOrder = allLessons.find(l => l.id == lessonId)?.order_index ?? 0;
  if (thisOrder > maxCompletedOrder + 1) {
    return res.status(403).json({
      locked: true,
      message: 'Complete previous lesson first.',
      required_order: maxCompletedOrder + 1
    });
  }
  next();
};

module.exports = { checkLessonAccess };
