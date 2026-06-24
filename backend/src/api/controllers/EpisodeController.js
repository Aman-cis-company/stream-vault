const EpisodeService = require('../services/EpisodeService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class EpisodeController {
  async create(req, res) {
    try {
      const episode = await EpisodeService.create(req.params.seriesId, req.body, req.files, req.user.id);
      return successResponse(res, MESSAGES.EPISODE_CREATED, { episode }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('EpisodeController.create error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(req, res) {
    try {
      const episodes = await EpisodeService.getBySeriesId(req.params.seriesId);

      const { checkUserSubscription } = require('../helpers/subscriptionChecker');
      const isSubscribed = await checkUserSubscription(req.user);
      if (!isSubscribed) {
        episodes.forEach(ep => {
          if (ep.setDataValue) {
            ep.setDataValue('video_url', null);
            ep.setDataValue('provider_video_id', null);
          } else {
            ep.video_url = null;
            ep.provider_video_id = null;
          }
        });
      }

      return successResponse(res, MESSAGES.EPISODES_FETCHED, { episodes });
    } catch (err) {
      logger.error('EpisodeController.getAll error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.SERIES_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(req, res) {
    try {
      const episode = await EpisodeService.getById(req.params.seriesId, req.params.episodeId);

      const { checkUserSubscription } = require('../helpers/subscriptionChecker');
      const isSubscribed = await checkUserSubscription(req.user);
      if (!isSubscribed && episode) {
        if (episode.setDataValue) {
          episode.setDataValue('video_url', null);
          episode.setDataValue('provider_video_id', null);
        } else {
          episode.video_url = null;
          episode.provider_video_id = null;
        }
      }

      return successResponse(res, MESSAGES.EPISODE_FETCHED, { episode });
    } catch (err) {
      logger.error('EpisodeController.getById error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.EPISODE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async update(req, res) {
    try {
      const episode = await EpisodeService.update(req.params.seriesId, req.params.episodeId, req.body, req.files, req.user.id);
      return successResponse(res, MESSAGES.EPISODE_UPDATED, { episode });
    } catch (err) {
      logger.error('EpisodeController.update error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.EPISODE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(req, res) {
    try {
      await EpisodeService.delete(req.params.seriesId, req.params.episodeId);
      return successResponse(res, MESSAGES.EPISODE_DELETED);
    } catch (err) {
      logger.error('EpisodeController.delete error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.EPISODE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getTranscodingStatus(req, res) {
    try {
      const episode = await EpisodeService.getById(req.params.seriesId, req.params.episodeId);
      return successResponse(res, 'Transcoding status fetched', {
        transcoding_status: episode.transcoding_status,
        video_url: episode.video_url,
      });
    } catch (err) {
      logger.error('EpisodeController.getTranscodingStatus error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.EPISODE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new EpisodeController();
