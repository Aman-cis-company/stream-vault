const bcrypt = require('bcryptjs');
const { ParentalControl } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class ParentalControlsController {
  async get(req, res) {
    try {
      const controls = await ParentalControl.findOne({ where: { user_id: req.user.id } });
      return successResponse(res, MESSAGES.PARENTAL_CONTROLS_FETCHED, {
        parental_controls: controls || {
          pin_enabled: false,
          hide_restricted_content: false,
          max_rating: null,
        },
      });
    } catch (err) {
      logger.error('ParentalControlsController.get error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async save(req, res) {
    try {
      const { pin_enabled, pin, current_pin, hide_restricted_content, max_rating } = req.body;
      const existing = await ParentalControl.scope('withPin').findOne({ where: { user_id: req.user.id } });

      // If PIN is currently enabled, require and verify the current PIN for any updates
      if (existing && existing.pin_enabled && existing.pin_hash) {
        if (!current_pin) {
          return errorResponse(res, 'Current PIN is required to modify parental controls.', STATUS_CODES.UNPROCESSABLE_ENTITY);
        }
        const valid = await bcrypt.compare(String(current_pin), existing.pin_hash);
        if (!valid) {
          return errorResponse(res, MESSAGES.PARENTAL_CONTROLS_PIN_INVALID, STATUS_CODES.FORBIDDEN);
        }
      }

      let pinHash = existing?.pin_hash ?? null;

      // Setting or changing PIN
      if (pin_enabled && pin) {
        pinHash = await bcrypt.hash(String(pin), 10);
      }

      // Disabling PIN
      if (!pin_enabled) {
        pinHash = null;
      }

      const payload = {
        user_id: req.user.id,
        pin_enabled: Boolean(pin_enabled),
        pin_hash: pinHash,
        hide_restricted_content: Boolean(hide_restricted_content),
        max_rating: max_rating || null,
      };

      if (existing) {
        await existing.update(payload);
      } else {
        await ParentalControl.create(payload);
      }

      return successResponse(res, MESSAGES.PARENTAL_CONTROLS_SAVED, {
        parental_controls: {
          pin_enabled: payload.pin_enabled,
          hide_restricted_content: payload.hide_restricted_content,
          max_rating: payload.max_rating,
        },
      });
    } catch (err) {
      logger.error('ParentalControlsController.save error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPin(req, res) {
    try {
      const { pin } = req.body;
      const controls = await ParentalControl.scope('withPin').findOne({ where: { user_id: req.user.id } });

      if (!controls || !controls.pin_enabled || !controls.pin_hash) {
        return successResponse(res, 'PIN not set.', { valid: true });
      }

      const valid = await bcrypt.compare(String(pin), controls.pin_hash);
      if (!valid) {
        return errorResponse(res, MESSAGES.PARENTAL_CONTROLS_PIN_INVALID, STATUS_CODES.FORBIDDEN);
      }

      return successResponse(res, 'PIN verified.', { valid: true });
    } catch (err) {
      logger.error('ParentalControlsController.verifyPin error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new ParentalControlsController();
