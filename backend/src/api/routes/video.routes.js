const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/VideoController');
const authenticate = require('../middlewares/authenticate');
const verifySubscription = require('../middlewares/verifySubscription');

// Issue a short-lived signed stream URL — requires auth + active subscription
router.post(
  '/token/:movieId',
  authenticate,
  verifySubscription,
  VideoController.issueToken.bind(VideoController)
);

// Stream a video file — authenticated via signed token in query string
router.get('/stream/:filename', VideoController.stream.bind(VideoController));

module.exports = router;
