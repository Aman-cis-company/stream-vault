const CategoryRepository = require('../repositories/CategoryRepository');
const { generateUniqueSlug } = require('../../utils/slugify');
const { getPagination } = require('../../utils/pagination');
const { paginationMeta } = require('../../helpers/responseHelper');

class CategoryService {
  async create(data, userId) {
    const { name, description, status } = data;

    const slug = await generateUniqueSlug(name, async (s) => {
      const existing = await CategoryRepository.findBySlug(s);
      return !!existing;
    });

    const category = await CategoryRepository.create({
      name,
      slug,
      description,
      status: status || 'active',
      created_by: userId,
      updated_by: userId,
    });

    return CategoryRepository.findById(category.id);
  }

  async update(id, data, userId) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData = { ...data, updated_by: userId };

    // Regenerate slug if name changed
    if (data.name && data.name !== category.name) {
      updateData.slug = await generateUniqueSlug(data.name, async (s) => {
        const existing = await CategoryRepository.findBySlug(s);
        return !!(existing && existing.id !== id);
      });
    }

    await CategoryRepository.updateById(id, updateData);
    return CategoryRepository.findById(id);
  }

  async delete(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    await CategoryRepository.deleteById(id);
  }

  async getById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    return category;
  }

  async getAll(query) {
    const { page, limit, offset } = getPagination(query);
    const { search, status } = query;

    const { rows, count } = await CategoryRepository.findAll({
      limit,
      offset,
      search,
      status,
    });

    return {
      categories: rows,
      meta: paginationMeta(count, page, limit),
    };
  }
}

module.exports = new CategoryService();
