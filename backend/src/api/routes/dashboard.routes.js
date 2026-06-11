const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../../constants/roles');

const adminOnly = [authenticate, authorize(ROLES.SUPER_ADMIN)];

router.get('/stats', ...adminOnly, DashboardController.getStats.bind(DashboardController));
router.get('/revenue', ...adminOnly, DashboardController.getRevenue.bind(DashboardController));
router.get('/subscribers', ...adminOnly, DashboardController.getSubscribers.bind(DashboardController));
router.get('/movies', ...adminOnly, DashboardController.getMovies.bind(DashboardController));
router.get('/payments', ...adminOnly, DashboardController.getPayments.bind(DashboardController));
router.get('/users', ...adminOnly, DashboardController.getUsers.bind(DashboardController));
router.patch('/users/:id/status', ...adminOnly, DashboardController.updateUserStatus.bind(DashboardController));

module.exports = router;
