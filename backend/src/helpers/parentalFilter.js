const { Op } = require('sequelize');

const RATINGS_ORDER = ['G', 'PG', 'PG-13', '16+', '18+', '21+'];

/**
 * Checks if the content rating index is higher than the max rating index.
 * Returns true if blocked.
 */
const isRatingBlocked = (contentRating, maxRating) => {
  if (!maxRating || !contentRating) return false;
  const contentIdx = RATINGS_ORDER.indexOf(contentRating);
  const maxIdx = RATINGS_ORDER.indexOf(maxRating);
  if (contentIdx === -1 || maxIdx === -1) return false;
  return contentIdx > maxIdx;
};

/**
 * Returns list of allowed ratings up to maxRating (inclusive).
 */
const getAllowedRatings = (maxRating) => {
  if (!maxRating) return null;
  const maxIdx = RATINGS_ORDER.indexOf(maxRating);
  if (maxIdx === -1) return null;
  return RATINGS_ORDER.slice(0, maxIdx + 1);
};

/**
 * Generates Sequelize where conditions for parental controls.
 */
const getParentalQueryFilters = (controls) => {
  if (!controls) return {};

  const queryFilters = {};

  if (controls.hide_restricted_content) {
    queryFilters.is_age_restricted = false;
  }

  if (controls.max_rating) {
    const allowed = getAllowedRatings(controls.max_rating);
    if (allowed) {
      queryFilters[Op.and] = [
        {
          [Op.or]: [
            { content_rating: null },
            { content_rating: { [Op.in]: allowed } }
          ]
        }
      ];
    }
  }

  return queryFilters;
};

/**
 * Filters an array of content models/objects by parental controls.
 */
const filterContentByParentalControls = (items, controls) => {
  if (!controls) return items;
  return items.filter(item => {
    if (controls.hide_restricted_content && item.is_age_restricted) {
      return false;
    }
    if (controls.max_rating && isRatingBlocked(item.content_rating, controls.max_rating)) {
      return false;
    }
    return true;
  });
};

module.exports = {
  isRatingBlocked,
  getAllowedRatings,
  getParentalQueryFilters,
  filterContentByParentalControls
};
