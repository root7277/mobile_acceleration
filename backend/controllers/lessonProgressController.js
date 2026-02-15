const db = require('../config/database');
const { checkAndCreateCertificate } = require('./certificatesController');

const completeLesson = (req, res) => {
  try {
    const { lessonId, enrollmentId, videoWatchPercent } = req.body;
    const userId = req.user.id;

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const enrollment = enrollmentId
      ? db.prepare('SELECT * FROM enrollments WHERE id = ? AND user_id = ?').get(enrollmentId, userId)
      : db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, lesson.course_id);

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });

    const canComplete = (parseInt(videoWatchPercent) >= 90) || req.body.forceComplete;
    if (!canComplete && videoWatchPercent !== undefined) {
      return res.json({ completed: false, message: 'Watch 90% of video or click Mark as completed.' });
    }

    let lp = db.prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId);
    if (lp && lp.completed) {
      const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(lesson.course_id).count;
      const completedCount = db.prepare(`
        SELECT COUNT(*) as count FROM progress p JOIN lessons l ON l.id = p.lesson_id
        WHERE p.enrollment_id = ? AND l.course_id = ?
      `).get(enrollment.id, lesson.course_id).count;
      return res.json({
        message: 'Already completed',
        completed: true,
        progress: lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0,
        is_course_completed: completedCount === lessonCount && lessonCount > 0
      });
    }

    if (lp) {
      db.prepare('UPDATE lesson_progress SET completed = 1, completed_at = CURRENT_TIMESTAMP, video_watch_percent = ? WHERE user_id = ? AND lesson_id = ?')
        .run(Math.min(100, parseInt(videoWatchPercent) || 100), userId, lessonId);
    } else {
      db.prepare('INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, video_watch_percent) VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)')
        .run(userId, lessonId, Math.min(100, parseInt(videoWatchPercent) || 100));
    }

    const existsProgress = db.prepare('SELECT id FROM progress WHERE enrollment_id = ? AND lesson_id = ?').get(enrollment.id, lessonId);
    if (!existsProgress) {
      db.prepare('INSERT INTO progress (enrollment_id, lesson_id) VALUES (?, ?)').run(enrollment.id, lessonId);
    }

    const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(lesson.course_id).count;
    const completedCount = db.prepare(`
      SELECT COUNT(*) as count FROM progress p JOIN lessons l ON l.id = p.lesson_id
      WHERE p.enrollment_id = ? AND l.course_id = ?
    `).get(enrollment.id, lesson.course_id).count;

    const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
    const isCompleted = completedCount === lessonCount && lessonCount > 0;

    let certificate = null;
    if (isCompleted) {
      certificate = checkAndCreateCertificate(enrollment.id, userId, lesson.course_id);
    }

    res.json({
      message: 'Lesson completed',
      completed: true,
      progress,
      completed_lessons: completedCount,
      total_lessons: lessonCount,
      is_course_completed: isCompleted,
      certificate: certificate ? { certificate_id: certificate.certificate_id, completion_date: certificate.completion_date } : null
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ error: 'Failed to complete lesson.' });
  }
};

const updateVideoProgress = (req, res) => {
  try {
    const { lessonId } = req.params;
    const { videoWatchPercent } = req.body;
    const userId = req.user.id;

    const lp = db.prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId);
    if (!lp) {
      db.prepare('INSERT INTO lesson_progress (user_id, lesson_id, completed, video_watch_percent) VALUES (?, ?, 0, ?)')
        .run(userId, lessonId, Math.min(100, parseInt(videoWatchPercent) || 0));
    } else if (!lp.completed) {
      db.prepare('UPDATE lesson_progress SET video_watch_percent = ? WHERE user_id = ? AND lesson_id = ?')
        .run(Math.min(100, parseInt(videoWatchPercent) || 0), userId, lessonId);
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress.' });
  }
};

module.exports = {
  completeLesson,
  updateVideoProgress
};
