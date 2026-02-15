const db = require('../config/database');

const getOverview = (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('student').count;
    const totalAdmins = db.prepare('SELECT COUNT(*) as count FROM users WHERE role IN (?, ?)').get('admin', 'super_admin')?.count ?? 0;
    const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    const totalEnrollments = db.prepare('SELECT COUNT(*) as count FROM enrollments').get().count;
    const totalCertificates = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;

    const activeUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM activity_logs
      WHERE created_at >= datetime('now', '-30 days')
    `).get().count;

    res.json({
      total_users: totalUsers,
      total_admins: totalAdmins,
      total_courses: totalCourses,
      total_enrollments: totalEnrollments,
      total_certificates: totalCertificates,
      active_users: activeUsers
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
};

const getByRegion = (req, res) => {
  try {
    const regions = db.prepare(`
      SELECT region, COUNT(*) as total_users
      FROM users WHERE role = 'student'
      GROUP BY region ORDER BY total_users DESC
    `).all();

    const stats = regions.map(r => {
      const enrollments = db.prepare(`
        SELECT COUNT(*) as count FROM enrollments e
        JOIN users u ON u.id = e.user_id WHERE u.region = ? AND u.role = 'student'
      `).get(r.region).count;
      const certificates = db.prepare(`
        SELECT COUNT(*) as count FROM certificates cert
        JOIN users u ON u.id = cert.user_id WHERE u.region = ? AND u.role = 'student'
      `).get(r.region).count;
      const activeUsers = db.prepare(`
        SELECT COUNT(DISTINCT al.user_id) as count FROM activity_logs al
        JOIN users u ON u.id = al.user_id
        WHERE u.region = ? AND al.created_at >= datetime('now', '-30 days')
      `).get(r.region).count;
      return { ...r, enrollments, certificates, active_users: activeUsers };
    });

    res.json(stats);
  } catch (error) {
    console.error('Get region stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
};

const getByDistrict = (req, res) => {
  try {
    const { region } = req.query;
    let sql = `
      SELECT 
        u.district,
        u.region,
        COUNT(DISTINCT u.id) as total_users,
        (SELECT COUNT(*) FROM enrollments e 
         JOIN users u2 ON u2.id = e.user_id 
         WHERE u2.district = u.district AND u2.region = u.region) as enrollments,
        (SELECT COUNT(*) FROM certificates cert 
         JOIN users u2 ON u2.id = cert.user_id 
         WHERE u2.district = u.district AND u2.region = u.region) as certificates
      FROM users u
      WHERE u.role = 'student'
    `;
    const params = [];
    if (region) {
      sql += ' AND u.region = ?';
      params.push(region);
    }
    sql += ' GROUP BY u.region, u.district ORDER BY total_users DESC';

    const stats = db.prepare(sql).all(...params);
    res.json(stats);
  } catch (error) {
    console.error('Get district stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
};

const getByNeighborhood = (req, res) => {
  try {
    const { region, district } = req.query;
    let sql = `
      SELECT 
        u.neighborhood,
        u.district,
        u.region,
        COUNT(DISTINCT u.id) as total_users,
        (SELECT COUNT(*) FROM enrollments e 
         JOIN users u2 ON u2.id = e.user_id 
         WHERE u2.neighborhood = u.neighborhood AND u2.district = u.district AND u2.region = u.region) as enrollments
      FROM users u
      WHERE u.role = 'student'
    `;
    const params = [];
    if (region) { sql += ' AND u.region = ?'; params.push(region); }
    if (district) { sql += ' AND u.district = ?'; params.push(district); }
    sql += ' GROUP BY u.region, u.district, u.neighborhood ORDER BY total_users DESC LIMIT 50';

    const stats = db.prepare(sql).all(...params);
    res.json(stats);
  } catch (error) {
    console.error('Get neighborhood stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
};

const getCourseStats = (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        c.id, c.course_id, c.title,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollments,
        (SELECT COUNT(*) FROM certificates WHERE course_id = c.id) as completions
      FROM courses c
      ORDER BY enrollments DESC
    `).all();

    const withRates = stats.map(s => ({
      ...s,
      completion_rate: s.enrollments > 0 ? Math.round((s.completions / s.enrollments) * 100) : 0
    }));

    res.json(withRates);
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
};

const getEnrollmentTrends = (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = db.prepare(`
      SELECT 
        date(enrolled_at) as date,
        COUNT(*) as count
      FROM enrollments
      WHERE enrolled_at >= datetime('now', '-' || ? || ' days')
      GROUP BY date(enrolled_at)
      ORDER BY date
    `).all(parseInt(days) || 30);

    res.json(stats);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
};

module.exports = {
  getOverview,
  getByRegion,
  getByDistrict,
  getByNeighborhood,
  getCourseStats,
  getEnrollmentTrends
};
