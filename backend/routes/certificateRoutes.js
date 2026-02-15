const express = require('express');
const router = express.Router();
const certificatesController = require('../controllers/certificatesController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/my', auth, certificatesController.getMyCertificates);
router.get('/verify/:code', certificatesController.getCertificateByCode);
router.post('/enrollment/:enrollmentId', auth, certificatesController.createCertificateForEnrollment);

module.exports = router;
