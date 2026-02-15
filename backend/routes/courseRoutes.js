const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const { auth, requireRole } = require('../middleware/auth');
const { courseValidation, handleValidationErrors } = require('../middleware/validation');

router.get('/', coursesController.getAllCourses);
router.get('/:id', coursesController.getCourseById);

router.post('/', auth, requireRole('admin', 'super_admin'), courseValidation, handleValidationErrors, coursesController.createCourse);
router.put('/:id', auth, requireRole('admin', 'super_admin'), coursesController.updateCourse);
router.delete('/:id', auth, requireRole('admin', 'super_admin'), coursesController.deleteCourse);

module.exports = router;
