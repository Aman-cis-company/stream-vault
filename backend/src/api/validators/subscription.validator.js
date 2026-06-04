const Joi = require('joi');

const createCustomerSchema = Joi.object({
  name: Joi.string().optional().label('Name'),
  email: Joi.string().email().optional().label('Email'),
});

// Stripe injects {CHECKOUT_SESSION_ID} into the success URL before redirecting,
// so the raw value sent by the client is not a valid URI — validate as a string.
const urlWithTemplate = Joi.string().pattern(/^https?:\/\/.+/).optional();

const createCheckoutSchema = Joi.object({
  plan_id: Joi.number().integer().positive().required().label('Plan ID'),
  success_url: urlWithTemplate.label('Success URL'),
  cancel_url: urlWithTemplate.label('Cancel URL'),
});

const createSubscriptionSchema = Joi.object({
  plan_id: Joi.number().integer().positive().required().label('Plan ID'),
  payment_method_id: Joi.string().optional().label('Payment method ID'),
});

const cancelSubscriptionSchema = Joi.object({
  subscription_id: Joi.number().integer().positive().required().label('Subscription ID'),
});

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
  validateCreateCustomer: validate(createCustomerSchema),
  validateCreateCheckout: validate(createCheckoutSchema),
  validateCreateSubscription: validate(createSubscriptionSchema),
  validateCancelSubscription: validate(cancelSubscriptionSchema),
};
