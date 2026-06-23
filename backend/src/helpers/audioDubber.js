const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ffmpegStaticPath = require('ffmpeg-static');
const logger = require('../config/logger');

function timeToMs(timeStr) {
  const parts = timeStr.trim().split(':');
  let hrs = 0, mins = 0, secs = 0, ms = 0;
  if (parts.length === 3) {
    hrs = parseInt(parts[0], 10);
    mins = parseInt(parts[1], 10);
    const secParts = parts[2].split('.');
    secs = parseInt(secParts[0], 10);
    ms = parseInt(secParts[1], 10);
  } else {
    mins = parseInt(parts[0], 10);
    const secParts = parts[1].split('.');
    secs = parseInt(secParts[0], 10);
    ms = parseInt(secParts[1], 10);
  }
  return hrs * 3600000 + mins * 60000 + secs * 1000 + ms;
}

async function translateText(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const json = await res.json();
    return json[0].map(item => item[0]).join('');
  } catch (err) {
    logger.error(`[Audio Dubber] Translation failed for: "${text}"`, { error: err.message });
    return text;
  }
}

async function downloadTts(text, outputPath) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=hi&client=tw-ob`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google TTS status: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

function parseVtt(vttContent) {
  const lines = vttContent.replace(/\r\n/g, '\n').split('\n');
  const cues = [];
  let currentCue = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.includes('-->')) {
      const parts = line.split('-->');
      currentCue = {
        start: timeToMs(parts[0]),
        end: timeToMs(parts[1]),
        text: ''
      };
      cues.push(currentCue);
    } else if (currentCue && !line.startsWith('WEBVTT') && isNaN(line)) {
      currentCue.text = currentCue.text ? currentCue.text + ' ' + line : line;
    }
  }

  return cues;
}

async function dubVideo(vttPath, slug) {
  const tempDir = path.join(__dirname, `../../uploads/temp_dub_${slug}`);
  const outputAudioFilename = `${slug}_hindi.mp3`;
  const outputAudioPath = path.join(__dirname, `../../uploads/audio`, outputAudioFilename);
  const audioDir = path.join(__dirname, `../../uploads/audio`);

  try {
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const vttContent = fs.readFileSync(vttPath, 'utf8');
    const cues = parseVtt(vttContent);
    logger.info(`[Audio Dubber] Parsed ${cues.length} cues for slug: ${slug}`);

    if (cues.length === 0) {
      logger.warn(`[Audio Dubber] No cues found in VTT file: ${vttPath}`);
      return null;
    }

    const inputArgs = [];
    const filterLines = [];
    const mixInputs = [];

    let inputIndex = 0;
    // Translate and download speech for each cue
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (!cue.text || !cue.text.trim()) continue;

      const translated = await translateText(cue.text);
      const tempAudioPath = path.join(tempDir, `cue_${i}.mp3`);
      
      try {
        await downloadTts(translated, tempAudioPath);
        
        inputArgs.push(`-i "${tempAudioPath}"`);
        filterLines.push(`[${inputIndex}:a]adelay=${cue.start}|${cue.start}[a${inputIndex}]`);
        mixInputs.push(`[a${inputIndex}]`);
        inputIndex++;
      } catch (ttsErr) {
        logger.error(`[Audio Dubber] Failed to generate TTS for cue ${i}: ${ttsErr.message}`);
      }

      // Add a tiny delay between requests to avoid rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    if (mixInputs.length === 0) {
      return null;
    }

    const filterScriptPath = path.join(tempDir, 'filter_script.txt');
    const filterScriptContent = `${filterLines.join(';\n')};\n${mixInputs.join('')}amix=inputs=${mixInputs.length}:dropout_transition=0[out]`;
    fs.writeFileSync(filterScriptPath, filterScriptContent, 'utf8');

    const cmd = `"${ffmpegStaticPath}" ${inputArgs.join(' ')} -filter_complex_script "${filterScriptPath}" -map "[out]" -y "${outputAudioPath}"`;
    
    logger.info(`[Audio Dubber] Running ffmpeg to mix dubbed track for: ${slug}`);
    await new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          logger.error(`[Audio Dubber] FFmpeg mix error: ${err.message}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    logger.info(`[Audio Dubber] Successfully generated dubbed audio at: ${outputAudioPath}`);
    return `/uploads/audio/${outputAudioFilename}`;

  } catch (err) {
    logger.error(`[Audio Dubber] Error during video dubbing: ${err.message}`);
    return null;
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      logger.warn(`[Audio Dubber] Failed to clean up temp dir: ${e.message}`);
    }
  }
}

module.exports = { dubVideo };
