const UserInteractionService = require('../services/UserInteractionService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class UserInteractionController {
  async getStatus(req, res) {
    try {
      const { content_type, content_id } = req.query;
      if (!content_type || !content_id) {
        return errorResponse(res, 'content_type and content_id are required', STATUS_CODES.BAD_REQUEST);
      }
      const status = await UserInteractionService.getStatus(req.user.id, content_type, content_id);
      return successResponse(res, 'Status fetched', status);
    } catch (err) {
      logger.error('UserInteractionController.getStatus error', { error: err.message });
      return errorResponse(res, 'Internal error', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleLike(req, res) {
    try {
      const { content_type, content_id } = req.body;
      if (!content_type || !content_id) {
        return errorResponse(res, 'content_type and content_id are required', STATUS_CODES.BAD_REQUEST);
      }
      const result = await UserInteractionService.toggleLike(req.user.id, content_type, content_id);
      return successResponse(res, result.is_liked ? 'Liked' : 'Like removed', result);
    } catch (err) {
      logger.error('UserInteractionController.toggleLike error', { error: err.message });
      return errorResponse(res, 'Internal error', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleList(req, res) {
    try {
      const { content_type, content_id } = req.body;
      if (!content_type || !content_id) {
        return errorResponse(res, 'content_type and content_id are required', STATUS_CODES.BAD_REQUEST);
      }
      const result = await UserInteractionService.toggleList(req.user.id, content_type, content_id);
      return successResponse(res, result.in_list ? 'Added to list' : 'Removed from list', result);
    } catch (err) {
      logger.error('UserInteractionController.toggleList error', { error: err.message });
      return errorResponse(res, 'Internal error', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getMyList(req, res) {
    try {
      const items = await UserInteractionService.getMyList(req.user.id);
      return successResponse(res, 'My list fetched', { items });
    } catch (err) {
      logger.error('UserInteractionController.getMyList error', { error: err.message });
      return errorResponse(res, 'Internal error', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getLiked(req, res) {
    try {
      const items = await UserInteractionService.getLiked(req.user.id);
      return successResponse(res, 'Liked items fetched', { items });
    } catch (err) {
      logger.error('UserInteractionController.getLiked error', { error: err.message });
      return errorResponse(res, 'Internal error', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async chat(req, res) {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return errorResponse(res, 'Message is required', STATUS_CODES.BAD_REQUEST);
      }
      const response = await UserInteractionService.chat(req.user.id, message);
      return successResponse(res, 'Chat response generated', { response });
    } catch (err) {
      logger.error('UserInteractionController.chat error', { error: err.message });
      return errorResponse(res, 'Internal error', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new UserInteractionController();
