const express = require('express');
const router = express.Router();
const shareController = require('../controllers/share.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Dedicated "Shared with me" section (Tiêu chí 25)
router.get('/shared-with-me', shareController.getSharedWithMeNotes);

// Share note to email
router.post('/notes/:id/share', shareController.shareNote);

// Get list of users a note is shared with (for note owner)
router.get('/notes/:id/shares', shareController.getNoteShares);

// Update permission (read <=> edit)
router.put('/shares/:shareId', shareController.updateSharePermission);

// Revoke share
router.delete('/shares/:shareId', shareController.revokeShare);

module.exports = router;
