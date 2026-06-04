const CategoryService = require('../services/CategoryService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class CategoryController {
  async create(req, res) {
    try {
      const category = await CategoryService.create(req.body, req.user.id);
      return successResponse(res, MESSAGES.CATEGORY_CREATED, { category }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('CategoryController.create error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(req, res) {
    try {
      const { categories, meta } = await CategoryService.getAll(req.query);
      return successResponse(res, MESSAGES.CATEGORIES_FETCHED, { categories }, STATUS_CODES.OK, meta);
    } catch (err) {
      logger.error('CategoryController.getAll error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(req, res) {
    try {
      const category = await CategoryService.getById(req.params.id);
      return successResponse(res, MESSAGES.CATEGORY_FETCHED, { category });
    } catch (err) {
      logger.error('CategoryController.getById error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.CATEGORY_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async update(req, res) {
    try {
      const category = await CategoryService.update(req.params.id, req.body, req.user.id);
      return successResponse(res, MESSAGES.CATEGORY_UPDATED, { category });
    } catch (err) {
      logger.error('CategoryController.update error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.CATEGORY_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(req, res) {
    try {
      await CategoryService.delete(req.params.id);
      return successResponse(res, MESSAGES.CATEGORY_DELETED);
    } catch (err) {
      logger.error('CategoryController.delete error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.CATEGORY_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new CategoryController();
