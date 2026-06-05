const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/VideoController');
const authenticate = require('../middlewares/authenticate');
const verifySubscription = require('../middlewares/verifySubscription');

// Issue a signed stream URL for a locally-stored episode video
router.post(
  '/token/episode/:episodeId',
  authenticate,
  verifySubscription,
  VideoController.issueEpisodeToken.bind(VideoController)
);

// Issue a short-lived signed stream URL for a locally-stored movie video
router.post(
  '/token/:movieId',
  authenticate,
  verifySubscription,
  VideoController.issueToken.bind(VideoController)
);

// Stream a video file — authenticated via signed token in query string
router.get('/stream/:filename', VideoController.stream.bind(VideoController));

module.exports = router;
