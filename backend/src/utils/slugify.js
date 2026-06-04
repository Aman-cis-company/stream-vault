const slugifyLib = require('slugify');

/**
 * Generate a URL-safe slug from a string.
 * @param {string} text
 * @returns {string}
 */
const slugify = (text) => {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

/**
 * Generate a unique slug by appending a timestamp suffix if needed.
 * @param {string} text
 * @param {Function} checkExists - async fn(slug) => boolean
 * @returns {Promise<string>}
 */
const generateUniqueSlug = async (text, checkExists) => {
  const base = slugify(text);
  let candidate = base;
  let counter = 1;

  while (await checkExists(candidate)) {
    candidate = `${base}-${counter}`;
    counter++;
  }

  return candidate;
};

module.exports = { slugify, generateUniqueSlug };
