const express = require('express');
const router = express.Router();
const enrollmentsController = require('../controllers/enrollmentsController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/course/:courseId', auth, enrollmentsController.enroll);
router.get('/my', auth, enrollmentsController.getMyEnrollments);
router.get('/', auth, requireRole('admin', 'super_admin'), enrollmentsController.getAllEnrollments);

module.exports = router;
