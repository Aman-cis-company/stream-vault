const { addNotificationJob } = require('../../queue');
const logger = require('../../config/logger');

class EmailService {
  async sendMail({ to, subject, html, text, attachments }) {
    try {
      logger.info('Enqueuing generic email job', { to, subject });
      return await addNotificationJob('send_email', { to, subject, html, text, attachments });
    } catch (err) {
      logger.error('Failed to enqueue generic email job', { to, subject, error: err.message });
      throw err;
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    try {
      logger.info('Enqueuing password reset email job', { to: user.email });
      return await addNotificationJob('send_email_template', {
        template: 'password_reset',
        to: user.email,
        data: {
          first_name: user.first_name,
          resetToken,
        },
      });
    } catch (err) {
      logger.error('Failed to enqueue password reset email', { to: user.email, error: err.message });
      throw err;
    }
  }

  async sendWelcomeEmail(user) {
    try {
      logger.info('Enqueuing welcome email job', { to: user.email });
      return await addNotificationJob('send_email_template', {
        template: 'welcome',
        to: user.email,
        data: {
          first_name: user.first_name,
        },
      });
    } catch (err) {
      logger.error('Failed to enqueue welcome email', { to: user.email, error: err.message });
      throw err;
    }
  }

  async sendSubscriptionConfirmation(user, plan) {
    try {
      logger.info('Enqueuing subscription confirmation email job', { to: user.email });
      return await addNotificationJob('send_email_template', {
        template: 'subscription_confirmation',
        to: user.email,
        data: {
          first_name: user.first_name,
          plan: {
            name: plan.name,
          },
        },
      });
    } catch (err) {
      logger.error('Failed to enqueue subscription confirmation email', { to: user.email, error: err.message });
      throw err;
    }
  }

  async sendPaymentFailedEmail(user, planName) {
    try {
      logger.info('Enqueuing payment failed email job', { to: user.email });
      return await addNotificationJob('send_email_template', {
        template: 'payment_failed',
        to: user.email,
        data: {
          first_name: user.first_name,
          planName,
        },
      });
    } catch (err) {
      logger.error('Failed to enqueue payment failed email', { to: user.email, error: err.message });
      throw err;
    }
  }

  async sendInvoiceEmail(user, planName, invoice, payment, pdfPath) {
    try {
      logger.info('Enqueuing invoice email job', { to: user.email });
      return await addNotificationJob('send_email_template', {
        template: 'invoice',
        to: user.email,
        data: {
          first_name: user.first_name,
          email: user.email,
          phone: user.phone,
          planName,
          invoice: {
            invoice_number: invoice.invoice_number,
            currency: invoice.currency,
            total_amount: invoice.total_amount,
            amount: invoice.amount,
            tax_amount: invoice.tax_amount,
          },
          payment: {
            payment_method: payment?.payment_method,
            stripe_payment_intent_id: payment?.stripe_payment_intent_id,
          },
          pdfPath,
        },
      });
    } catch (err) {
      logger.error('Failed to enqueue invoice email', { to: user.email, error: err.message });
      throw err;
    }
  }
}

module.exports = new EmailService();