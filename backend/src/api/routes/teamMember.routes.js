const express = require('express');
const router = express.Router();
const TeamMemberController = require('../controllers/TeamMemberController');
const authenticate = require('../middlewares/authenticate');
const checkPermission = require('../middlewares/checkPermission');
const Joi = require('joi');

// Joi validation schemas
const inviteSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required().label('First name'),
  last_name: Joi.string().min(2).max(100).required().label('Last name'),
  email: Joi.string().email().lowercase().required().label('Email'),
  role_id: Joi.number().integer().positive().required().label('Role ID'),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional().allow('').label('Phone'),
});

const acceptInviteSchema = Joi.object({
  token: Joi.string().required().label('Invitation Token'),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.' })
    .label('Password'),
});

const updateSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).optional().label('First name'),
  last_name: Joi.string().min(2).max(100).optional().label('Last name'),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional().allow('', null).label('Phone'),
  role_id: Joi.number().integer().positive().optional().label('Role ID'),
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

// ── Public Routes (Invitation Accept Flow) ──────────────────────────────────
router.post('/accept-invite', validate(acceptInviteSchema), TeamMemberController.acceptInvitation.bind(TeamMemberController));

// ── Protected Routes ────────────────────────────────────────────────────────
router.get('/', authenticate, checkPermission('team:read'), TeamMemberController.getAll.bind(TeamMemberController));
router.post('/invite', authenticate, checkPermission('team:write'), validate(inviteSchema), TeamMemberController.invite.bind(TeamMemberController));
router.get('/roles', authenticate, checkPermission('team:read'), TeamMemberController.getRoles.bind(TeamMemberController));
router.get('/activity-logs', authenticate, checkPermission('reports:read'), TeamMemberController.getActivityLogs.bind(TeamMemberController));

router.put('/:id', authenticate, checkPermission('team:write'), validate(updateSchema), TeamMemberController.update.bind(TeamMemberController));
router.post('/:id/toggle-status', authenticate, checkPermission('team:write'), TeamMemberController.toggleStatus.bind(TeamMemberController));
router.delete('/:id', authenticate, checkPermission('team:write'), TeamMemberController.delete.bind(TeamMemberController));

module.exports = router;
