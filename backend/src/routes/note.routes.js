const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// CRUD Notes & Search & Filter
router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.get('/:id', noteController.getNoteById);
router.put('/:id', noteController.updateNote);
router.patch('/:id', noteController.updateNote); // Auto-save support
router.delete('/:id', noteController.deleteNote);

// Pin / Unpin (Tiêu chí 17)
router.patch('/:id/pin', noteController.togglePin);

// Password Protection (Tiêu chí 23 & 24)
router.post('/:id/lock', noteController.lockNote);
router.post('/:id/disable-lock', noteController.disableLock);
router.post('/:id/unlock', noteController.unlockNote);
router.post('/:id/change-lock-password', noteController.changeLockPassword);

module.exports = router;
