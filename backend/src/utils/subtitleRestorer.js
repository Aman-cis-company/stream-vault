const fs = require('fs');
const path = require('path');
const { Movie, Episode } = require('../models');
const logger = require('../config/logger');

const SUBTITLES_DIR = path.join(__dirname, '../../uploads/subtitles');

async function restoreSubtitles() {
  try {
    if (!fs.existsSync(SUBTITLES_DIR)) {
      return;
    }

    const files = fs.readdirSync(SUBTITLES_DIR);
    for (const file of files) {
      if (!file.endsWith('_subtitles.vtt')) continue;

      const slug = file.replace('_subtitles.vtt', '');
      const subtitleUrl = `/uploads/subtitles/${file}`;

      // Auto-populate in DB if not matches
      const movie = await Movie.findOne({ where: { slug } });
      if (movie && movie.subtitle_url !== subtitleUrl) {
        await movie.update({ subtitle_url: subtitleUrl });
        logger.info(`Auto-restored subtitle_url for movie: "${movie.title}"`);
      } else if (!movie) {
        const episode = await Episode.findOne({ where: { slug } });
        if (episode && episode.subtitle_url !== subtitleUrl) {
          await episode.update({ subtitle_url: subtitleUrl });
          logger.info(`Auto-restored subtitle_url for episode: "${episode.title}"`);
        }
      }
    }
  } catch (err) {
    logger.error('Error during auto-restoring subtitles:', { error: err.message });
  }
}

module.exports = { restoreSubtitles };
