const MovieService = require('../services/MovieService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class MovieController {
  async create(req, res) {
    try {
      const movie = await MovieService.create(req.body, req.files, req.user.id);
      return successResponse(res, MESSAGES.MOVIE_CREATED, { movie }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('MovieController.create error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(req, res) {
    try {
      const { movies, meta } = await MovieService.getAll(req.query);
      return successResponse(res, MESSAGES.MOVIES_FETCHED, { movies }, STATUS_CODES.OK, meta);
    } catch (err) {
      logger.error('MovieController.getAll error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(req, res) {
    try {
      const movie = await MovieService.getById(req.params.id);
      return successResponse(res, MESSAGES.MOVIE_FETCHED, { movie });
    } catch (err) {
      logger.error('MovieController.getById error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.MOVIE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async update(req, res) {
    try {
      const movie = await MovieService.update(req.params.id, req.body, req.files, req.user.id);
      return successResponse(res, MESSAGES.MOVIE_UPDATED, { movie });
    } catch (err) {
      logger.error('MovieController.update error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.MOVIE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(req, res) {
    try {
      await MovieService.delete(req.params.id);
      return successResponse(res, MESSAGES.MOVIE_DELETED);
    } catch (err) {
      logger.error('MovieController.delete error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.MOVIE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getTranscodingStatus(req, res) {
    try {
      const movie = await MovieService.getById(req.params.id);
      return successResponse(res, 'Transcoding status fetched', {
        transcoding_status: movie.transcoding_status,
        video_url: movie.video_url,
      });
    } catch (err) {
      logger.error('MovieController.getTranscodingStatus error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.MOVIE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new MovieController();
