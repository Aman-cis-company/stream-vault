const SeriesService = require('../services/SeriesService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');
const socketServer = require('../../socket');
const EVENTS = require('../../socket/events');

class SeriesController {
  async create(req, res) {
    try {
      const series = await SeriesService.create(req.body, req.files, req.user.id);
      socketServer.broadcast(EVENTS.SERIES_CREATED, { series });
      socketServer.emitToAdmins(EVENTS.DASHBOARD_STATS_UPDATED, { refresh: true });
      return successResponse(res, MESSAGES.SERIES_CREATED, { series }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('SeriesController.create error', { error: err.message });
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
      const { series, meta } = await SeriesService.getAll(req.query, userControls);

      if (req.user && series && series.length > 0) {
        const { Episode, WatchHistory } = require('../../models');
        const seriesIds = series.map(s => s.id);
        
        const episodes = await Episode.findAll({
          where: { series_id: seriesIds },
          attributes: ['id', 'series_id'],
          raw: true
        });

        const episodeToSeriesMap = {};
        const episodeIds = [];
        episodes.forEach(ep => {
          episodeToSeriesMap[ep.id] = ep.series_id;
          episodeIds.push(ep.id);
        });

        if (episodeIds.length > 0) {
          const watchHistory = await WatchHistory.findAll({
            where: { user_id: req.user.id, episode_id: episodeIds },
            order: [['last_watched_at', 'DESC']],
            raw: true
          });

          const seriesProgress = {};
          const seenSeries = new Set();
          
          watchHistory.forEach(wh => {
            const seriesId = episodeToSeriesMap[wh.episode_id];
            if (seriesId && !seenSeries.has(seriesId)) {
              seenSeries.add(seriesId);
              seriesProgress[seriesId] = parseFloat(wh.completion_percentage);
            }
          });

          series.forEach(s => {
            if (s.dataValues) {
              s.dataValues.progress = seriesProgress[s.id] !== undefined ? seriesProgress[s.id] : null;
            }
            s.progress = seriesProgress[s.id] !== undefined ? seriesProgress[s.id] : null;
          });
        }
      }

      return successResponse(res, MESSAGES.SERIES_FETCHED, { series }, STATUS_CODES.OK, meta);
    } catch (err) {
      logger.error('SeriesController.getAll error', { error: err.message });
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
      const series = await SeriesService.getById(req.params.id, userControls);

      if (req.user && series) {
        const { Episode, WatchHistory } = require('../../models');
        const episodes = await Episode.findAll({
          where: { series_id: series.id },
          attributes: ['id'],
          raw: true
        });
        const epIds = episodes.map(e => e.id);
        if (epIds.length > 0) {
          const lastWatched = await WatchHistory.findOne({
            where: { user_id: req.user.id, episode_id: epIds },
            order: [['last_watched_at', 'DESC']]
          });
          if (lastWatched) {
            if (series.dataValues) {
              series.dataValues.progress = parseFloat(lastWatched.completion_percentage);
            }
            series.progress = parseFloat(lastWatched.completion_percentage);
          }
        }
      }

      return successResponse(res, MESSAGES.SERIES_FETCHED, { series });
    } catch (err) {
      logger.error('SeriesController.getById error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.SERIES_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      if (err.statusCode === 403) {
        return errorResponse(res, err.message || 'Access denied due to parental control restrictions.', STATUS_CODES.FORBIDDEN);
      }
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async update(req, res) {
    try {
      const series = await SeriesService.update(req.params.id, req.body, req.files, req.user.id);

      const newStatus = series.status;
      const prevStatus = req.body._prevStatus;
      if (prevStatus && prevStatus !== newStatus) {
        const event = newStatus === 'published' ? EVENTS.CONTENT_PUBLISHED : EVENTS.CONTENT_UNPUBLISHED;
        socketServer.broadcast(event, { type: 'series', id: series.id, title: series.title });
      } else {
        socketServer.broadcast(EVENTS.SERIES_UPDATED, { series });
      }

      return successResponse(res, MESSAGES.SERIES_UPDATED, { series });
    } catch (err) {
      logger.error('SeriesController.update error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.SERIES_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(req, res) {
    try {
      await SeriesService.delete(req.params.id);
      socketServer.broadcast(EVENTS.SERIES_DELETED, { id: req.params.id });
      socketServer.emitToAdmins(EVENTS.DASHBOARD_STATS_UPDATED, { refresh: true });
      return successResponse(res, MESSAGES.SERIES_DELETED);
    } catch (err) {
      logger.error('SeriesController.delete error', { error: err.message });
      if (err.statusCode === 404) return errorResponse(res, MESSAGES.SERIES_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new SeriesController();
