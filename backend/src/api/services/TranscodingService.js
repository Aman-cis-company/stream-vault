const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const logger = require('../../config/logger');

ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const HLS_DIR = path.join(UPLOADS_DIR, 'hls');

const QUALITIES = [
  { name: '360p',  height: 360,  width: 640,  videoBitrate: '800k',  audioBitrate: '96k',  bandwidth: 896000  },
  { name: '720p',  height: 720,  width: 1280, videoBitrate: '2500k', audioBitrate: '128k', bandwidth: 2628000 },
  { name: '1080p', height: 1080, width: 1920, videoBitrate: '5000k', audioBitrate: '192k', bandwidth: 5192000 },
];

function transcodeQuality(inputPath, qualityDir, quality) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(qualityDir, { recursive: true });
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoFilters(`scale=-2:${quality.height}`)
      .videoBitrate(quality.videoBitrate)
      .audioBitrate(quality.audioBitrate)
      .outputOptions([
        '-hls_time 6',      // it split videos every 6 seconds
        '-hls_playlist_type vod',
        `-hls_segment_filename ${path.join(qualityDir, 'seg_%03d.ts')}`,
      ])
      .output(path.join(qualityDir, 'playlist.m3u8'))
      .on('end', resolve)
      .on('error', (err) => reject(err))
      .run();
  });
}

function buildMasterPlaylist() {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', ''];
  for (const q of QUALITIES) {
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${q.bandwidth},RESOLUTION=${q.width}x${q.height},NAME="${q.name}"`);
    lines.push(`${q.name}/playlist.m3u8`);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Starts async HLS transcoding. Does NOT block — fire and forget.
 *
 * @param {object} opts
 * @param {string} opts.inputPath    - Absolute path to the original uploaded video
 * @param {string} opts.outputName   - Directory name under /uploads/hls/ (UUID-based)
 * @param {Function} opts.onProcessing - Called when transcoding begins (async)
 * @param {Function} opts.onComplete - Called with (hlsUrl) on success (async)
 * @param {Function} opts.onError    - Called on failure (async)
 */
async function transcodeAsync({ inputPath, outputName, onProcessing, onComplete, onError }) {
  const outputDir = path.join(HLS_DIR, outputName);

  try {
    await onProcessing();
    fs.mkdirSync(outputDir, { recursive: true });

    for (const quality of QUALITIES) {
      logger.info(`[Transcoding] ${outputName} → ${quality.name}`);
      await transcodeQuality(inputPath, path.join(outputDir, quality.name), quality);
    }

    fs.writeFileSync(path.join(outputDir, 'master.m3u8'), buildMasterPlaylist());

    // Remove the original raw upload to free disk space
    fs.unlink(inputPath, () => {});

    const hlsUrl = `/uploads/hls/${outputName}/master.m3u8`;
    await onComplete(hlsUrl);
    logger.info(`[Transcoding] Completed: ${outputName}`);
  } catch (err) {
    logger.error(`[Transcoding] Failed: ${outputName}`, { error: err.message });
    await onError(err);
  }
}

/**
 * Deletes the HLS output directory for a given video_url.
 * Safe to call if the url is not an HLS url.
 */
function deleteHLSDirectory(videoUrl) {
  if (!videoUrl || !videoUrl.includes('/uploads/hls/')) return;
  const parts = videoUrl.split('/uploads/hls/');
  if (parts.length < 2) return;
  const dirName = parts[1].split('/')[0];
  if (!dirName) return;
  const dirPath = path.join(HLS_DIR, dirName);
  fs.rm(dirPath, { recursive: true, force: true }, () => {});
}

module.exports = { transcodeAsync, deleteHLSDirectory };
