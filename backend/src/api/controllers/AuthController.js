const AuthService = require('../services/AuthService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class AuthController {
  async register(req, res) {
    try {
      const user = await AuthService.register(req.body);
      return successResponse(res, MESSAGES.REGISTER_SUCCESS, { user }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('AuthController.register error', { error: err.message });
      if (err.statusCode === 409) {
        return errorResponse(res, MESSAGES.EMAIL_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login(email, password);
      return successResponse(res, MESSAGES.LOGIN_SUCCESS, { user, accessToken, refreshToken });
    } catch (err) {
      logger.error('AuthController.login error', { error: err.message });
      if (err.statusCode === 401) {
        return errorResponse(res, MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
      }
      if (err.statusCode === 403) {
        return errorResponse(res, err.message, STATUS_CODES.FORBIDDEN);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;
      const tokens = await AuthService.refreshToken(refresh_token);
      return successResponse(res, MESSAGES.TOKEN_REFRESHED, tokens);
    } catch (err) {
      logger.error('AuthController.refreshToken error', { error: err.message });
      if (err.statusCode === 401) {
        return errorResponse(res, MESSAGES.INVALID_TOKEN, STATUS_CODES.UNAUTHORIZED);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(req, res) {
    try {
      const { refresh_token } = req.body;
      await AuthService.logout(refresh_token);
      return successResponse(res, MESSAGES.LOGOUT_SUCCESS);
    } catch (err) {
      logger.error('AuthController.logout error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);
      // Always return success to avoid user enumeration
      return successResponse(res, MESSAGES.FORGOT_PASSWORD_SUCCESS);
    } catch (err) {
      logger.error('AuthController.forgotPassword error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);
      return successResponse(res, MESSAGES.RESET_PASSWORD_SUCCESS);
    } catch (err) {
      logger.error('AuthController.resetPassword error', { error: err.message });
      if (err.statusCode === 400) {
        return errorResponse(res, MESSAGES.INVALID_RESET_TOKEN, STATUS_CODES.BAD_REQUEST);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getProfile(req, res) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      return successResponse(res, MESSAGES.PROFILE_FETCHED, { user });
    } catch (err) {
      logger.error('AuthController.getProfile error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await AuthService.updateProfile(req.user.id, req.body);
      return successResponse(res, MESSAGES.PROFILE_UPDATED, { user });
    } catch (err) {
      logger.error('AuthController.updateProfile error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new AuthController();
