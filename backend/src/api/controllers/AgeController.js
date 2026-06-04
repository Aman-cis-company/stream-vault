const bcrypt = require('bcryptjs');
const { User, UserAgeVerification } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

function calcAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

class AgeController {
  async verify(req, res) {
    try {
      const { date_of_birth } = req.body;
      if (!date_of_birth) {
        return errorResponse(res, 'date_of_birth is required.', STATUS_CODES.UNPROCESSABLE_ENTITY);
      }

      const age = calcAge(date_of_birth);
      if (age < 18) {
        return errorResponse(res, MESSAGES.AGE_VERIFICATION_FAILED, STATUS_CODES.FORBIDDEN);
      }

      const now = new Date();

      // Update user record
      await User.update(
        { date_of_birth, age_verified: true, verified_at: now },
        { where: { id: req.user.id } },
      );

      // Audit log
      await UserAgeVerification.create({
        user_id: req.user.id,
        date_of_birth,
        verified_age: age,
        ip_address: req.ip || null,
        user_agent: req.get('User-Agent') || null,
      });

      return successResponse(res, MESSAGES.AGE_VERIFIED, {
        age_verified: true,
        verified_at: now,
        age,
      });
    } catch (err) {
      logger.error('AgeController.verify error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async status(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'age_verified', 'verified_at', 'date_of_birth'],
      });

      return successResponse(res, MESSAGES.AGE_STATUS_FETCHED, {
        age_verified: user.age_verified,
        verified_at: user.verified_at,
        date_of_birth: user.date_of_birth,
      });
    } catch (err) {
      logger.error('AgeController.status error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new AgeController();
