const db = require('../config/database');

const getLessonStatus = (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    const lessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index, id').all(courseId);

    const completedLessonIds = new Set();
    if (enrollment) {
      const rows = db.prepare(`
        SELECT lesson_id FROM progress WHERE enrollment_id = ?
      `).all(enrollment.id);
      rows.forEach(r => completedLessonIds.add(r.lesson_id));
    }

    const lessonProgress = {};
    try {
      const lpRows = db.prepare(`
        SELECT lesson_id, completed, video_watch_percent FROM lesson_progress WHERE user_id = ?
      `).all(userId);
      lpRows.forEach(r => { lessonProgress[r.lesson_id] = r; });
    } catch (_) {}

    let lastCompletedOrder = -1;
    lessons.forEach((l, idx) => {
      if (completedLessonIds.has(l.id)) lastCompletedOrder = Math.max(lastCompletedOrder, l.order_index);
    });

    const statusList = lessons.map(lesson => {
      const completed = completedLessonIds.has(lesson.id);
      const available = !enrollment ? false : (lesson.order_index <= lastCompletedOrder + 1);
      const locked = enrollment && !available;

      return {
        lesson_id: lesson.id,
        order_index: lesson.order_index,
        title: lesson.title,
        status: completed ? 'completed' : (locked ? 'locked' : 'available'),
        completed,
        available,
        locked,
        video_watch_percent: lessonProgress[lesson.id]?.video_watch_percent || 0
      };
    });

    res.json({
      enrollment_id: enrollment?.id,
      lessons: statusList,
      completed_count: completedLessonIds.size,
      total_count: lessons.length,
      progress: lessons.length > 0 ? Math.round((completedLessonIds.size / lessons.length) * 100) : 0
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get lesson status.' });
  }
};

module.exports = { getLessonStatus };
