const express = require('express');
const router = express.Router();
const lessonsController = require('../controllers/lessonsController');
const lessonProgressController = require('../controllers/lessonProgressController');
const lessonStatusController = require('../controllers/lessonStatusController');
const { auth, requireRole } = require('../middleware/auth');
const { checkLessonAccess } = require('../middleware/lessonLock');
const { uploadVideo, uploadFile } = require('../middleware/upload');

router.get('/course/:courseId', lessonsController.getLessonsByCourse);
router.get('/course/:courseId/status', auth, lessonStatusController.getLessonStatus);

router.post('/upload-video', auth, requireRole('admin', 'super_admin'), (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Video file too large (max 100MB).' });
      return res.status(400).json({ error: err.message || 'Video upload failed.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No video file.' });
    res.json({ url: `/uploads/videos/${req.file.filename}` });
  });
});
router.post('/upload-file', auth, requireRole('admin', 'super_admin'), (req, res, next) => {
  uploadFile.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 50MB).' });
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file.' });
    res.json({ url: `/uploads/files/${req.file.filename}` });
  });
});

router.get('/:id', auth, checkLessonAccess, lessonsController.getLessonById);
router.post('/', auth, requireRole('admin', 'super_admin'), lessonsController.createLesson);
router.put('/:id', auth, requireRole('admin', 'super_admin'), lessonsController.updateLesson);
router.delete('/:id', auth, requireRole('admin', 'super_admin'), lessonsController.deleteLesson);
router.put('/course/:courseId/reorder', auth, requireRole('admin', 'super_admin'), lessonsController.reorderLessons);

module.exports = router;
