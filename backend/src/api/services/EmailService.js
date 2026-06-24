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

  async sendTeamInvitationEmail(user, token) {
    try {
      logger.info('Enqueuing team invitation email job', { to: user.email });
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;
      return await this.sendMail({
        to: user.email,
        subject: 'Invitation to join StreamVault Team',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #7000FF;">Welcome to StreamVault!</h2>
            <p>Hello ${user.first_name},</p>
            <p>You have been invited to join the StreamVault Team as a member of our staff.</p>
            <p>Please click the button below to accept the invitation, set your password, and activate your account:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #7000FF; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation & Activate</a>
            </p>
            <p style="color: #666; font-size: 13px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #7000FF; font-size: 13px;">${inviteLink}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This invitation link will expire in 24 hours. If you did not expect this invitation, please ignore this email.</p>
          </div>
        `,
        text: `Hello ${user.first_name}, You have been invited to join the StreamVault Team. Please copy and paste this link in your browser to accept the invitation and activate your account: ${inviteLink}`,
      });
    } catch (err) {
      logger.error('Failed to enqueue team invitation email', { to: user.email, error: err.message });
      throw err;
    }
  }
}

module.exports = new EmailService();