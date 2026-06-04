const { Movie, Category, User, WatchHistory } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

const creatorAttributes = ['id', 'first_name', 'last_name'];

class MovieRepository {
  async findById(id) {
    return Movie.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'creator', attributes: creatorAttributes },
        { model: User, as: 'updater', attributes: creatorAttributes },
      ],
    });
  }

  async findBySlug(slug) {
    return Movie.findOne({ where: { slug } });
  }

  async create(data) {
    return Movie.create(data);
  }

  async updateById(id, data) {
    const [affected] = await Movie.update(data, { where: { id } });
    return affected;
  }

  async deleteById(id) {
    return Movie.destroy({ where: { id } });
  }

  async findAll({ limit, offset, search, categoryId, isFeatured, status }) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (categoryId) where.category_id = categoryId;
    if (isFeatured !== undefined && isFeatured !== null) where.is_featured = isFeatured;
    if (status) where.status = status;

    return Movie.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async count() {
    return Movie.count({ where: { status: 'published' } });
  }

  async findRecentlyAdded(limit = 5) {
    return Movie.findAll({
      where: { status: 'published' },
      order: [['created_at', 'DESC']],
      limit,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
  }

  async findMostWatched(limit = 5) {
    return Movie.findAll({
      where: { status: 'published' },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        {
          model: WatchHistory,
          as: 'watchHistory',
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [fn('COUNT', col('watchHistory.id')), 'watch_count'],
        ],
      },
      group: ['Movie.id'],
      order: [[literal('watch_count'), 'DESC']],
      limit,
      subQuery: false,
    });
  }
}

module.exports = new MovieRepository();
