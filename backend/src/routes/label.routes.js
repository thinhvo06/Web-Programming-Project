const express = require('express');
const router = express.Router();
const labelController = require('../controllers/label.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Label CRUD (Tiêu chí 20)
router.get('/', labelController.getLabels);
router.post('/', labelController.createLabel);
router.put('/:id', labelController.updateLabel);
router.delete('/:id', labelController.deleteLabel);

// Attach labels to note (Tiêu chí 21)
router.post('/notes/:noteId', labelController.setNoteLabels);

module.exports = router;
