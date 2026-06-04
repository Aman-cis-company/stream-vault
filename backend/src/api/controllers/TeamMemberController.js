const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const { Role } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');
const { getPagination } = require('../../utils/pagination');
const { paginationMeta } = require('../../helpers/responseHelper');
const logger = require('../../config/logger');

class TeamMemberController {
  async create(req, res) {
    try {
      const { first_name, last_name, email, password, phone } = req.body;

      const existing = await UserRepository.findByEmail(email);
      if (existing) {
        return errorResponse(res, MESSAGES.EMAIL_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }

      const role = await Role.findOne({ where: { name: ROLES.TEAM_MEMBER } });
      if (!role) return errorResponse(res, 'Team member role not found', STATUS_CODES.INTERNAL_SERVER_ERROR);

      const hashed = await bcrypt.hash(password, 12);

      const user = await UserRepository.create({
        role_id: role.id,
        first_name,
        last_name,
        email,
        password: hashed,
        phone: phone || null,
        email_verified: true,
        status: 'active',
      });

      const safeUser = await UserRepository.findById(user.id);
      return successResponse(res, MESSAGES.TEAM_MEMBER_CREATED, { user: safeUser }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('TeamMemberController.create error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const role = await Role.findOne({ where: { name: ROLES.TEAM_MEMBER } });
      if (!role) return successResponse(res, MESSAGES.TEAM_MEMBERS_FETCHED, { teamMembers: [] });

      const { rows, count } = await UserRepository.findAll({
        limit,
        offset,
        search: req.query.search,
        roleId: role.id,
        status: req.query.status,
      });

      return successResponse(
        res,
        MESSAGES.TEAM_MEMBERS_FETCHED,
        { teamMembers: rows },
        STATUS_CODES.OK,
        paginationMeta(count, page, limit)
      );
    } catch (err) {
      logger.error('TeamMemberController.getAll error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { first_name, last_name, phone, status, password } = req.body;

      const user = await UserRepository.findById(id);
      if (!user) {
        return errorResponse(res, MESSAGES.TEAM_MEMBER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }

      if (user.role?.name !== ROLES.TEAM_MEMBER) {
        return errorResponse(res, MESSAGES.TEAM_MEMBER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }

      const updateData = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (phone !== undefined) updateData.phone = phone;
      if (status) updateData.status = status;
      if (password) updateData.password = await bcrypt.hash(password, 12);

      await UserRepository.updateById(id, updateData);
      const updated = await UserRepository.findById(id);
      return successResponse(res, MESSAGES.TEAM_MEMBER_UPDATED, { user: updated });
    } catch (err) {
      logger.error('TeamMemberController.update error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const user = await UserRepository.findById(id);
      if (!user) {
        return errorResponse(res, MESSAGES.TEAM_MEMBER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }

      if (user.role?.name !== ROLES.TEAM_MEMBER) {
        return errorResponse(res, MESSAGES.TEAM_MEMBER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
      }

      await UserRepository.deleteById(id);
      return successResponse(res, MESSAGES.TEAM_MEMBER_DELETED);
    } catch (err) {
      logger.error('TeamMemberController.delete error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new TeamMemberController();
