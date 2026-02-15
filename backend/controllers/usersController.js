const db = require('../config/database');

const getAllUsers = (req, res) => {
  try {
    const { role, region, search, limit = 50, offset = 0 } = req.query;
    let sql = `
      SELECT id, full_name, username, role, region, district, neighborhood, phone_number, created_at
      FROM users WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (region) {
      sql += ' AND region = ?';
      params.push(region);
    }
    if (search) {
      sql += ' AND (full_name LIKE ? OR username LIKE ? OR region LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = db.prepare(sql).all(...params);

    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    if (role) { countSql += ' AND role = ?'; countParams.push(role); }
    if (region) { countSql += ' AND region = ?'; countParams.push(region); }
    if (search) {
      countSql += ' AND (full_name LIKE ? OR username LIKE ? OR region LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    const countResult = db.prepare(countSql).get(...countParams);

    res.json({ users, total: countResult?.total ?? users.length });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

const getUserById = (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare(`
      SELECT id, full_name, username, role, region, district, neighborhood, phone_number, created_at
      FROM users WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Students can only view their own profile for non-admin
    if (req.user.role === 'student' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

const getCurrentUserStats = (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = db.prepare(`
      SELECT e.id, e.course_id, e.enrolled_at, c.title as course_title, c.instructor_name
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(userId);

    const certificates = db.prepare(`
      SELECT cert.*, c.title as course_title
      FROM certificates cert
      JOIN courses c ON c.id = cert.course_id
      WHERE cert.user_id = ?
      ORDER BY cert.completion_date DESC
    `).all(userId);

    const activityLogs = db.prepare(`
      SELECT action, entity_type, created_at
      FROM activity_logs WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).all(userId);

    const progressData = enrollments.map(enr => {
      const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(enr.course_id).count;
      const completedCount = db.prepare(`
        SELECT COUNT(*) as count FROM progress p
        JOIN lessons l ON l.id = p.lesson_id
        WHERE p.enrollment_id = ? AND l.course_id = ?
      `).get(enr.id, enr.course_id).count;
      return {
        ...enr,
        course_id: undefined,
        progress: lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0,
        completed_lessons: completedCount,
        total_lessons: lessonCount,
        is_completed: completedCount === lessonCount && lessonCount > 0
      };
    });

    res.json({
      enrollments: progressData,
      certificates,
      activity_logs: activityLogs,
      stats: {
        total_enrollments: enrollments.length,
        completed_courses: progressData.filter(p => p.is_completed).length,
        total_certificates: certificates.length
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics.' });
  }
};

const updatePreferredLanguage = (req, res) => {
  try {
    const { language } = req.body;
    const allowed = ['en', 'uz', 'ru'];
    if (!allowed.includes(language)) {
      return res.status(400).json({ error: 'Invalid language. Use en, uz, or ru.' });
    }
    db.prepare('UPDATE users SET preferred_language = ? WHERE id = ?').run(language, req.user.id);
    req.user.preferred_language = language;
    res.json({ preferred_language: language });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ error: 'Failed to update language.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getCurrentUserStats,
  updatePreferredLanguage
};
