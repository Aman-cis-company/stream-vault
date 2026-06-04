const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * Generate a JWT access token.
 * @param {object} payload - Data to encode (id, email, role)
 * @returns {string} Signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    // expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'streamvault',
    audience: 'streamvault-client',
  });
};

/**
 * Verify a JWT access token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'streamvault',
    audience: 'streamvault-client',
  });
};

/**
 * Generate a refresh token string (UUID-based).
 * @returns {string}
 */
const generateRefreshToken = () => {
  return uuidv4() + '-' + uuidv4();
};

/**
 * Calculate refresh token expiry date.
 * @returns {Date}
 */
const getRefreshTokenExpiry = () => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) throw new Error('Invalid REFRESH_TOKEN_EXPIRES_IN format');

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[unit];

  return new Date(Date.now() + value * ms);
};

/**
 * Generate a 6-digit numeric OTP.
 * @returns {string}
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a signed password reset token.
 * @param {object} payload
 * @returns {string}
 */
const generatePasswordResetToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET + '_reset', {
    expiresIn: '1h',
    issuer: 'streamvault',
  });
};

/**
 * Verify a password reset token.
 * @param {string} token
 * @returns {object}
 */
const verifyPasswordResetToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET + '_reset', {
    issuer: 'streamvault',
  });
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  generateOTP,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};
