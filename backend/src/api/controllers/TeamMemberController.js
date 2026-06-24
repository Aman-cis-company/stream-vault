const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const UserRepository = require('../repositories/UserRepository');
const { User, Role, ActivityLog, Permission } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const { paginationMeta } = require('../../helpers/responseHelper');
const EmailService = require('../services/EmailService');
const { logActivity } = require('../../helpers/activityLogger');
const logger = require('../../config/logger');

class TeamMemberController {
  /**
   * List all team members (users whose role is not 'subscriber')
   */
  async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search, status, roleId } = req.query;

      // Find subscriber role ID to exclude
      const subscriberRole = await Role.findOne({ where: { name: 'subscriber' } });
      if (!subscriberRole) {
        return errorResponse(res, 'Subscriber role not found', STATUS_CODES.INTERNAL_SERVER_ERROR);
      }

      const where = {
        role_id: { [Op.ne]: subscriberRole.id }
      };

      if (status) {
        where.status = status;
      }

      if (roleId) {
        where.role_id = roleId;
      }

      if (search) {
        where[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { rows, count } = await User.findAndCountAll({
        where,
        limit,
        offset,
        include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
        order: [['created_at', 'DESC']],
      });

      return successResponse(
        res,
        'Team members fetched successfully',
        { teamMembers: rows },
        STATUS_CODES.OK,
        paginationMeta(count, page, limit)
      );
    } catch (err) {
      logger.error('TeamMemberController.getAll error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send Invitation to a new team member
   */
  async invite(req, res) {
    try {
      const { first_name, last_name, email, role_id, phone } = req.body;

      const existing = await UserRepository.findByEmail(email);
      if (existing) {
        return errorResponse(res, MESSAGES.EMAIL_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }

      const role = await Role.findByPk(role_id);
      if (!role || role.name === 'subscriber') {
        return errorResponse(res, 'Invalid role assigned', STATUS_CODES.BAD_REQUEST);
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

      // Create inactive user with invite token
      // Generate a temporary random password since it is a required field
      const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

      const user = await User.create({
        role_id,
        first_name,
        last_name,
        email,
        phone: phone || null,
        password: tempPassword,
        status: 'inactive',
        email_verified: false,
        invitation_token: token,
        invitation_expiry: expiry,
        invited_by: req.user.id,
      });

      // Send invite email (non-blocking)
      EmailService.sendTeamInvitationEmail(user, token).catch((e) =>
        logger.warn('Failed to send team invitation email', { userId: user.id, error: e.message })
      );

      // Log activity
      logActivity(req.user.id, 'team_member_invited', { invitedUserId: user.id, email: user.email, role: role.name }, req);

      const safeUser = await UserRepository.findById(user.id);
      return successResponse(res, 'Team member invitation sent successfully', { user: safeUser }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('TeamMemberController.invite error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Accept invitation and set password
   */
  async acceptInvitation(req, res) {
    try {
      const { token, password } = req.body;

      const user = await User.scope('withReset').findOne({
        where: {
          invitation_token: token,
          invitation_expiry: { [Op.gt]: new Date() },
        },
      });

      if (!user) {
        return errorResponse(res, 'Invitation token is invalid or has expired', STATUS_CODES.BAD_REQUEST);
      }

      const hashed = await bcrypt.hash(password, 12);

      await user.update({
        password: hashed,
        status: 'active',
        email_verified: true,
        invitation_token: null,
        invitation_expiry: null,
      });

      // Log activity
      logActivity(user.id, 'team_member_activated', { email: user.email }, req);

      return successResponse(res, 'Invitation accepted and account activated successfully');
    } catch (err) {
      logger.error('TeamMemberController.acceptInvitation error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Edit team member details & role
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { first_name, last_name, phone, role_id } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return errorResponse(res, 'Team member not found', STATUS_CODES.NOT_FOUND);
      }

      // Ensure we are not editing a subscriber
      const subscriberRole = await Role.findOne({ where: { name: 'subscriber' } });
      if (user.role_id === subscriberRole.id) {
        return errorResponse(res, 'Cannot modify subscribers in team management', STATUS_CODES.BAD_REQUEST);
      }

      const updateData = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (phone !== undefined) updateData.phone = phone;

      if (role_id) {
        const role = await Role.findByPk(role_id);
        if (!role || role.name === 'subscriber') {
          return errorResponse(res, 'Invalid role assignment', STATUS_CODES.BAD_REQUEST);
        }
        updateData.role_id = role_id;
      }

      await user.update(updateData);

      // Log activity
      logActivity(req.user.id, 'team_member_updated', { updatedUserId: user.id, email: user.email }, req);

      const updated = await UserRepository.findById(id);
      return successResponse(res, 'Team member updated successfully', { user: updated });
    } catch (err) {
      logger.error('TeamMemberController.update error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Toggle Team Member status (Enable/Disable)
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) {
        return errorResponse(res, 'Team member not found', STATUS_CODES.NOT_FOUND);
      }

      // Check not subscriber
      const subscriberRole = await Role.findOne({ where: { name: 'subscriber' } });
      if (user.role_id === subscriberRole.id) {
        return errorResponse(res, 'Cannot modify subscribers in team management', STATUS_CODES.BAD_REQUEST);
      }

      // Prevent disabling yourself
      if (user.id === req.user.id) {
        return errorResponse(res, 'You cannot disable your own account', STATUS_CODES.BAD_REQUEST);
      }

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await user.update({ status: newStatus });

      // Log activity
      logActivity(req.user.id, 'team_member_status_toggled', { targetUserId: user.id, email: user.email, status: newStatus }, req);

      return successResponse(res, `Team member has been ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`, { status: newStatus });
    } catch (err) {
      logger.error('TeamMemberController.toggleStatus error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete Team Member
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) {
        return errorResponse(res, 'Team member not found', STATUS_CODES.NOT_FOUND);
      }

      // Check not subscriber
      const subscriberRole = await Role.findOne({ where: { name: 'subscriber' } });
      if (user.role_id === subscriberRole.id) {
        return errorResponse(res, 'Cannot delete subscribers in team management', STATUS_CODES.BAD_REQUEST);
      }

      // Prevent deleting yourself
      if (user.id === req.user.id) {
        return errorResponse(res, 'You cannot delete your own account', STATUS_CODES.BAD_REQUEST);
      }

      await user.destroy();

      // Log activity
      logActivity(req.user.id, 'team_member_deleted', { deletedUserId: id, email: user.email }, req);

      return successResponse(res, 'Team member deleted successfully');
    } catch (err) {
      logger.error('TeamMemberController.delete error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all active roles except 'subscriber'
   */
  async getRoles(req, res) {
    try {
      const roles = await Role.findAll({
        where: {
          name: { [Op.ne]: 'subscriber' },
          status: 'active'
        },
        order: [['name', 'ASC']]
      });

      return successResponse(res, 'Roles fetched successfully', { roles });
    } catch (err) {
      logger.error('TeamMemberController.getRoles error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get Activity Logs
   */
  async getActivityLogs(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { action, search } = req.query;

      const where = {};
      if (action) {
        where.action = action;
      }

      const include = [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          include: [{ model: Role, as: 'role', attributes: ['name'] }]
        }
      ];

      if (search) {
        where[Op.or] = [
          { action: { [Op.like]: `%${search}%` } },
          { details: { [Op.like]: `%${search}%` } },
          { '$user.first_name$': { [Op.like]: `%${search}%` } },
          { '$user.last_name$': { [Op.like]: `%${search}%` } },
          { '$user.email$': { [Op.like]: `%${search}%` } },
        ];
      }

      const { rows, count } = await ActivityLog.findAndCountAll({
        where,
        limit,
        offset,
        include,
        order: [['created_at', 'DESC']],
      });

      return successResponse(
        res,
        'Activity logs fetched successfully',
        { logs: rows },
        STATUS_CODES.OK,
        paginationMeta(count, page, limit)
      );
    } catch (err) {
      logger.error('TeamMemberController.getActivityLogs error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new TeamMemberController();
