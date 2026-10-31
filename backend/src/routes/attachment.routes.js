const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadAttachments } = require('../middlewares/upload.middleware');

// Download attachment (public or protected)
router.get('/:id/download', attachmentController.downloadAttachment);

// Protected routes
router.use(authenticate);

// Upload multiple attachments to note (Tiêu chí 15 & 16)
router.post('/notes/:noteId', uploadAttachments.array('files', 10), attachmentController.uploadNoteAttachments);

// Delete attachment
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;
