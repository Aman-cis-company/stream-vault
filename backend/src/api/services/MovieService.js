const fs = require('fs');
const path = require('path');
const MovieRepository = require('../repositories/MovieRepository');
const BunnyStreamService = require('./BunnyStreamService');
const TranscodingService = require('./TranscodingService');
const { addTranscodingJob } = require('../../queue');
const { generateUniqueSlug } = require('../../utils/slugify');
const { getPagination } = require('../../utils/pagination');
const { paginationMeta } = require('../../helpers/responseHelper');
const logger = require('../../config/logger');
const { detectVideoProvider } = require('../../utils/videoProvider');

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

    const detected = detectVideoProvider(finalVideoUrl, provider_name);
    const finalProviderName = detected.provider_name || (finalVideoUrl ? 'external' : 'bunny');
    if (detected.provider_video_id) {
      finalVideoId = detected.provider_video_id;
    }

    const movie = await MovieRepository.create({
      category_id: primaryCategoryId,
      title,
      slug,
      description,
      thumbnail_url: thumbnailUrl,
      provider_name: finalProviderName,
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

    if (categoryIds.length > 0) {
      await movie.setCategories(categoryIds);
    }

    // Queue transcoding and subtitle/audio generation job for local uploads
    if (localVideoPath) {
      addTranscodingJob('transcode_movie', {
        movieId: movie.id,
        inputPath: localVideoPath,
        outputName: localVideoOutputName,
        title: title,
        slug: slug,
        language: movie.language,
        generateSubtitles: !!(files && files.video && files.video[0])
      }).catch((err) => {
        logger.error('Failed to enqueue movie transcoding job', { movieId: movie.id, error: err.message });
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

    // Auto-detect provider if video_url changed or is provided
    if (updateData.video_url !== undefined) {
      const detected = detectVideoProvider(updateData.video_url, updateData.provider_name || movie.provider_name);
      updateData.provider_name = detected.provider_name;
      if (detected.provider_video_id) {
        updateData.provider_video_id = detected.provider_video_id;
      }
    }

    await MovieRepository.updateById(id, updateData);

    if (categoryIds !== undefined) {
      const movieInstance = await MovieRepository.findById(id);
      if (movieInstance) {
        await movieInstance.setCategories(categoryIds);
      }
    }

    // Queue transcoding and subtitle/audio generation job for local uploads
    if (localVideoPath) {
      addTranscodingJob('transcode_movie', {
        movieId: id,
        inputPath: localVideoPath,
        outputName: localVideoOutputName,
        title: updateData.title || movie.title,
        slug: updateData.slug || movie.slug,
        language: updateData.language || movie.language,
        generateSubtitles: !!(files && files.video && files.video[0])
      }).catch((err) => {
        logger.error('Failed to enqueue movie update transcoding job', { movieId: id, error: err.message });
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

    if (movie.provider_name === 'bunny' && movie.provider_video_id) {
      movie.setDataValue('video_url', BunnyStreamService.generateEmbedUrl(movie.provider_video_id));
    }

    return movie;
  }

  async getAll(query, userControls = null) {
    const { search } = query;
    const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    // Route to semantic search if search is a descriptive concept (length > 3) and Gemini key is present
    if (search && search.trim().length > 3 && geminiKey) {
      return this.getAllSemantic(query, userControls);
    }

    return this.getAllFallback(query, userControls);
  }

  async getAllSemantic(query, userControls = null) {
    const { page, limit, offset } = getPagination(query);
    const { search, category_id, is_featured, is_banner, status } = query;

    let isFeatured = undefined;
    if (is_featured === 'true') isFeatured = true;
    else if (is_featured === 'false') isFeatured = false;

    let isBanner = undefined;
    if (is_banner === 'true') isBanner = true;
    else if (is_banner === 'false') isBanner = false;

    try {
      // 1. Fetch matching candidate movies (all published movies matching non-search filters)
      const { rows } = await MovieRepository.findAll({
        limit: 200, // Fetch the full catalog of matching movies to re-rank
        offset: 0,
        categoryId: category_id,
        isFeatured,
        isBanner,
        status: status || 'published',
        userControls,
      });

      if (!rows || rows.length === 0) {
        return {
          movies: [],
          meta: paginationMeta(0, page, limit),
        };
      }

      // 2. If there's only 1 movie, no ranking needed
      if (rows.length === 1) {
        if (rows[0].provider_name === 'bunny' && rows[0].provider_video_id) {
          rows[0].setDataValue('video_url', BunnyStreamService.generateEmbedUrl(rows[0].provider_video_id));
        }
        return {
          movies: rows,
          meta: paginationMeta(1, page, limit),
        };
      }

      // 3. Ask Gemini to rank them semantically based on title and description
      const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      const movieListData = rows.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || ''
      }));

      const prompt = `You are the StreamVault Semantic Search Ranker.
Your task is to rank the following movies based on how well they match the semantic meaning of the user query: "${search}".

Movies to rank:
${movieListData.map(m => `- ID ${m.id} (${m.title}): ${m.description}`).join('\n')}

Respond ONLY with a valid JSON array of movie IDs in order of relevance (most relevant first), for example: [14, 32, 19].
Do not include any explanation, conversational text, or markdown formatting (do not wrap in markdown code blocks like \`\`\`json).`;

      const axios = require('axios');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
      const response = await axios.post(url, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      }, { timeout: 8000 });

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        const cleanedReply = reply.replace(/```json/g, '').replace(/```/g, '').trim();
        const rankedIds = JSON.parse(cleanedReply);
        if (Array.isArray(rankedIds)) {
          // Sort rows based on the ranked IDs order
          rows.sort((a, b) => {
            let indexA = rankedIds.indexOf(a.id);
            let indexB = rankedIds.indexOf(b.id);
            
            // If an ID is not in the ranked list, push it to the end
            if (indexA === -1) indexA = 9999;
            if (indexB === -1) indexB = 9999;
            
            return indexA - indexB;
          });
        }
      }

      // 4. Paginate the re-ranked results in memory
      const paginatedRows = rows.slice(offset, offset + limit);

      paginatedRows.forEach(movie => {
        if (movie.provider_name === 'bunny' && movie.provider_video_id) {
          movie.setDataValue('video_url', BunnyStreamService.generateEmbedUrl(movie.provider_video_id));
        }
      });

      return {
        movies: paginatedRows,
        meta: paginationMeta(rows.length, page, limit),
      };
    } catch (err) {
      console.error('Semantic search ranking failed, falling back to database search:', err.message);
      return this.getAllFallback(query, userControls);
    }
  }

  async getAllFallback(query, userControls = null) {
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

    rows.forEach(movie => {
      if (movie.provider_name === 'bunny' && movie.provider_video_id) {
        movie.setDataValue('video_url', BunnyStreamService.generateEmbedUrl(movie.provider_video_id));
      }
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
