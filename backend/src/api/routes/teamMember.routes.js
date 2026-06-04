const express = require('express');
const router = express.Router();
const TeamMemberController = require('../controllers/TeamMemberController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const Joi = require('joi');
const ROLES = require('../../constants/roles');

// Inline validator for team member creation
const createSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required().label('First name'),
  last_name: Joi.string().min(2).max(100).required().label('Last name'),
  email: Joi.string().email().lowercase().required().label('Email'),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.' })
    .label('Password'),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional().allow('').label('Phone'),
});

const updateSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).optional().label('First name'),
  last_name: Joi.string().min(2).max(100).optional().label('Last name'),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional().allow('', null).label('Phone'),
  status: Joi.string().valid('active', 'inactive').optional().label('Status'),
  password: Joi.string().min(8).max(128).optional().label('Password'),
}).min(1);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.context.label || d.context.key, message: d.message }));
    return res.status(422).json({ success: false, message: 'Validation failed.', errors });
  }
  req.body = value;
  next();
};

const adminOnly = [authenticate, authorize(ROLES.SUPER_ADMIN)];

router.post('/', ...adminOnly, validate(createSchema), TeamMemberController.create.bind(TeamMemberController));
router.get('/', ...adminOnly, TeamMemberController.getAll.bind(TeamMemberController));
router.put('/:id', ...adminOnly, validate(updateSchema), TeamMemberController.update.bind(TeamMemberController));
router.delete('/:id', ...adminOnly, TeamMemberController.delete.bind(TeamMemberController));

module.exports = router;
