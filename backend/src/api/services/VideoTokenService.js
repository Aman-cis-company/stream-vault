const crypto = require('crypto');
require('dotenv').config();

class VideoTokenService {
  constructor() {
    // Use a separate secret derived from JWT_SECRET so video tokens can be invalidated independently
    this.secret = (process.env.JWT_SECRET || 'default-secret') + '_video_stream';
  }

  /**
   * Generate a signed, time-limited token for streaming a specific video file.
   * @param {number|string} userId
   * @param {string} filename - basename of the video file
   * @param {number} ttlMs - token lifetime in ms (default 4 hours)
   * @returns {string}
   */
  generate(userId, filename, ttlMs = 4 * 60 * 60 * 1000) {
    const payload = JSON.stringify({ userId: String(userId), filename, exp: Date.now() + ttlMs });
    const sig = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    return Buffer.from(payload).toString('base64url') + '.' + sig;
  }

  /**
   * Verify a token and return the payload, or null if invalid/expired.
   * @param {string} token
   * @returns {{ userId: string, filename: string, exp: number } | null}
   */
  verify(token) {
    try {
      const dotIdx = token.lastIndexOf('.');
      if (dotIdx === -1) return null;

      const encodedPayload = token.slice(0, dotIdx);
      const sig = token.slice(dotIdx + 1);

      const payload = Buffer.from(encodedPayload, 'base64url').toString();
      const expected = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');

      // Constant-time comparison to prevent timing attacks
      const sigBuf = Buffer.from(sig.padEnd(64, '0').slice(0, 64), 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sig.length !== expected.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

      const data = JSON.parse(payload);
      if (!data.filename || !data.exp || Date.now() > data.exp) return null;

      return data;
    } catch {
      return null;
    }
  }
}

module.exports = new VideoTokenService();
