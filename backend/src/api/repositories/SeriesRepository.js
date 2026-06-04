const { Series, Episode, Category, User } = require('../../models');
const { Op } = require('sequelize');

const creatorAttributes = ['id', 'first_name', 'last_name'];

class SeriesRepository {
  _baseInclude() {
    return [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: User, as: 'creator', attributes: creatorAttributes },
    ];
  }

  async findById(id) {
    return Series.findByPk(id, {
      include: [
        ...this._baseInclude(),
        {
          model: Episode,
          as: 'episodes',
          order: [['season_number', 'ASC'], ['episode_number', 'ASC']],
        },
      ],
    });
  }

  async findBySlug(slug) {
    return Series.findOne({ where: { slug } });
  }

  async create(data) {
    return Series.create(data);
  }

  async updateById(id, data) {
    const [affected] = await Series.update(data, { where: { id } });
    return affected;
  }

  async deleteById(id) {
    return Series.destroy({ where: { id } });
  }

  async findAll({ limit, offset, search, categoryId, status, isFeatured }) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (categoryId) where.category_id = categoryId;
    if (status) where.status = status;
    if (isFeatured !== undefined && isFeatured !== null) where.is_featured = isFeatured;

    return Series.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
      order: [['created_at', 'DESC']],
    });
  }

  async count() {
    return Series.count({ where: { status: 'published' } });
  }
}

module.exports = new SeriesRepository();
