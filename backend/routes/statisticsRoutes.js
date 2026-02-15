const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/overview', auth, requireRole('admin', 'super_admin'), statisticsController.getOverview);
router.get('/by-region', auth, requireRole('admin', 'super_admin'), statisticsController.getByRegion);
router.get('/by-district', auth, requireRole('admin', 'super_admin'), statisticsController.getByDistrict);
router.get('/by-neighborhood', auth, requireRole('admin', 'super_admin'), statisticsController.getByNeighborhood);
router.get('/courses', auth, requireRole('admin', 'super_admin'), statisticsController.getCourseStats);
router.get('/enrollment-trends', auth, requireRole('admin', 'super_admin'), statisticsController.getEnrollmentTrends);

module.exports = router;
