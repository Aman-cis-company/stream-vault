const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const logger = require('../config/logger');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const SUBTITLES_DIR = path.join(UPLOADS_DIR, 'subtitles');

// Ensure folder exists
if (!fs.existsSync(SUBTITLES_DIR)) {
  fs.mkdirSync(SUBTITLES_DIR, { recursive: true });
}

// Migrate any existing subtitle files from root uploads/subtitles to backend/uploads/subtitles
const ROOT_SUBTITLES_DIR = path.resolve(__dirname, '../../../uploads/subtitles');
if (fs.existsSync(ROOT_SUBTITLES_DIR)) {
  try {
    const files = fs.readdirSync(ROOT_SUBTITLES_DIR);
    files.forEach((file) => {
      const srcFile = path.join(ROOT_SUBTITLES_DIR, file);
      const destFile = path.join(SUBTITLES_DIR, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.renameSync(srcFile, destFile);
        logger.info(`[Subtitle Migrator] Moved ${file} to backend/uploads/subtitles`);
      }
    });
  } catch (err) {
    logger.error(`[Subtitle Migrator] Migration error: ${err.message}`);
  }
}

/**
 * Runs Whisper command if available to generate WebVTT/SRT subtitles from video.
 * Fallback: generates a clean synchronized mock WebVTT file with intro, dialog, and outro captions.
 *
 * @param {string} videoPath - Path to the video file
 * @param {string} title - Title of the content (used for mock dialogue generation)
 * @param {string} slug - Unique slug (used as filename)
 * @returns {Promise<string>} Relative URL of the generated VTT subtitle file
 */
function generateSubtitles(videoPath, title, slug) {
  return new Promise((resolve) => {
    // Generate clean filename using slug
    const outputFilename = `${slug}_subtitles.vtt`;
    const outputPath = path.join(SUBTITLES_DIR, outputFilename);
    const subtitleUrl = `/uploads/subtitles/${outputFilename}`;

    // Duplicate input file to a temporary file under subtitles directory
    // to avoid locks or deletion conflicts when run asynchronously.
    const tempVideoFilename = `temp_${slug}${path.extname(videoPath)}`;
    const tempVideoPath = path.join(SUBTITLES_DIR, tempVideoFilename);

    try {
      fs.copyFileSync(videoPath, tempVideoPath);
    } catch (copyErr) {
      logger.error(`[Subtitle Generator] Failed to copy video to temp file: ${copyErr.message}`);
      // If copying fails, just write mock VTT directly and return
      createMockWebVtt(outputPath, title);
      return resolve(subtitleUrl);
    }

    // Check if Whisper CLI is available
    const localWhisperPath = '/home/cis/.local/bin/whisper';
    const hasLocalWhisper = fs.existsSync(localWhisperPath);

    if (hasLocalWhisper) {
      runWhisper(localWhisperPath);
    } else {
      exec('which whisper', (err, stdout) => {
        if (!err && stdout.trim()) {
          runWhisper(stdout.trim());
        } else {
          logger.info(`[Subtitle Generator] Whisper not installed on host. Generating synchronized mockup subtitles for: ${title}`);
          // Clean up temp file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (unlinkErr) {
            logger.warn(`[Subtitle Generator] Failed to delete temp video: ${unlinkErr.message}`);
          }
          createMockWebVtt(outputPath, title);
          resolve(subtitleUrl);
        }
      });
    }

    function runWhisper(whisperCmd) {
      logger.info(`[Subtitle Generator] Whisper AI detected: ${whisperCmd}. Generating subtitles for: ${title}`);
      
      // Resolve path to static ffmpeg binary from ffmpeg-static npm package
      let ffmpegDir = '';
      try {
        const ffmpegStaticPath = require('ffmpeg-static');
        ffmpegDir = path.dirname(ffmpegStaticPath);
      } catch (err) {
        logger.warn(`[Subtitle Generator] Could not resolve ffmpeg-static path: ${err.message}`);
      }

      const envPrefix = ffmpegDir ? `PATH="${ffmpegDir}:$PATH" ` : '';
      // Run Whisper: whisper [video] --task transcribe --output_format vtt --output_dir [dir]
      const cmd = `${envPrefix}"${whisperCmd}" "${tempVideoPath}" --task transcribe --output_format vtt --output_dir "${SUBTITLES_DIR}"`;
      exec(cmd, (execErr) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempVideoPath);
        } catch (unlinkErr) {
          logger.warn(`[Subtitle Generator] Failed to delete temp video: ${unlinkErr.message}`);
        }

        if (execErr) {
          logger.error(`[Subtitle Generator] Whisper run failed. Falling back to mock generator: ${execErr.message}`);
          createMockWebVtt(outputPath, title);
        } else {
          // Whisper output matches the temp filename: e.g. temp_slug.vtt
          const generatedFile = path.join(SUBTITLES_DIR, `temp_${slug}.vtt`);
          if (fs.existsSync(generatedFile)) {
            try {
              fs.renameSync(generatedFile, outputPath);
              logger.info(`[Subtitle Generator] Whisper subtitle generated successfully: ${outputFilename}`);
            } catch (renameErr) {
              logger.error(`[Subtitle Generator] Failed to rename Whisper output: ${renameErr.message}`);
              createMockWebVtt(outputPath, title);
            }
          } else {
            logger.warn('[Subtitle Generator] Whisper completed but output file not found. Creating fallback mockup.');
            createMockWebVtt(outputPath, title);
          }
        }
        resolve(subtitleUrl);
      });
    }
  });
}

function createMockWebVtt(filePath, title) {
  const vttContent = `WEBVTT

00:00:02.000 --> 00:00:06.000
[Intro Music Playing]

00:00:06.500 --> 00:00:11.000
Narrator: Welcome to the world of ${title}.

00:00:12.000 --> 00:00:16.500
Character: Everything we know is about to change.

00:00:18.000 --> 00:00:22.000
Character: We must stay together to survive.

00:00:25.000 --> 00:00:29.500
[Dramatic sound effect]

00:00:30.000 --> 00:00:35.000
Narrator: StreamVault presents an AI-generated experience of ${title}.

00:00:40.000 --> 00:00:45.000
Character: The journey has only just begun.
`;
  try {
    fs.writeFileSync(filePath, vttContent, 'utf8');
  } catch (err) {
    logger.error(`[Subtitle Generator] Error writing VTT file: ${err.message}`);
  }
}

module.exports = { generateSubtitles };
