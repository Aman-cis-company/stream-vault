/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {string} message - Human-readable message
 * @param {any} data - Response payload
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {object} meta - Pagination or extra metadata
 */
const successResponse = (res, message, data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (meta !== null && meta !== undefined) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {Array} errors - Detailed error list
 */
const errorResponse = (res, message, statusCode = 500, errors = []) => {
  const response = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Build pagination meta object.
 * @param {number} total - Total record count
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 */
const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages,
    hasNextPage: parseInt(page, 10) < totalPages,
    hasPrevPage: parseInt(page, 10) > 1,
  };
};

module.exports = { successResponse, errorResponse, paginationMeta };
