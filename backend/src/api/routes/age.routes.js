const express = require('express');
const router = express.Router();
const AgeController = require('../controllers/AgeController');
const authenticate = require('../middlewares/authenticate');

router.post('/verify', authenticate, AgeController.verify.bind(AgeController));
router.get('/status', authenticate, AgeController.status.bind(AgeController));

module.exports = router;
