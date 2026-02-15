const express = require('express');
const router = express.Router();
const lessonProgressController = require('../controllers/lessonProgressController');
const { auth } = require('../middleware/auth');

router.post('/complete', auth, lessonProgressController.completeLesson);
router.put('/:lessonId/video-progress', auth, lessonProgressController.updateVideoProgress);

module.exports = router;
