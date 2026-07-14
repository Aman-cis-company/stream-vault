const express = require('express');
const router = express.Router();
const UserInteractionController = require('../controllers/UserInteractionController');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);

router.get('/status', UserInteractionController.getStatus.bind(UserInteractionController));
router.post('/toggle-like', UserInteractionController.toggleLike.bind(UserInteractionController));
router.post('/toggle-list', UserInteractionController.toggleList.bind(UserInteractionController));
router.get('/my-list', UserInteractionController.getMyList.bind(UserInteractionController));
router.get('/liked', UserInteractionController.getLiked.bind(UserInteractionController));
router.post('/chat', UserInteractionController.chat.bind(UserInteractionController));

module.exports = router;
