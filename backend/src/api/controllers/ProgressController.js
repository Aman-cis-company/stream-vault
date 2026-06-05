const WatchProgressRepository = require('../repositories/WatchProgressRepository');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class ProgressController {
  async saveEpisodeProgress(req, res) {
    try {
      const { episodeId } = req.params;
      const { watch_time, duration } = req.body;

      if (watch_time === undefined || watch_time === null) {
        return errorResponse(res, 'watch_time is required', STATUS_CODES.UNPROCESSABLE_ENTITY);
      }

      const watchTimeSec = Math.max(0, Math.floor(Number(watch_time)));
      const durationSec = duration ? Math.max(1, Math.floor(Number(duration))) : null;
      const completionPct = durationSec
        ? Math.min(100, ((watchTimeSec / durationSec) * 100)).toFixed(2)
        : 0;

      const progress = await WatchProgressRepository.upsertEpisodeProgress(
        req.user.id,
        episodeId,
        watchTimeSec,
        completionPct
      );

      return successResponse(res, 'Progress saved', { progress });
    } catch (err) {
      logger.error('ProgressController.saveEpisodeProgress error', { error: err.message });
      return errorResponse(res, 'Failed to save progress', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getEpisodeProgress(req, res) {
    try {
      const { episodeId } = req.params;
      const progress = await WatchProgressRepository.getEpisodeProgress(req.user.id, episodeId);
      return successResponse(res, 'Progress retrieved', { progress: progress ?? null });
    } catch (err) {
      logger.error('ProgressController.getEpisodeProgress error', { error: err.message });
      return errorResponse(res, 'Failed to retrieve progress', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new ProgressController();
