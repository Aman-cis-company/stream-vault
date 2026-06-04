const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { validateCreate, validateUpdate } = require('../validators/category.validator');
const ROLES = require('../../constants/roles');

// Public routes
router.get('/', CategoryController.getAll.bind(CategoryController));
router.get('/:id', CategoryController.getById.bind(CategoryController));

// Protected routes
router.post(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
  validateCreate,
  CategoryController.create.bind(CategoryController)
);

router.put(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER),
  validateUpdate,
  CategoryController.update.bind(CategoryController)
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  CategoryController.delete.bind(CategoryController)
);

module.exports = router;
