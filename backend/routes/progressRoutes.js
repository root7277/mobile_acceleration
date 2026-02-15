const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { auth } = require('../middleware/auth');

router.post('/enrollment/:enrollmentId/lesson/:lessonId', auth, progressController.markLessonComplete);
router.get('/enrollment/:enrollmentId', auth, progressController.getEnrollmentProgress);

module.exports = router;
