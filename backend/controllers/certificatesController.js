const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const generateCertificateId = () => {
  return `CERT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
};

const checkAndCreateCertificate = (enrollmentId, userId, courseId) => {
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId);
  if (!enrollment) return null;

  const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?').get(courseId).count;
  const completedCount = db.prepare(`
    SELECT COUNT(*) as count FROM progress p
    JOIN lessons l ON l.id = p.lesson_id
    WHERE p.enrollment_id = ? AND l.course_id = ?
  `).get(enrollmentId, courseId).count;

  if (lessonCount === 0 || completedCount < lessonCount) return null;

  const existing = db.prepare('SELECT * FROM certificates WHERE enrollment_id = ?').get(enrollmentId);
  if (existing) return existing;

  const certificateId = generateCertificateId();
  const completionDate = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO certificates (certificate_id, user_id, course_id, enrollment_id, completion_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(certificateId, userId, courseId, enrollmentId, completionDate);

  return db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid);
};

const getMyCertificates = (req, res) => {
  try {
    const certificates = db.prepare(`
      SELECT cert.*, c.title as course_title, c.instructor_name
      FROM certificates cert
      JOIN courses c ON c.id = cert.course_id
      WHERE cert.user_id = ?
      ORDER BY cert.completion_date DESC
    `).all(req.user.id);
    res.json(certificates);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates.' });
  }
};

const getCertificateByCode = (req, res) => {
  try {
    const { code } = req.params;
    const cert = db.prepare(`
      SELECT cert.*, u.full_name, c.title as course_title, c.instructor_name
      FROM certificates cert
      JOIN users u ON u.id = cert.user_id
      JOIN courses c ON c.id = cert.course_id
      WHERE cert.certificate_id = ?
    `).get(code);

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    res.json(cert);
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Verification failed.' });
  }
};

const createCertificateForEnrollment = (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    const cert = checkAndCreateCertificate(enrollment.id, enrollment.user_id, enrollment.course_id);
    if (!cert) {
      return res.status(400).json({ error: 'Course not yet completed. Complete all lessons first.' });
    }

    const fullCert = db.prepare(`
      SELECT cert.*, u.full_name, c.title as course_title, c.instructor_name
      FROM certificates cert
      JOIN users u ON u.id = cert.user_id
      JOIN courses c ON c.id = cert.course_id
      WHERE cert.id = ?
    `).get(cert.id);

    res.status(201).json(fullCert);
  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({ error: 'Failed to create certificate.' });
  }
};

module.exports = {
  getMyCertificates,
  getCertificateByCode,
  createCertificateForEnrollment,
  checkAndCreateCertificate,
  generateCertificateId
};
