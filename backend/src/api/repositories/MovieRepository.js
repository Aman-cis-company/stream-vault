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

  async updateById(id, data, options = {}) {
    const [affected] = await Movie.update(data, { where: { id }, ...options });
    return affected;
  }

  async updateAll(data, options = {}) {
    return Movie.update(data, { where: {}, ...options });
  }

  async deleteById(id) {
    return Movie.destroy({ where: { id } });
  }

  async findAll({ limit, offset, search, categoryId, isFeatured, isBanner, status, userControls }) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (categoryId) where.category_id = categoryId;
    if (isFeatured !== undefined && isFeatured !== null) where.is_featured = isFeatured;
    if (isBanner !== undefined && isBanner !== null) where.is_banner = isBanner;
    if (status) where.status = status;

    const { getParentalQueryFilters } = require('../../helpers/parentalFilter');
    const parentalFilters = getParentalQueryFilters(userControls);
    const mergedWhere = { ...where };
    if (parentalFilters.is_age_restricted !== undefined) {
      mergedWhere.is_age_restricted = parentalFilters.is_age_restricted;
    }
    if (parentalFilters[Op.and]) {
      mergedWhere[Op.and] = mergedWhere[Op.and]
        ? [...mergedWhere[Op.and], ...parentalFilters[Op.and]]
        : parentalFilters[Op.and];
    }

    const order = isBanner === true
      ? [['banner_order', 'ASC'], ['created_at', 'DESC']]
      : [['created_at', 'DESC']];

    return Movie.findAndCountAll({
      where: mergedWhere,
      limit,
      offset,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      ],
      order,
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
