const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bunnyConfig = require('../../config/bunnyStream');
const logger = require('../../config/logger');

class BunnyStreamService {
  constructor() {
    this.apiKey = bunnyConfig.apiKey;
    this.libraryId = bunnyConfig.libraryId;
    this.hostname = bunnyConfig.hostname;
    // Bunny Stream API base: https://video.bunnycdn.com/library/{LIBRARY_ID}
    this.baseUrl = bunnyConfig.baseUrl;

    if (!this.apiKey || !this.libraryId) {
      logger.warn('BunnyStreamService: BUNNY_API_KEY or BUNNY_LIBRARY_ID not set — video uploads disabled');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        AccessKey: this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create a video entry in the Bunny Stream library.
   * POST https://video.bunnycdn.com/library/{libraryId}/videos
   */
  async createVideo(title) {
    try {
      logger.info('BunnyStream: creating video entry', { title, libraryId: this.libraryId, url: `${this.baseUrl}/videos` });
      const response = await this.client.post('/videos', { title });
      logger.info('BunnyStream: video entry created', { videoId: response.data.guid, status: response.status });
      return response.data;
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.Message || err.response?.data?.message || err.message;
      logger.error('BunnyStream: createVideo failed', { status, message, url: `${this.baseUrl}/videos` });
      throw new Error(`Bunny createVideo failed (${status ?? 'no-response'}): ${message}`);
    }
  }

  /**
   * Upload a local video file to Bunny Stream.
   * Step 1 — create video slot, Step 2 — PUT binary stream.
   * PUT https://video.bunnycdn.com/library/{libraryId}/videos/{guid}
   */
  async uploadVideo(filePath, fileName) {
    if (!this.apiKey || !this.libraryId) {
      throw new Error('Bunny Stream credentials not configured. Set BUNNY_API_KEY and BUNNY_LIBRARY_ID in .env');
    }

    let videoEntry = null;
    try {
      const title = path.basename(fileName, path.extname(fileName));
      videoEntry = await this.createVideo(title);

      const videoId = videoEntry.guid;
      const fileStat = fs.statSync(filePath);
      const fileStream = fs.createReadStream(filePath);
      const uploadUrl = `${this.baseUrl}/videos/${videoId}`;

      logger.info('BunnyStream: uploading video binary', { videoId, fileSize: fileStat.size, uploadUrl });

      await axios.put(uploadUrl, fileStream, {
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileStat.size,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 0, // no timeout for large files
      });

      logger.info('BunnyStream: video upload complete', { videoId });

      return {
        videoId,
        videoUrl: this.generatePlaybackUrl(videoId),
      };
    } catch (err) {
      logger.error('BunnyStream: uploadVideo failed', { error: err.message });
      if (videoEntry?.guid) {
        this.deleteVideo(videoEntry.guid).catch(() => {});
      }
      throw new Error(`Bunny upload failed: ${err.message}`);
    }
  }

  /**
   * Delete a video from the library.
   */
  async deleteVideo(videoId) {
    try {
      await this.client.delete(`/videos/${videoId}`);
      logger.info('BunnyStream: video deleted', { videoId });
      return true;
    } catch (err) {
      const msg = err.response?.data?.Message || err.message;
      logger.error('BunnyStream: deleteVideo failed', { videoId, error: msg });
      throw new Error(`Bunny deleteVideo failed: ${msg}`);
    }
  }

  /**
   * Get video metadata.
   */
  async getVideo(videoId) {
    try {
      const response = await this.client.get(`/videos/${videoId}`);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.Message || err.message;
      logger.error('BunnyStream: getVideo failed', { videoId, error: msg });
      throw new Error(`Bunny getVideo failed: ${msg}`);
    }
  }

  /**
   * Get encoding/processing status.
   * Status codes: 0=queued, 1=processing, 2=encoding, 3=finished, 4=resolution_finished, 5=error
   */
  async getVideoStatus(videoId) {
    const video = await this.getVideo(videoId);
    return {
      status: video.status,
      encodeProgress: video.encodeProgress,
      storageSize: video.storageSize,
      length: video.length,
    };
  }

  /**
   * Build the HLS playlist URL for a video.
   */
  generatePlaybackUrl(videoId) {
    if (!this.hostname) {
      logger.warn('BunnyStream: BUNNY_HOSTNAME not set — playback URLs will be empty');
      return '';
    }
    return `https://${this.hostname}/${videoId}/playlist.m3u8`;
  }

  /**
   * List videos in the library.
   */
  async listVideos(page = 1, itemsPerPage = 100, search = '') {
    try {
      const response = await this.client.get('/videos', {
        params: { page, itemsPerPage, search },
      });
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.Message || err.message;
      logger.error('BunnyStream: listVideos failed', { error: msg });
      throw new Error(`Bunny listVideos failed: ${msg}`);
    }
  }
}

module.exports = new BunnyStreamService();
