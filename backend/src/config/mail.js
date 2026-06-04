require('dotenv').config();
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
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

transporter.verify((error) => {
  if (error) {
    logger.warn('Mail transporter verification failed', { error: error.message });
  } else {
    logger.info('Mail transporter is ready');
  }
});

module.exports = transporter;
