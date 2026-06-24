const express = require('express');
const router = express.Router();
const SeriesController = require('../controllers/SeriesController');
const EpisodeController = require('../controllers/EpisodeController');
const authenticate = require('../middlewares/authenticate');
const checkPermission = require('../middlewares/checkPermission');
const { uploadMovieFiles, handleMulterError } = require('../middlewares/upload');
const tryAuthenticate = require('../middlewares/tryAuthenticate');

const uploadFields = uploadMovieFiles.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// ── Series CRUD ───────────────────────────────────────────────────────────────
router.get('/', tryAuthenticate, SeriesController.getAll.bind(SeriesController));
router.get('/:id', tryAuthenticate, SeriesController.getById.bind(SeriesController));

router.post('/',
  authenticate, checkPermission('movies:write'),
  uploadFields, handleMulterError,
  SeriesController.create.bind(SeriesController),
);

router.put('/:id',
  authenticate, checkPermission('movies:write'),
  uploadFields, handleMulterError,
  SeriesController.update.bind(SeriesController),
);

router.delete('/:id',
  authenticate, checkPermission('movies:write'),
  SeriesController.delete.bind(SeriesController),
);

// ── Episode CRUD (nested under series) ───────────────────────────────────────
router.get('/:seriesId/episodes', tryAuthenticate, EpisodeController.getAll.bind(EpisodeController));
router.get('/:seriesId/episodes/:episodeId', tryAuthenticate, EpisodeController.getById.bind(EpisodeController));
router.get('/:seriesId/episodes/:episodeId/transcoding-status', authenticate, checkPermission('episodes:write'), EpisodeController.getTranscodingStatus.bind(EpisodeController));

router.post('/:seriesId/episodes',
  authenticate, checkPermission('episodes:write'),
  uploadFields, handleMulterError,
  EpisodeController.create.bind(EpisodeController),
);

router.put('/:seriesId/episodes/:episodeId',
  authenticate, checkPermission('episodes:write'),
  uploadFields, handleMulterError,
  EpisodeController.update.bind(EpisodeController),
);

router.delete('/:seriesId/episodes/:episodeId',
  authenticate, checkPermission('episodes:write'),
  EpisodeController.delete.bind(EpisodeController),
);

module.exports = router;
