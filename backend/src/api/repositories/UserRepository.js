const { User, Role } = require('../../models');
const { Op } = require('sequelize');

class UserRepository {
  /**
   * Find a user by ID (default scope hides password).
   */
  async findById(id) {
    return User.findByPk(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
  }

  /**
   * Find a user by ID including password field.
   */
  async findByIdWithPassword(id) {
    return User.scope('withPassword').findOne({
      where: { id },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
  }

  /**
   * Find a user by email (default scope).
   */
  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  /**
   * Find a user by email including password field.
   */
  async findByEmailWithPassword(email) {
    return User.scope('withPassword').findOne({
      where: { email },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
  }

  /**
   * Create a new user.
   */
  async create(data) {
    return User.create(data);
  }

  /**
   * Update a user by ID.
   */
  async updateById(id, data) {
    const [affected] = await User.update(data, { where: { id } });
    return affected;
  }

  /**
   * Find users with pagination and optional search.
   */
  async findAll({ limit, offset, search, roleId, status }) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (roleId) where.role_id = roleId;
    if (status) where.status = status;

    return User.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Count users by role name.
   */
  async countByRole(roleName) {
    return User.count({
      include: [{
        model: Role,
        as: 'role',
        where: { name: roleName },
        attributes: [],
      }],
      where: { status: 'active' },
    });
  }

  /**
   * Find user with reset token.
   */
  async findByResetToken(token) {
    return User.scope('withReset').findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() },
      },
    });
  }

  /**
   * Delete a user by ID.
   */
  async deleteById(id) {
    return User.destroy({ where: { id } });
  }
}

module.exports = new UserRepository();
