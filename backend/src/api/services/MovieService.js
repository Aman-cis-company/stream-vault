const fs = require('fs');
const path = require('path');
const MovieRepository = require('../repositories/MovieRepository');
const BunnyStreamService = require('./BunnyStreamService');
const TranscodingService = require('./TranscodingService');
const { generateSubtitles } = require('../../helpers/subtitleGenerator');
const { generateUniqueSlug } = require('../../utils/slugify');
const { getPagination } = require('../../utils/pagination');
const { paginationMeta } = require('../../helpers/responseHelper');
const logger = require('../../config/logger');

// Absolute path to the uploads directory (works regardless of CWD)
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

function deleteLocalVideoFile(videoUrl) {
  if (!videoUrl) return;
  if (videoUrl.includes('/uploads/hls/')) {
    TranscodingService.deleteHLSDirectory(videoUrl);
    return;
  }
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
    let localVideoPath = null;
    let localVideoOutputName = null;
    if (files && files.video && files.video[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = provider_name || 'bunny';

      if (resolvedProvider === 'local') {
        // Keep file on local disk — transcoding runs async after DB save
        finalVideoUrl = `/uploads/videos/${videoFile.filename}`;
        finalVideoId = null;
        localVideoPath = videoFile.path;
        localVideoOutputName = path.basename(videoFile.filename, path.extname(videoFile.filename));
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
      transcoding_status: localVideoPath ? 'pending' : null,
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

    // Fire-and-forget transcoding for local uploads
    if (localVideoPath) {
      const movieId = movie.id;
      TranscodingService.transcodeAsync({
        inputPath: localVideoPath,
        outputName: localVideoOutputName,
        onProcessing: () => MovieRepository.updateById(movieId, { transcoding_status: 'processing' }),
        onComplete: (hlsUrl) => MovieRepository.updateById(movieId, { video_url: hlsUrl, transcoding_status: 'completed' }),
        onError: () => MovieRepository.updateById(movieId, { transcoding_status: 'failed' }),
      });
    }

    // Fire-and-forget subtitle generation
    if (files && files.video && files.video[0]) {
      const uploadedVideoPath = files.video[0].path;
      const titleForSub = title;
      const slugForSub = slug;
      const movieId = movie.id;
      generateSubtitles(uploadedVideoPath, titleForSub, slugForSub)
        .then((subUrl) => {
          MovieRepository.updateById(movieId, { subtitle_url: subUrl });
        })
        .catch((err) => {
          logger.error('Failed to generate subtitles for movie', { movieId, error: err.message });
        });
    }

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
    let localVideoPath = null;
    let localVideoOutputName = null;
    if (files && files.video && files.video[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = data.provider_name || updateData.provider_name || movie.provider_name || 'bunny';

      if (resolvedProvider === 'local') {
        updateData.video_url = `/uploads/videos/${videoFile.filename}`;
        updateData.provider_video_id = null;
        updateData.provider_name = 'local';
        updateData.transcoding_status = 'pending';
        localVideoPath = videoFile.path;
        localVideoOutputName = path.basename(videoFile.filename, path.extname(videoFile.filename));
        // Delete the old local video/HLS if it was also local
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
          updateData.transcoding_status = null;

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

    // Fire-and-forget transcoding for local uploads
    if (localVideoPath) {
      TranscodingService.transcodeAsync({
        inputPath: localVideoPath,
        outputName: localVideoOutputName,
        onProcessing: () => MovieRepository.updateById(id, { transcoding_status: 'processing' }),
        onComplete: (hlsUrl) => MovieRepository.updateById(id, { video_url: hlsUrl, transcoding_status: 'completed' }),
        onError: () => MovieRepository.updateById(id, { transcoding_status: 'failed' }),
      });
    }

    // Fire-and-forget subtitle generation
    if (files && files.video && files.video[0]) {
      const uploadedVideoPath = files.video[0].path;
      const titleForSub = updateData.title || movie.title;
      const slugForSub = updateData.slug || movie.slug;
      generateSubtitles(uploadedVideoPath, titleForSub, slugForSub)
        .then((subUrl) => {
          MovieRepository.updateById(id, { subtitle_url: subUrl });
        })
        .catch((err) => {
          logger.error('Failed to generate subtitles for movie update', { movieId: id, error: err.message });
        });
    }

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

  async getById(id, userControls = null) {
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      const err = new Error('Movie not found');
      err.statusCode = 404;
      throw err;
    }

    if (userControls) {
      const { isRatingBlocked } = require('../../helpers/parentalFilter');
      if (userControls.hide_restricted_content && movie.is_age_restricted) {
        const err = new Error('Access denied due to parental control settings.');
        err.statusCode = 403;
        throw err;
      }
      if (userControls.max_rating && isRatingBlocked(movie.content_rating, userControls.max_rating)) {
        const err = new Error('Access denied due to parental control settings.');
        err.statusCode = 403;
        throw err;
      }
    }

    return movie;
  }

  async getAll(query, userControls = null) {
    const { page, limit, offset } = getPagination(query);
    const { search, category_id, is_featured, is_banner, status } = query;

    let isFeatured = undefined;
    if (is_featured === 'true') isFeatured = true;
    else if (is_featured === 'false') isFeatured = false;

    let isBanner = undefined;
    if (is_banner === 'true') isBanner = true;
    else if (is_banner === 'false') isBanner = false;

    const { rows, count } = await MovieRepository.findAll({
      limit,
      offset,
      search,
      categoryId: category_id,
      isFeatured,
      isBanner,
      status,
      userControls,
    });

    return {
      movies: rows,
      meta: paginationMeta(count, page, limit),
    };
  }

  async updateBannerOrder(movieIds, userId) {
    const { sequelize } = require('../../config/database');
    const transaction = await sequelize.transaction();
    try {
      // 1. Reset all movies' banner status
      await MovieRepository.updateAll({ is_banner: false, banner_order: 0 }, { transaction });

      // 2. Set new banner order
      for (let i = 0; i < movieIds.length; i++) {
        const id = movieIds[i];
        await MovieRepository.updateById(id, { is_banner: true, banner_order: i }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = new MovieService();
