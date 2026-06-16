const fs = require('fs');
const path = require('path');
const MovieRepository = require('../repositories/MovieRepository');
const EpisodeRepository = require('../repositories/EpisodeRepository');
const VideoTokenService = require('../services/VideoTokenService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

const VIDEO_MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
};

class VideoController {
  /**
   * POST /api/v1/videos/token/:movieId
   * Requires: authenticate + verifySubscription
   * Returns a short-lived signed stream URL for a locally-stored video.
   */
  async issueToken(req, res) {
    try {
      const movie = await MovieRepository.findById(req.params.movieId);
      if (!movie) {
        return errorResponse(res, MESSAGES.MOVIE_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }

      // Enforce parental controls
      const { ParentalControl } = require('../../models');
      const { isRatingBlocked } = require('../../helpers/parentalFilter');
      const controls = await ParentalControl.findOne({ where: { user_id: req.user.id } });
      if (controls) {
        if (controls.hide_restricted_content && movie.is_age_restricted) {
          return errorResponse(res, 'Access denied due to parental control settings.', STATUS_CODES.FORBIDDEN);
        }
        if (controls.max_rating && isRatingBlocked(movie.content_rating, controls.max_rating)) {
          return errorResponse(res, 'Access denied due to parental control settings.', STATUS_CODES.FORBIDDEN);
        }
      }

      const videoUrl = movie.video_url;
      if (!videoUrl || (!videoUrl.startsWith('/uploads/videos/') && !videoUrl.startsWith('/uploads/hls/'))) {
        return errorResponse(res, MESSAGES.VIDEO_NOT_LOCAL, STATUS_CODES.UNPROCESSABLE_ENTITY);
      }

      // HLS videos are served statically — return the URL directly
      if (videoUrl.startsWith('/uploads/hls/')) {
        return successResponse(res, MESSAGES.VIDEO_TOKEN_ISSUED, { streamUrl: videoUrl, type: 'hls' });
      }

      const filename = path.basename(videoUrl);
      const token = VideoTokenService.generate(req.user.id, filename);
      const streamUrl = `/api/v1/videos/stream/${encodeURIComponent(filename)}?token=${token}`;

      return successResponse(res, MESSAGES.VIDEO_TOKEN_ISSUED, { streamUrl });
    } catch (err) {
      logger.error('VideoController.issueToken error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /api/v1/videos/token/episode/:episodeId
   * Requires: authenticate + verifySubscription
   * Returns a short-lived signed stream URL for a locally-stored episode video.
   */
  async issueEpisodeToken(req, res) {
    try {
      const episode = await EpisodeRepository.findById(req.params.episodeId);
      if (!episode) {
        return errorResponse(res, 'Episode not found', STATUS_CODES.NOT_FOUND);
      }

      // Enforce parental controls on parent series
      const { ParentalControl, Series } = require('../../models');
      const { isRatingBlocked } = require('../../helpers/parentalFilter');
      const series = await Series.findByPk(episode.series_id);
      if (series) {
        const controls = await ParentalControl.findOne({ where: { user_id: req.user.id } });
        if (controls) {
          if (controls.hide_restricted_content && series.is_age_restricted) {
            return errorResponse(res, 'Access denied due to parental control settings.', STATUS_CODES.FORBIDDEN);
          }
          if (controls.max_rating && isRatingBlocked(series.content_rating, controls.max_rating)) {
            return errorResponse(res, 'Access denied due to parental control settings.', STATUS_CODES.FORBIDDEN);
          }
        }
      }

      const videoUrl = episode.video_url;
      if (!videoUrl || (!videoUrl.startsWith('/uploads/videos/') && !videoUrl.startsWith('/uploads/hls/'))) {
        return errorResponse(res, MESSAGES.VIDEO_NOT_LOCAL, STATUS_CODES.UNPROCESSABLE_ENTITY);
      }

      // HLS videos are served statically — return the URL directly
      if (videoUrl.startsWith('/uploads/hls/')) {
        return successResponse(res, MESSAGES.VIDEO_TOKEN_ISSUED, { streamUrl: videoUrl, type: 'hls' });
      }

      const filename = path.basename(videoUrl);
      const token = VideoTokenService.generate(req.user.id, filename);
      const streamUrl = `/api/v1/videos/stream/${encodeURIComponent(filename)}?token=${token}`;

      return successResponse(res, MESSAGES.VIDEO_TOKEN_ISSUED, { streamUrl });
    } catch (err) {
      logger.error('VideoController.issueEpisodeToken error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /api/v1/videos/stream/:filename?token=xxx
   * Token-authenticated video stream with HTTP Range support.
   */
  async stream(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: MESSAGES.UNAUTHORIZED });
      }

      const payload = VideoTokenService.verify(token);
      if (!payload) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: MESSAGES.INVALID_TOKEN });
      }

      // Always use basename to prevent path traversal
      const safeFilename = path.basename(payload.filename);
      if (safeFilename !== decodeURIComponent(req.params.filename)) {
        return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, message: MESSAGES.FORBIDDEN });
      }

      const filePath = path.join(UPLOADS_DIR, 'videos', safeFilename);
      if (!fs.existsSync(filePath)) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.NOT_FOUND });
      }

      const ext = path.extname(safeFilename).toLowerCase();
      const contentType = VIDEO_MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const rangeHeader = req.headers.range;

      // Prevent browser/CDN caching of token-protected content
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (rangeHeader) {
        const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          res.setHeader('Content-Range', `bytes */${fileSize}`);
          return res.sendStatus(416);
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {
      logger.error('VideoController.stream error', { error: err.message });
      if (!res.headersSent) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_ERROR });
      }
    }
  }
}

module.exports = new VideoController();
