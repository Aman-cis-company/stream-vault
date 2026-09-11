const express = require('express');
const router = express.Router();
const profileController = require('../controllers/ProfileController');
const authenticate = require('../middlewares/authenticate');

// All routes require user authentication
router.use(authenticate);

router.get('/', profileController.getProfiles);
router.post('/', profileController.createProfile);
router.get('/:id', profileController.getProfileById);
router.put('/:id', profileController.updateProfile);
router.delete('/:id', profileController.deleteProfile);
router.post('/:id/verify-pin', profileController.verifyPin);

module.exports = router;
