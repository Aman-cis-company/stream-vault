const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authenticate = require('../middlewares/authenticate');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
} = require('../validators/auth.validator');

// Public routes (with auth rate limiting)
router.post('/register', authLimiter, validateRegister, AuthController.register.bind(AuthController));
router.post('/login', authLimiter, validateLogin, AuthController.login.bind(AuthController));
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken.bind(AuthController));
router.post('/logout', validateRefreshToken, AuthController.logout.bind(AuthController));
router.post('/forgot-password', authLimiter, validateForgotPassword, AuthController.forgotPassword.bind(AuthController));
router.post('/reset-password', validateResetPassword, AuthController.resetPassword.bind(AuthController));

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile.bind(AuthController));
router.put('/profile', authenticate, validateUpdateProfile, AuthController.updateProfile.bind(AuthController));
router.post('/logout-others', authenticate, AuthController.logoutOthers.bind(AuthController));

module.exports = router;
