const express = require('express');
const router = express.Router();
const ParentalControlsController = require('../controllers/ParentalControlsController');
const authenticate = require('../middlewares/authenticate');

router.get('/', authenticate, ParentalControlsController.get.bind(ParentalControlsController));
router.post('/', authenticate, ParentalControlsController.save.bind(ParentalControlsController));
router.post('/verify-pin', authenticate, ParentalControlsController.verifyPin.bind(ParentalControlsController));

module.exports = router;
