const UserRepository = require('../repositories/UserRepository');
const MovieRepository = require('../repositories/MovieRepository');
const SubscriptionRepository = require('../repositories/SubscriptionRepository');
const PaymentRepository = require('../repositories/PaymentRepository');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');
const logger = require('../../config/logger');
const socketServer = require('../../socket');
const EVENTS = require('../../socket/events');

class DashboardController {
  async getStats(req, res) {
    try {
      const [totalUsers, totalSubscribers, totalMovies, totalRevenue, activeSubscribers] = await Promise.all([
        UserRepository.countByRole(ROLES.SUBSCRIBER),
        SubscriptionRepository.countActive(),
        MovieRepository.count(),
        PaymentRepository.getTotalRevenue(),
        SubscriptionRepository.countActive(),
      ]);

      return successResponse(res, MESSAGES.STATS_FETCHED, {
        stats: {
          totalUsers,
          activeSubscribers,
          totalRevenue,
          totalMovies,
        },
      });
    } catch (err) {
      logger.error('DashboardController.getStats error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getRevenue(req, res) {
    try {
      const { period = 'monthly' } = req.query;
      let data;

      if (period === 'yearly') {
        data = await PaymentRepository.getYearlyRevenue(3);
      } else {
        data = await PaymentRepository.getMonthlyRevenue(12);
      }

      return successResponse(res, MESSAGES.REVENUE_FETCHED, { revenue: data, period });
    } catch (err) {
      logger.error('DashboardController.getRevenue error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubscribers(req, res) {
    try {
      const growth = await SubscriptionRepository.getSubscriberGrowth(12);
      return successResponse(res, MESSAGES.SUBSCRIBERS_FETCHED, { growth });
    } catch (err) {
      logger.error('DashboardController.getSubscribers error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getMovies(req, res) {
    try {
      const [mostWatched, recentlyAdded] = await Promise.all([
        MovieRepository.findMostWatched(10),
        MovieRepository.findRecentlyAdded(10),
      ]);

      return successResponse(res, MESSAGES.MOVIES_FETCHED, { mostWatched, recentlyAdded });
    } catch (err) {
      logger.error('DashboardController.getMovies error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getPayments(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const payments = await PaymentRepository.findRecent(limit);
      return successResponse(res, MESSAGES.PAYMENTS_FETCHED, { payments });
    } catch (err) {
      logger.error('DashboardController.getPayments error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getUsers(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const offset = Math.max((parseInt(req.query.page, 10) || 1) - 1, 0) * limit;
      const { rows, count } = await UserRepository.findAll({
        limit,
        offset,
        search: req.query.search,
        status: req.query.status,
      });
      return successResponse(res, 'Users fetched', { users: rows, total: count });
    } catch (err) {
      logger.error('DashboardController.getUsers error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'banned'].includes(status)) {
        return errorResponse(res, 'Invalid status', STATUS_CODES.BAD_REQUEST);
      }

      const user = await UserRepository.findById(id);
      if (!user) return errorResponse(res, 'User not found', STATUS_CODES.NOT_FOUND);

      await user.update({ status });

      const event = status === 'active' ? EVENTS.USER_APPROVED : EVENTS.USER_BLOCKED;
      socketServer.emitToUser(Number(id), event, { status });
      socketServer.emitToAdmins(event, { userId: Number(id), status });
      socketServer.pushDashboardStats({ refresh: true });

      return successResponse(res, 'User status updated', { user });
    } catch (err) {
      logger.error('DashboardController.updateUserStatus error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new DashboardController();
