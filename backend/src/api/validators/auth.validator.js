const Joi = require('joi');

const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required().label('First name'),
  last_name: Joi.string().min(2).max(100).required().label('Last name'),
  email: Joi.string().email().lowercase().required().label('Email'),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.',
    })
    .label('Password'),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional().allow('').label('Phone'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required().label('Email'),
  password: Joi.string().required().label('Password'),
  forceLogout: Joi.boolean().optional().label('Force logout'),
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().label('Refresh token'),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required().label('Email'),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().label('Reset token'),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.',
    })
    .label('New password'),
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).optional().label('First name'),
  last_name: Joi.string().min(2).max(100).optional().label('Last name'),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional().allow('', null).label('Phone'),
  avatar: Joi.string().uri().optional().allow('', null).label('Avatar'),
  current_password: Joi.string().optional(),        // ← allow it through
  password: Joi.string().min(8).max(128).optional(),
});

/**
 * Middleware factory: validates req.body against schema.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.context.label || d.context.key,
      message: d.message,
    }));
    return res.status(422).json({ success: false, message: 'Validation failed.', errors });
  }
  req.body = value;
  next();
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateRefreshToken: (req, res, next) => {
    const token = req.cookies?.refresh_token || req.body?.refresh_token;
    if (!token) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: [{ field: 'refresh_token', message: '"Refresh token" is required' }]
      });
    }
    req.body.refresh_token = token;
    next();
  },
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateUpdateProfile: validate(updateProfileSchema),
};
