const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadAvatar } = require('../middlewares/upload.middleware');

router.use(authenticate);

// Profile & Avatar (Tiêu chí 5 & 6)
router.get('/profile', userController.getProfile);
router.put('/profile', uploadAvatar.single('avatar'), userController.updateProfile);

// Change Password (Tiêu chí 7)
router.put('/change-password', userController.changePassword);

// User Preferences (Tiêu chí 8)
router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);

module.exports = router;
