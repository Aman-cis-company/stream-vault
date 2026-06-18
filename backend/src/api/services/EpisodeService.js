const fs = require('fs');
const path = require('path');
const EpisodeRepository = require('../repositories/EpisodeRepository');
const SeriesRepository = require('../repositories/SeriesRepository');
const BunnyStreamService = require('./BunnyStreamService');
const TranscodingService = require('./TranscodingService');
const { generateSubtitles } = require('../../helpers/subtitleGenerator');
const logger = require('../../config/logger');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

function deleteLocalVideoFile(videoUrl) {
  if (!videoUrl) return;
  if (videoUrl.includes('/uploads/hls/')) {
    TranscodingService.deleteHLSDirectory(videoUrl);
    return;
  }
  const filePath = path.join(UPLOADS_DIR, 'videos', path.basename(videoUrl));
  fs.unlink(filePath, () => {});
}

class EpisodeService {
  async create(seriesId, data, files, userId) {
    const series = await SeriesRepository.findById(seriesId);
    if (!series) { const e = new Error('Series not found'); e.statusCode = 404; throw e; }

    const { season_number = 1, episode_number, title, description, duration, release_date, status, provider_name, provider_video_id, video_url, rating } = data;
 
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
    let localVideoPath = null;
    let localVideoOutputName = null;
 
    if (files?.video?.[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = provider_name || 'bunny';
      if (resolvedProvider === 'local') {
        finalVideoUrl = `/uploads/videos/${videoFile.filename}`;
        finalVideoId = null;
        localVideoPath = videoFile.path;
        localVideoOutputName = path.basename(videoFile.filename, path.extname(videoFile.filename));
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
      transcoding_status: localVideoPath ? 'pending' : null,
      rating: rating || null,
      status: status || 'draft',
      release_date: release_date || null,
      created_by: userId,
      updated_by: userId,
    });
 
    // Fire-and-forget transcoding for local uploads
    if (localVideoPath) {
      const episodeId = episode.id;
      TranscodingService.transcodeAsync({
        inputPath: localVideoPath,
        outputName: localVideoOutputName,
        onProcessing: () => EpisodeRepository.updateById(episodeId, { transcoding_status: 'processing' }),
        onComplete: (hlsUrl) => EpisodeRepository.updateById(episodeId, { video_url: hlsUrl, transcoding_status: 'completed' }),
        onError: () => EpisodeRepository.updateById(episodeId, { transcoding_status: 'failed' }),
      });
    }
 
    // Fire-and-forget subtitle generation
    if (files?.video?.[0]) {
      const uploadedVideoPath = files.video[0].path;
      const episodeTitle = `${series.title} S${episode.season_number}E${episode.episode_number}: ${episode.title || 'Untitled'}`;
      const episodeSlug = `series-${seriesId}-s${episode.season_number}-e${episode.episode_number}`;
      const epId = episode.id;
      generateSubtitles(uploadedVideoPath, episodeTitle, episodeSlug)
        .then((subUrl) => {
          EpisodeRepository.updateById(epId, { subtitle_url: subUrl });
        })
        .catch((err) => {
          logger.error('Failed to generate subtitles for episode', { episodeId: epId, error: err.message });
        });
    }
 
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
    if (updateData.rating === '') updateData.rating = null;

    if (files?.thumbnail?.[0]) updateData.thumbnail_url = `/uploads/thumbnails/${files.thumbnail[0].filename}`;

    let localVideoPath = null;
    let localVideoOutputName = null;
    if (files?.video?.[0]) {
      const videoFile = files.video[0];
      const resolvedProvider = data.provider_name || episode.provider_name || 'bunny';
      if (resolvedProvider === 'local') {
        if (episode.provider_name === 'local') deleteLocalVideoFile(episode.video_url);
        updateData.video_url = `/uploads/videos/${videoFile.filename}`;
        updateData.provider_video_id = null;
        updateData.provider_name = 'local';
        updateData.transcoding_status = 'pending';
        localVideoPath = videoFile.path;
        localVideoOutputName = path.basename(videoFile.filename, path.extname(videoFile.filename));
      } else {
        try {
          const result = await BunnyStreamService.uploadVideo(videoFile.path, videoFile.originalname);
          if (episode.provider_name === 'local') deleteLocalVideoFile(episode.video_url);
          else if (episode.provider_video_id && episode.provider_name === 'bunny') {
            BunnyStreamService.deleteVideo(episode.provider_video_id).catch(() => {});
          }
          updateData.provider_video_id = result.videoId;
          updateData.video_url = result.videoUrl;
          updateData.transcoding_status = null;
          fs.unlink(videoFile.path, () => {});
        } catch (err) {
          fs.unlink(videoFile.path, () => {});
          throw err;
        }
      }
    }

    await EpisodeRepository.updateById(episodeId, updateData);

    // Fire-and-forget transcoding for local uploads
    if (localVideoPath) {
      TranscodingService.transcodeAsync({
        inputPath: localVideoPath,
        outputName: localVideoOutputName,
        onProcessing: () => EpisodeRepository.updateById(episodeId, { transcoding_status: 'processing' }),
        onComplete: (hlsUrl) => EpisodeRepository.updateById(episodeId, { video_url: hlsUrl, transcoding_status: 'completed' }),
        onError: () => EpisodeRepository.updateById(episodeId, { transcoding_status: 'failed' }),
      });
    }

    // Fire-and-forget subtitle generation
    if (files?.video?.[0]) {
      const uploadedVideoPath = files.video[0].path;
      const series = await SeriesRepository.findById(seriesId);
      const episodeTitle = `${series ? series.title : 'Series'} S${episode.season_number}E${episode.episode_number}: ${updateData.title || episode.title || 'Untitled'}`;
      const episodeSlug = `series-${seriesId}-s${episode.season_number}-e${episode.episode_number}`;
      generateSubtitles(uploadedVideoPath, episodeTitle, episodeSlug)
        .then((subUrl) => {
          EpisodeRepository.updateById(episodeId, { subtitle_url: subUrl });
        })
        .catch((err) => {
          logger.error('Failed to generate subtitles for episode update', { episodeId, error: err.message });
        });
    }

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
