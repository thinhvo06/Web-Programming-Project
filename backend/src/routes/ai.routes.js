const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// AI Summary (Tiêu chí 27)
router.post('/summary', aiController.summarizeNote);

// AI Q&A with note citations (Tiêu chí 28)
router.post('/qa', aiController.askQuestion);

module.exports = router;
