const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/ProgressController');
const authenticate = require('../middlewares/authenticate');

// Save or update watch progress for an episode
router.put('/episode/:episodeId', authenticate, ProgressController.saveEpisodeProgress.bind(ProgressController));

// Get saved watch progress for an episode
router.get('/episode/:episodeId', authenticate, ProgressController.getEpisodeProgress.bind(ProgressController));

module.exports = router;
