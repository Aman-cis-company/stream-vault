const express = require('express');
const router = express.Router();
const SeriesController = require('../controllers/SeriesController');
const EpisodeController = require('../controllers/EpisodeController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { uploadMovieFiles, handleMulterError } = require('../middlewares/upload');
const tryAuthenticate = require('../middlewares/tryAuthenticate');
const ROLES = require('../../constants/roles');

const uploadFields = uploadMovieFiles.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// ── Series CRUD ───────────────────────────────────────────────────────────────
router.get('/', tryAuthenticate, SeriesController.getAll.bind(SeriesController));
router.get('/:id', tryAuthenticate, SeriesController.getById.bind(SeriesController));

router.post('/',
  authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
  uploadFields, handleMulterError,
  SeriesController.create.bind(SeriesController),
);

router.put('/:id',
  authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
  uploadFields, handleMulterError,
  SeriesController.update.bind(SeriesController),
);

router.delete('/:id',
  authenticate, authorize(ROLES.SUPER_ADMIN),
  SeriesController.delete.bind(SeriesController),
);

// ── Episode CRUD (nested under series) ───────────────────────────────────────
router.get('/:seriesId/episodes', tryAuthenticate, EpisodeController.getAll.bind(EpisodeController));
router.get('/:seriesId/episodes/:episodeId', tryAuthenticate, EpisodeController.getById.bind(EpisodeController));
router.get('/:seriesId/episodes/:episodeId/transcoding-status', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER), EpisodeController.getTranscodingStatus.bind(EpisodeController));

router.post('/:seriesId/episodes',
  authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
  uploadFields, handleMulterError,
  EpisodeController.create.bind(EpisodeController),
);

router.put('/:seriesId/episodes/:episodeId',
  authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
  uploadFields, handleMulterError,
  EpisodeController.update.bind(EpisodeController),
);

router.delete('/:seriesId/episodes/:episodeId',
  authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
  EpisodeController.delete.bind(EpisodeController),
);

module.exports = router;
