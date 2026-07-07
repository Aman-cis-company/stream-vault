const { Series, Episode, Category, User } = require('../../models');
const { Op, literal } = require('sequelize');

const creatorAttributes = ['id', 'first_name', 'last_name'];

class SeriesRepository {
  _baseInclude() {
    return [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: Category, as: 'categories', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
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

  async findAll({ limit, offset, search, categoryId, status, isFeatured, userControls }) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (categoryId) {
      where[Op.or] = [
        { category_id: categoryId },
        literal(`EXISTS (
          SELECT 1 FROM series_categories 
          WHERE series_categories.series_id = Series.id 
          AND series_categories.category_id = ${Number(categoryId)}
        )`),
      ];
    }
    if (status) where.status = status;
    if (isFeatured !== undefined && isFeatured !== null) where.is_featured = isFeatured;

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

    return Series.findAndCountAll({
      where: mergedWhere,
      limit,
      offset,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'categories', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async count() {
    return Series.count({ where: { status: 'published' } });
  }
}

module.exports = new SeriesRepository();
