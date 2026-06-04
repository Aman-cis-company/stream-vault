const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/MovieController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { uploadMovieFiles, handleMulterError } = require('../middlewares/upload');
const { validateCreate, validateUpdate } = require('../validators/movie.validator');
const ROLES = require('../../constants/roles');

// Public routes
router.get('/', MovieController.getAll.bind(MovieController));
router.get('/:id', MovieController.getById.bind(MovieController));

// Protected routes — create/update accept multipart form data (thumbnail + video)
router.post(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
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
  authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
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
  authorize(ROLES.SUPER_ADMIN),
  MovieController.delete.bind(MovieController)
);

module.exports = router;
