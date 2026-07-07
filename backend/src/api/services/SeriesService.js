const fs = require('fs');
const path = require('path');
const SeriesRepository = require('../repositories/SeriesRepository');
const BunnyStreamService = require('./BunnyStreamService');
const { generateUniqueSlug } = require('../../utils/slugify');
const { getPagination } = require('../../utils/pagination');
const { paginationMeta } = require('../../helpers/responseHelper');
const logger = require('../../config/logger');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

function deleteLocalVideoFile(videoUrl) {
  if (!videoUrl) return;
  const filePath = path.join(UPLOADS_DIR, 'videos', path.basename(videoUrl));
  fs.unlink(filePath, (err) => {
    if (err) logger.warn('Failed to delete local video', { path: filePath });
  });
}

class SeriesService {
  async create(data, files, userId) {
    const {
      title, description, category_id, language, content_rating, rating,
      is_age_restricted, minimum_age, warning_flags_json,
      is_featured, status, total_seasons, release_date,
    } = data;

    let categoryIds = [];
    if (data.category_ids) {
      if (Array.isArray(data.category_ids)) {
        categoryIds = data.category_ids.map(Number).filter(Boolean);
      } else if (typeof data.category_ids === 'string') {
        try {
          categoryIds = JSON.parse(data.category_ids);
          if (!Array.isArray(categoryIds)) {
            categoryIds = [categoryIds];
          }
          categoryIds = categoryIds.map(Number).filter(Boolean);
        } catch {
          categoryIds = data.category_ids.split(',').map(id => Number(id.trim())).filter(Boolean);
        }
      }
    } else if (category_id) {
      categoryIds = [Number(category_id)];
    }
    const primaryCategoryId = categoryIds[0] || category_id || null;

    const slug = await generateUniqueSlug(title, async (s) => !!(await SeriesRepository.findBySlug(s)));

    let thumbnailUrl = null;
    if (files?.thumbnail?.[0]) {
      thumbnailUrl = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    }

    const series = await SeriesRepository.create({
      category_id: primaryCategoryId,
      title,
      slug,
      description: description || null,
      thumbnail_url: thumbnailUrl,
      language: language || null,
      content_rating: content_rating || null,
      rating: rating || null,
      is_age_restricted: is_age_restricted || false,
      minimum_age: minimum_age || null,
      warning_flags_json: warning_flags_json || null,
      is_featured: is_featured || false,
      status: status || 'draft',
      total_seasons: total_seasons || 1,
      release_date: release_date || null,
      created_by: userId,
      updated_by: userId,
    });

    if (categoryIds.length > 0) {
      await series.setCategories(categoryIds);
    }

    return SeriesRepository.findById(series.id);
  }

  async update(id, data, files, userId) {
    const series = await SeriesRepository.findById(id);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }

    let categoryIds = undefined;
    if (data.category_ids !== undefined) {
      if (data.category_ids === null || data.category_ids === '') {
        categoryIds = [];
      } else if (Array.isArray(data.category_ids)) {
        categoryIds = data.category_ids.map(Number).filter(Boolean);
      } else if (typeof data.category_ids === 'string') {
        try {
          categoryIds = JSON.parse(data.category_ids);
          if (!Array.isArray(categoryIds)) {
            categoryIds = [categoryIds];
          }
          categoryIds = categoryIds.map(Number).filter(Boolean);
        } catch {
          categoryIds = data.category_ids.split(',').map(id => Number(id.trim())).filter(Boolean);
        }
      }
    }

    const updateData = { ...data, updated_by: userId };
    if (categoryIds !== undefined) {
      updateData.category_id = categoryIds[0] || null;
    }
    if (updateData.rating === '') updateData.rating = null;

    if (data.title && data.title !== series.title) {
      updateData.slug = await generateUniqueSlug(data.title, async (s) => {
        const ex = await SeriesRepository.findBySlug(s);
        return !!(ex && ex.id !== id);
      });
    }

    if (files?.thumbnail?.[0]) {
      updateData.thumbnail_url = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    }

    await SeriesRepository.updateById(id, updateData);

    if (categoryIds !== undefined) {
      const seriesInstance = await SeriesRepository.findById(id);
      if (seriesInstance) {
        await seriesInstance.setCategories(categoryIds);
      }
    }

    return SeriesRepository.findById(id);
  }

  async delete(id) {
    const series = await SeriesRepository.findById(id);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }
    await SeriesRepository.deleteById(id);
  }

  async getById(id, userControls = null) {
    const series = await SeriesRepository.findById(id);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }

    if (userControls) {
      const { isRatingBlocked } = require('../../helpers/parentalFilter');
      if (userControls.hide_restricted_content && series.is_age_restricted) {
        const err = new Error('Access denied due to parental control settings.');
        err.statusCode = 403;
        throw err;
      }
      if (userControls.max_rating && isRatingBlocked(series.content_rating, userControls.max_rating)) {
        const err = new Error('Access denied due to parental control settings.');
        err.statusCode = 403;
        throw err;
      }
    }

    return series;
  }

  async getAll(query, userControls = null) {
    const { page, limit, offset } = getPagination(query);
    const { search, category_id, status, is_featured } = query;

    let isFeatured;
    if (is_featured === 'true') isFeatured = true;
    else if (is_featured === 'false') isFeatured = false;

    const { rows, count } = await SeriesRepository.findAll({
      limit, offset, search, categoryId: category_id, status, isFeatured, userControls,
    });

    return { series: rows, meta: paginationMeta(count, page, limit) };
  }
}

module.exports = new SeriesService();
