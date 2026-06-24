const nodemailer = require('nodemailer');
const logger = require('../../../src/config/logger');

let transporter = null;

const provider = process.env.EMAIL_PROVIDER || 'smtp'; // 'smtp', 'sendgrid', 'brevo'

if (provider === 'sendgrid') {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
  logger.info('[Notification Service] Initialized SendGrid email provider');
} else if (provider === 'brevo') {
  transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
      user: process.env.BREVO_USER || process.env.MAIL_USER,
      pass: process.env.BREVO_API_KEY || process.env.MAIL_PASSWORD,
    },
  });
  logger.info('[Notification Service] Initialized Brevo email provider');
} else {
  // Default SMTP (Nodemailer config)
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: parseInt(process.env.MAIL_PORT, 10) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
  logger.info('[Notification Service] Initialized SMTP email provider');
}

module.exports = transporter;
