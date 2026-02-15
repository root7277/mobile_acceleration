const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('admin', 'super_admin'), usersController.getAllUsers);
router.get('/me/stats', auth, usersController.getCurrentUserStats);
router.patch('/me/language', auth, usersController.updatePreferredLanguage);
router.get('/:id', auth, usersController.getUserById);

module.exports = router;
