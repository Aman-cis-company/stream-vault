const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(2).max(150).required().label('Name'),
  description: Joi.string().max(1000).optional().allow('', null).label('Description'),
  status: Joi.string().valid('active', 'inactive').default('active').label('Status'),
  is_age_restricted: Joi.boolean().default(false).label('Age restricted'),
  minimum_age: Joi.number().integer().min(0).max(99).optional().allow(null, '').label('Minimum age'),
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(150).optional().label('Name'),
  description: Joi.string().max(1000).optional().allow('', null).label('Description'),
  status: Joi.string().valid('active', 'inactive').optional().label('Status'),
  is_age_restricted: Joi.boolean().optional().label('Age restricted'),
  minimum_age: Joi.number().integer().min(0).max(99).optional().allow(null, '').label('Minimum age'),
}).min(1);

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
  validateCreate: validate(createSchema),
  validateUpdate: validate(updateSchema),
};
