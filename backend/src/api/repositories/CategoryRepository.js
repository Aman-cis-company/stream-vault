const { Category, User } = require('../../models');
const { Op } = require('sequelize');

const creatorAttributes = ['id', 'first_name', 'last_name'];

class CategoryRepository {
  async findById(id) {
    return Category.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: creatorAttributes },
        { model: User, as: 'updater', attributes: creatorAttributes },
      ],
    });
  }

  async findBySlug(slug) {
    return Category.findOne({ where: { slug } });
  }

  async create(data) {
    return Category.create(data);
  }

  async updateById(id, data) {
    const [affected] = await Category.update(data, { where: { id } });
    return affected;
  }

  async deleteById(id) {
    return Category.destroy({ where: { id } });
  }

  async findAll({ limit, offset, search, status }) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;

    return Category.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: User, as: 'creator', attributes: creatorAttributes },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async count() {
    return Category.count({ where: { status: 'active' } });
  }
}

module.exports = new CategoryRepository();
