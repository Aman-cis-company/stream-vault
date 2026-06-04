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
      title, description, category_id, language, content_rating,
      is_age_restricted, minimum_age, warning_flags_json,
      is_featured, status, total_seasons, release_date,
    } = data;

    const slug = await generateUniqueSlug(title, async (s) => !!(await SeriesRepository.findBySlug(s)));

    let thumbnailUrl = null;
    if (files?.thumbnail?.[0]) {
      thumbnailUrl = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    }

    const series = await SeriesRepository.create({
      category_id: category_id || null,
      title,
      slug,
      description: description || null,
      thumbnail_url: thumbnailUrl,
      language: language || null,
      content_rating: content_rating || null,
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

    return SeriesRepository.findById(series.id);
  }

  async update(id, data, files, userId) {
    const series = await SeriesRepository.findById(id);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }

    const updateData = { ...data, updated_by: userId };

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
    return SeriesRepository.findById(id);
  }

  async delete(id) {
    const series = await SeriesRepository.findById(id);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }
    await SeriesRepository.deleteById(id);
  }

  async getById(id) {
    const series = await SeriesRepository.findById(id);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }
    return series;
  }

  async getAll(query) {
    const { page, limit, offset } = getPagination(query);
    const { search, category_id, status, is_featured } = query;

    let isFeatured;
    if (is_featured === 'true') isFeatured = true;
    else if (is_featured === 'false') isFeatured = false;

    const { rows, count } = await SeriesRepository.findAll({
      limit, offset, search, categoryId: category_id, status, isFeatured,
    });

    return { series: rows, meta: paginationMeta(count, page, limit) };
  }
}

module.exports = new SeriesService();
