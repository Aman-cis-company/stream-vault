const fs = require('fs');
const path = require('path');
const EpisodeRepository = require('../repositories/EpisodeRepository');
const SeriesRepository = require('../repositories/SeriesRepository');
const BunnyStreamService = require('./BunnyStreamService');
const logger = require('../../config/logger');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

function deleteLocalVideoFile(videoUrl) {
  if (!videoUrl) return;
  const filePath = path.join(UPLOADS_DIR, 'videos', path.basename(videoUrl));
  fs.unlink(filePath, () => {});
}

class EpisodeService {
  async create(seriesId, data, files, userId) {
    const series = await SeriesRepository.findById(seriesId);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }

    const { season_number = 1, episode_number, title, description, duration, release_date, status, provider_name, provider_video_id, video_url } = data;

    if (!episode_number) { const e = new Error('episode_number is required'); e.statusCode = 422; throw e; }

    const exists = await EpisodeRepository.episodeExists(seriesId, season_number, episode_number);
    if (exists) {
      const e = new Error(`S${season_number}E${episode_number} already exists for this series`);
      e.statusCode = 409; throw e;
    }

    let thumbnailUrl = null;
    if (files?.thumbnail?.[0]) thumbnailUrl = `/uploads/thumbnails/${files.thumbnail[0].filename}`;

    let finalVideoId = provider_video_id || null;
    let finalVideoUrl = video_url || null;

    if (files?.video?.[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = provider_name || 'bunny';
      if (resolvedProvider === 'local') {
        finalVideoUrl = `/uploads/videos/${videoFile.filename}`;
        finalVideoId = null;
      } else {
        try {
          const result = await BunnyStreamService.uploadVideo(videoFile.path, videoFile.originalname);
          finalVideoId = result.videoId;
          finalVideoUrl = result.videoUrl;
          fs.unlink(videoFile.path, () => {});
        } catch (err) {
          fs.unlink(videoFile.path, () => {});
          throw err;
        }
      }
    }

    const episode = await EpisodeRepository.create({
      series_id: seriesId,
      season_number: Number(season_number),
      episode_number: Number(episode_number),
      title,
      description: description || null,
      thumbnail_url: thumbnailUrl,
      duration: duration || null,
      provider_name: provider_name || (finalVideoUrl ? 'external' : 'bunny'),
      provider_video_id: finalVideoId,
      video_url: finalVideoUrl,
      status: status || 'draft',
      release_date: release_date || null,
      created_by: userId,
      updated_by: userId,
    });

    // Keep total_seasons in sync
    const maxSeason = await this._maxSeason(seriesId);
    if (maxSeason > series.total_seasons) {
      await SeriesRepository.updateById(seriesId, { total_seasons: maxSeason });
    }

    return EpisodeRepository.findById(episode.id);
  }

  async update(seriesId, episodeId, data, files, userId) {
    const episode = await EpisodeRepository.findBySeriesAndEpisode(seriesId, episodeId);
    if (!episode) { const e = new Error('Episode not found'); e.statusCode = 404; throw e; }

    const updateData = { ...data, updated_by: userId };

    if (files?.thumbnail?.[0]) updateData.thumbnail_url = `/uploads/thumbnails/${files.thumbnail[0].filename}`;

    if (files?.video?.[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = data.provider_name || episode.provider_name || 'bunny';
      if (resolvedProvider === 'local') {
        if (episode.provider_name === 'local') deleteLocalVideoFile(episode.video_url);
        updateData.video_url = `/uploads/videos/${videoFile.filename}`;
        updateData.provider_video_id = null;
        updateData.provider_name = 'local';
      } else {
        try {
          const result = await BunnyStreamService.uploadVideo(videoFile.path, videoFile.originalname);
          if (episode.provider_name === 'local') deleteLocalVideoFile(episode.video_url);
          else if (episode.provider_video_id && episode.provider_name === 'bunny') {
            BunnyStreamService.deleteVideo(episode.provider_video_id).catch(() => {});
          }
          updateData.provider_video_id = result.videoId;
          updateData.video_url = result.videoUrl;
          fs.unlink(videoFile.path, () => {});
        } catch (err) {
          fs.unlink(videoFile.path, () => {});
          throw err;
        }
      }
    }

    await EpisodeRepository.updateById(episodeId, updateData);
    return EpisodeRepository.findById(episodeId);
  }

  async delete(seriesId, episodeId) {
    const episode = await EpisodeRepository.findBySeriesAndEpisode(seriesId, episodeId);
    if (!episode) { const e = new Error('Episode not found'); e.statusCode = 404; throw e; }
    if (episode.provider_name === 'local') deleteLocalVideoFile(episode.video_url);
    else if (episode.provider_video_id && episode.provider_name === 'bunny') {
      BunnyStreamService.deleteVideo(episode.provider_video_id).catch(() => {});
    }
    await EpisodeRepository.deleteById(episodeId);
  }

  async getBySeriesId(seriesId) {
    const series = await SeriesRepository.findById(seriesId);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }
    const episodes = await EpisodeRepository.findBySeriesId(seriesId);
    return episodes;
  }

  async getById(seriesId, episodeId) {
    const episode = await EpisodeRepository.findBySeriesAndEpisode(seriesId, episodeId);
    if (!episode) { const e = new Error('Episode not found'); e.statusCode = 404; throw e; }
    return episode;
  }

  async _maxSeason(seriesId) {
    const episodes = await EpisodeRepository.findBySeriesId(seriesId);
    return episodes.reduce((max, ep) => Math.max(max, ep.season_number), 1);
  }
}

module.exports = new EpisodeService();
