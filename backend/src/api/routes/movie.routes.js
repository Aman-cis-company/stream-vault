const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/MovieController');
const authenticate = require('../middlewares/authenticate');
const checkPermission = require('../middlewares/checkPermission');
const { uploadMovieFiles, handleMulterError } = require('../middlewares/upload');
const { validateCreate, validateUpdate } = require('../validators/movie.validator');
const tryAuthenticate = require('../middlewares/tryAuthenticate');

// Public routes
router.get('/', tryAuthenticate, MovieController.getAll.bind(MovieController));
router.get('/top-10', MovieController.getTop10.bind(MovieController));
router.put('/banner', authenticate, checkPermission('movies:write'), MovieController.updateBannerOrder.bind(MovieController));
router.get('/:id', tryAuthenticate, MovieController.getById.bind(MovieController));
router.get('/:id/transcoding-status', authenticate, checkPermission('movies:write'), MovieController.getTranscodingStatus.bind(MovieController));

// Protected routes — create/update accept multipart form data (thumbnail + video)
router.post(
  '/',
  authenticate,
  checkPermission('movies:write'),
  uploadMovieFiles.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  handleMulterError,
  validateCreate,
  MovieController.create.bind(MovieController)
);

router.put(
  '/:id',
  authenticate,
  checkPermission('movies:write'),
  uploadMovieFiles.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  handleMulterError,
  validateUpdate,
  MovieController.update.bind(MovieController)
);

router.delete(
  '/:id',
  authenticate,
  checkPermission('movies:write'),
  MovieController.delete.bind(MovieController)
);

module.exports = router;
