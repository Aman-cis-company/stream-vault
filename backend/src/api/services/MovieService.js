const fs = require('fs');
const path = require('path');
const MovieRepository = require('../repositories/MovieRepository');
const BunnyStreamService = require('./BunnyStreamService');
const { generateUniqueSlug } = require('../../utils/slugify');
const { getPagination } = require('../../utils/pagination');
const { paginationMeta } = require('../../helpers/responseHelper');
const logger = require('../../config/logger');

// Absolute path to the uploads directory (works regardless of CWD)
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

function deleteLocalVideoFile(videoUrl) {
  if (!videoUrl) return;
  const filename = path.basename(videoUrl);
  const filePath = path.join(UPLOADS_DIR, 'videos', filename);
  fs.unlink(filePath, (err) => {
    if (err) logger.warn('Failed to delete local video file', { path: filePath });
  });
}

class MovieService {
  async create(data, files, userId) {
    const {
      title, description, category_id, provider_name,
      provider_video_id, video_url, duration, release_date,
      is_featured, status, language, content_rating,
      is_age_restricted, minimum_age, warning_flags_json,
    } = data;

    const slug = await generateUniqueSlug(title, async (s) => {
      const existing = await MovieRepository.findBySlug(s);
      return !!existing;
    });

    let thumbnailUrl = null;
    let finalVideoId = provider_video_id || null;
    let finalVideoUrl = video_url || null;

    // Handle thumbnail upload (local file saved by multer)
    if (files && files.thumbnail && files.thumbnail[0]) {
      const file = files.thumbnail[0];
      thumbnailUrl = `/uploads/thumbnails/${file.filename}`;
    }

    // Handle video upload
    if (files && files.video && files.video[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = provider_name || 'bunny';

      if (resolvedProvider === 'local') {
        // Keep file on local disk — video_url becomes the static-serve path
        finalVideoUrl = `/uploads/videos/${videoFile.filename}`;
        finalVideoId = null;
      } else {
        // Upload to Bunny Stream then remove temp file
        try {
          const result = await BunnyStreamService.uploadVideo(
            videoFile.path,
            videoFile.originalname
          );
          finalVideoId = result.videoId;
          finalVideoUrl = result.videoUrl;
          fs.unlink(videoFile.path, (unlinkErr) => {
            if (unlinkErr) logger.warn('Failed to delete temp video', { path: videoFile.path });
          });
        } catch (err) {
          fs.unlink(videoFile.path, () => {});
          throw err;
        }
      }
    }

    const movie = await MovieRepository.create({
      category_id: category_id || null,
      title,
      slug,
      description,
      thumbnail_url: thumbnailUrl,
      provider_name: provider_name || (finalVideoUrl ? 'external' : 'bunny'),
      provider_video_id: finalVideoId,
      video_url: finalVideoUrl,
      duration: duration || null,
      release_date: release_date || null,
      is_featured: is_featured || false,
      status: status || 'draft',
      language: language || null,
      content_rating: content_rating || null,
      is_age_restricted: is_age_restricted || false,
      minimum_age: minimum_age || null,
      warning_flags_json: warning_flags_json || null,
      created_by: userId,
      updated_by: userId,
    });

    return MovieRepository.findById(movie.id);
  }

  async update(id, data, files, userId) {
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      const err = new Error('Movie not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData = { ...data, updated_by: userId };

    // Regenerate slug if title changed
    if (data.title && data.title !== movie.title) {
      updateData.slug = await generateUniqueSlug(data.title, async (s) => {
        const existing = await MovieRepository.findBySlug(s);
        return !!(existing && existing.id !== id);
      });
    }

    // Handle new thumbnail
    if (files && files.thumbnail && files.thumbnail[0]) {
      updateData.thumbnail_url = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    }

    // Handle new video upload
    if (files && files.video && files.video[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = data.provider_name || updateData.provider_name || movie.provider_name || 'bunny';

      if (resolvedProvider === 'local') {
        updateData.video_url = `/uploads/videos/${videoFile.filename}`;
        updateData.provider_video_id = null;
        updateData.provider_name = 'local';
        // Delete the old local video file if it was also local
        if (movie.provider_name === 'local') {
          deleteLocalVideoFile(movie.video_url);
        } else if (movie.provider_video_id && movie.provider_name === 'bunny') {
          BunnyStreamService.deleteVideo(movie.provider_video_id).catch((e) =>
            logger.warn('Failed to delete old Bunny video', { videoId: movie.provider_video_id, error: e.message })
          );
        }
      } else {
        try {
          const result = await BunnyStreamService.uploadVideo(
            videoFile.path,
            videoFile.originalname
          );
          updateData.provider_video_id = result.videoId;
          updateData.video_url = result.videoUrl;

          // Delete old video (Bunny or local)
          if (movie.provider_name === 'local') {
            deleteLocalVideoFile(movie.video_url);
          } else if (movie.provider_video_id && movie.provider_name === 'bunny') {
            BunnyStreamService.deleteVideo(movie.provider_video_id).catch((e) =>
              logger.warn('Failed to delete old Bunny video', { videoId: movie.provider_video_id, error: e.message })
            );
          }

          fs.unlink(videoFile.path, () => {});
        } catch (err) {
          fs.unlink(videoFile.path, () => {});
          throw err;
        }
      }
    }

    await MovieRepository.updateById(id, updateData);
    return MovieRepository.findById(id);
  }

  async delete(id) {
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      const err = new Error('Movie not found');
      err.statusCode = 404;
      throw err;
    }

    if (movie.provider_name === 'local') {
      deleteLocalVideoFile(movie.video_url);
    } else if (movie.provider_video_id && movie.provider_name === 'bunny') {
      BunnyStreamService.deleteVideo(movie.provider_video_id).catch((e) =>
        logger.warn('Failed to delete Bunny video on movie delete', { videoId: movie.provider_video_id, error: e.message })
      );
    }

    await MovieRepository.deleteById(id);
  }

  async getById(id) {
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      const err = new Error('Movie not found');
      err.statusCode = 404;
      throw err;
    }
    return movie;
  }

  async getAll(query) {
    const { page, limit, offset } = getPagination(query);
    const { search, category_id, is_featured, status } = query;

    let isFeatured = undefined;
    if (is_featured === 'true') isFeatured = true;
    else if (is_featured === 'false') isFeatured = false;

    const { rows, count } = await MovieRepository.findAll({
      limit,
      offset,
      search,
      categoryId: category_id,
      isFeatured,
      status,
    });

    return {
      movies: rows,
      meta: paginationMeta(count, page, limit),
    };
  }
}

module.exports = new MovieService();
