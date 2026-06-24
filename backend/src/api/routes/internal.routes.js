const express = require('express');
const router = express.Router();
const socketServer = require('../../socket');
const EVENTS = require('../../socket/events');
const MovieRepository = require('../repositories/MovieRepository');
const EpisodeRepository = require('../repositories/EpisodeRepository');
const logger = require('../../config/logger');

router.post('/transcode-complete', async (req, res) => {
  const { type, id, status, error } = req.body;
  logger.info('Internal transcode callback received', { type, id, status });

  try {
    if (type === 'movie') {
      const movie = await MovieRepository.findById(id);
      if (movie) {
        socketServer.broadcast(EVENTS.MOVIE_UPDATED, { movie });
      }
    } else if (type === 'episode') {
      const episode = await EpisodeRepository.findById(id);
      if (episode) {
        socketServer.broadcast(EVENTS.SERIES_UPDATED, { seriesId: episode.series_id, episodeId: id });
      }
    }
    
    // Always refresh dashboard statistics
    socketServer.emitToAdmins(EVENTS.DASHBOARD_STATS_UPDATED, { refresh: true });
    socketServer.pushDashboardStats({ refresh: true });

    return res.json({ success: true });
  } catch (err) {
    logger.error('Failed processing internal transcode complete callback', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
