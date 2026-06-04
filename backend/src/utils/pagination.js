/**
 * Parse and return pagination params from query string.
 * @param {object} query - req.query
 * @param {number} defaultLimit
 * @returns {{ page, limit, offset }}
 */
const getPagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = { getPagination };
