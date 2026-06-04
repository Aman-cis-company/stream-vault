const Joi = require('joi');

const CONTENT_RATINGS = ['G', 'PG', 'PG-13', '16+', '18+', '21+'];
const WARNING_FLAGS = ['violence', 'strong_language', 'mature_themes', 'nudity'];

const createSchema = Joi.object({
  category_id: Joi.number().integer().positive().optional().allow(null, '').label('Category'),
  title: Joi.string().min(1).max(255).required().label('Title'),
  description: Joi.string().max(5000).optional().allow('', null).label('Description'),
  provider_name: Joi.string().valid('bunny', 'youtube', 'vimeo', 'external', 'local').default('bunny').label('Provider'),
  provider_video_id: Joi.string().max(255).optional().allow('', null).label('Provider video ID'),
  video_url: Joi.string().max(1000).optional().allow('', null).label('Video URL'),
  duration: Joi.number().integer().min(0).optional().allow(null, '').label('Duration'),
  release_date: Joi.date().iso().optional().allow(null, '').label('Release date'),
  is_featured: Joi.boolean().default(false).label('Featured'),
  status: Joi.string().valid('published', 'draft', 'archived').default('draft').label('Status'),
  language: Joi.string().max(100).optional().allow('', null).label('Language'),
  content_rating: Joi.string().valid(...CONTENT_RATINGS).optional().allow(null, '').label('Content rating'),
  is_age_restricted: Joi.boolean().default(false).label('Age restricted'),
  minimum_age: Joi.number().integer().min(0).max(99).optional().allow(null, '').label('Minimum age'),
  warning_flags_json: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().valid(...WARNING_FLAGS)),
      Joi.string().max(500),
    )
    .optional().allow(null, '').label('Warning flags'),
});

const updateSchema = Joi.object({
  category_id: Joi.number().integer().positive().optional().allow(null, '').label('Category'),
  title: Joi.string().min(1).max(255).optional().label('Title'),
  description: Joi.string().max(5000).optional().allow('', null).label('Description'),
  provider_name: Joi.string().valid('bunny', 'youtube', 'vimeo', 'external').optional().label('Provider'),
  provider_video_id: Joi.string().max(255).optional().allow('', null).label('Provider video ID'),
  video_url: Joi.string().max(1000).optional().allow('', null).label('Video URL'),
  duration: Joi.number().integer().min(0).optional().allow(null, '').label('Duration'),
  release_date: Joi.date().iso().optional().allow(null, '').label('Release date'),
  is_featured: Joi.boolean().optional().label('Featured'),
  status: Joi.string().valid('published', 'draft', 'archived').optional().label('Status'),
  language: Joi.string().max(100).optional().allow('', null).label('Language'),
  content_rating: Joi.string().valid(...CONTENT_RATINGS).optional().allow(null, '').label('Content rating'),
  is_age_restricted: Joi.boolean().optional().label('Age restricted'),
  minimum_age: Joi.number().integer().min(0).max(99).optional().allow(null, '').label('Minimum age'),
  warning_flags_json: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().valid(...WARNING_FLAGS)),
      Joi.string().max(500),
    )
    .optional().allow(null, '').label('Warning flags'),
}).min(1);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.context?.label || d.context?.key,
      message: d.message,
    }));
    return res.status(422).json({ success: false, message: 'Validation failed.', errors });
  }
  // Convert empty strings to null for optional fields
  ['category_id', 'description', 'provider_video_id', 'video_url', 'duration', 'release_date',
   'language', 'content_rating', 'minimum_age', 'warning_flags_json'].forEach((key) => {
    if (value[key] === '') value[key] = null;
  });
  // Parse warning_flags_json if it came in as a JSON string
  if (typeof value.warning_flags_json === 'string' && value.warning_flags_json) {
    try { value.warning_flags_json = JSON.parse(value.warning_flags_json); } catch { value.warning_flags_json = null; }
  }
  req.body = value;
  next();
};

module.exports = {
  validateCreate: validate(createSchema),
  validateUpdate: validate(updateSchema),
};
