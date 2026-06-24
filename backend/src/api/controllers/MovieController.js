const MovieService = require('../services/MovieService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');
const socketServer = require('../../socket');
const EVENTS = require('../../socket/events');

class MovieController {
  async create(req, res) {
    try {
      const movie = await MovieService.create(req.body, req.files, req.user.id);
      socketServer.broadcast(EVENTS.MOVIE_CREATED, { movie });
      socketServer.emitToAdmins(EVENTS.DASHBOARD_STATS_UPDATED, { refresh: true });

      const { logActivity } = require('../../helpers/activityLogger');
      logActivity(req.user.id, 'movie_created', { movieId: movie.id, title: movie.title }, req);

      return successResponse(res, MESSAGES.MOVIE_CREATED, { movie }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('MovieController.create error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(req, res) {
    try {
      let userControls = null;
      if (req.user) {
        const { ParentalControl } = require('../../models');
        userControls = await ParentalControl.findOne({ where: { user_id: req.user.id } });
      }
      const { movies, meta } = await MovieService.getAll(req.query, userControls);
      
      if (req.user && movies && movies.length > 0) {
        const { WatchHistory } = require('../../models');
        const { Op } = require('sequelize');
        const watchHistory = await WatchHistory.findAll({
          where: {
            user_id: req.user.id,
            movie_id: { [Op.not]: null },
            episode_id: null
          },
          raw: true
        });

        const progressMap = {};
        watchHistory.forEach(wh => {
          progressMap[wh.movie_id] = parseFloat(wh.completion_percentage);
        });

        movies.forEach(movie => {
          if (movie.dataValues) {
            movie.dataValues.progress = progressMap[movie.id] !== undefined ? progressMap[movie.id] : null;
          }
          movie.progress = progressMap[movie.id] !== undefined ? progressMap[movie.id] : null;
        });
      }

      const { checkUserSubscription } = require('../helpers/subscriptionChecker');
      const isSubscribed = await checkUserSubscription(req.user);
      if (!isSubscribed) {
        movies.forEach(movie => {
          if (movie.setDataValue) {
            movie.setDataValue('video_url', null);
            movie.setDataValue('provider_video_id', null);
          } else {
            movie.video_url = null;
            movie.provider_video_id = null;
          }
        });
      }

      return successResponse(res, MESSAGES.MOVIES_FETCHED, { movies }, STATUS_CODES.OK, meta);
    } catch (err) {
      logger.error('MovieController.getAll error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(req, res) {
    try {
      let userControls = null;
      if (req.user) {
        const { ParentalControl } = require('../../models');
        userControls = await ParentalControl.findOne({ where: { user_id: req.user.id } });
      }
      const movie = await MovieService.getById(req.params.id, userControls);
      
      if (req.user && movie) {
        const { WatchHistory } = require('../../models');
        const wh = await WatchHistory.findOne({
          where: {
            user_id: req.user.id,
            movie_id: movie.id,
            episode_id: null
          }
        });
        if (wh) {
          if (movie.dataValues) {
            movie.dataValues.progress = parseFloat(wh.completion_percentage);
          }
          movie.progress = parseFloat(wh.completion_percentage);
        }
      }

      const { checkUserSubscription } = require('../helpers/subscriptionChecker');
      const isSubscribed = await checkUserSubscription(req.user);
      if (!isSubscribed && movie) {
        if (movie.setDataValue) {
          movie.setDataValue('video_url', null);
          movie.setDataValue('provider_video_id', null);
        } else {
          movie.video_url = null;
          movie.provider_video_id = null;
        }
      }

      return successResponse(res, MESSAGES.MOVIE_FETCHED, { movie });
    } catch (err) {
      logger.error('MovieController.getById error', { error: err.message });
      if (err.statusCode === 404) {
        return errorResponse(res, MESSAGES.MOVIE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }
      if (err.statusCode === 403) {
        return errorResponse(res, err.message || 'Access denied due to parental control restrictions.', STATUS_CODES.FORBIDDEN);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async update(req, res) {
    try {
      const movie = await MovieService.update(req.params.id, req.body, req.files, req.user.id);

      const prevStatus = req.body._prevStatus; // optionally passed by client
      const newStatus = movie.status;
      if (prevStatus && prevStatus !== newStatus) {
        const event = newStatus === 'published' ? EVENTS.CONTENT_PUBLISHED : EVENTS.CONTENT_UNPUBLISHED;
        socketServer.broadcast(event, { type: 'movie', id: movie.id, title: movie.title });
      } else {
        socketServer.broadcast(EVENTS.MOVIE_UPDATED, { movie });
      }

      const { logActivity } = require('../../helpers/activityLogger');
      logActivity(req.user.id, 'movie_updated', { movieId: movie.id, title: movie.title }, req);

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
      socketServer.broadcast(EVENTS.MOVIE_DELETED, { id: req.params.id });
      socketServer.emitToAdmins(EVENTS.DASHBOARD_STATS_UPDATED, { refresh: true });

      const { logActivity } = require('../../helpers/activityLogger');
      logActivity(req.user.id, 'movie_deleted', { movieId: req.params.id }, req);

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

  async updateBannerOrder(req, res) {
    try {
      const { movieIds } = req.body;
      if (!Array.isArray(movieIds)) {
        return errorResponse(res, 'movieIds must be an array of movie IDs', STATUS_CODES.BAD_REQUEST);
      }
      await MovieService.updateBannerOrder(movieIds, req.user.id);
      
      // Broadcast update to client sockets
      socketServer.broadcast(EVENTS.MOVIE_UPDATED, { refreshBanner: true });

      return successResponse(res, 'Banner sequence updated successfully');
    } catch (err) {
      logger.error('MovieController.updateBannerOrder error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new MovieController();
