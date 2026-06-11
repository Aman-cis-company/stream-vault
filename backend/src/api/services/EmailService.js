const nodemailer = require('nodemailer');
const transporter = require('../../config/mail');
const logger = require('../../config/logger');

const FROM = process.env.MAIL_FROM || 'StreamVault <noreply@streamvault.com>';

class EmailService {
  async sendMail({ to, subject, html, text }) {
    try {
      const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
      logger.info('Email sent', { to, subject, messageId: info.messageId });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) logger.info(`📬 Preview: ${previewUrl}`);

      return info;
    } catch (err) {
      logger.error('Failed to send email', { to, subject, error: err.message });
      throw err;
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">StreamVault — Password Reset</h2>
        <p>Hello ${user.first_name},</p>
        <p>You requested to reset your password. Click the button below to continue:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #e50914; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 4px; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">StreamVault &mdash; Your ultimate streaming destination</p>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'Reset your StreamVault password',
      html,
      text: `Reset your StreamVault password: ${resetUrl}`,
    });
  }

  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">Welcome to StreamVault!</h2>
        <p>Hello ${user.first_name},</p>
        <p>Your account has been created successfully. Start exploring thousands of movies and shows.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/plans"
             style="background-color: #e50914; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 4px; font-size: 16px;">
            View Plans
          </a>
        </div>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">StreamVault &mdash; Your ultimate streaming destination</p>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'Welcome to StreamVault!',
      html,
      text: `Welcome to StreamVault, ${user.first_name}! Visit ${process.env.FRONTEND_URL}/plans to subscribe.`,
    });
  }

  async sendSubscriptionConfirmation(user, plan) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">Subscription Confirmed!</h2>
        <p>Hello ${user.first_name},</p>
        <p>Your <strong>${plan.name}</strong> subscription is now active.</p>
        <p>Enjoy unlimited streaming at StreamVault!</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">StreamVault &mdash; Your ultimate streaming destination</p>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: `StreamVault - ${plan.name} Subscription Confirmed`,
      html,
      text: `Your ${plan.name} subscription is now active. Enjoy StreamVault!`,
    });
  }

  async sendPaymentFailedEmail(user, planName) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">Payment Failed</h2>
        <p>Hello ${user.first_name},</p>
        <p>We were unable to process your payment for the <strong>${planName}</strong> plan.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing"
             style="background-color: #e50914; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 4px; font-size: 16px;">
            Update Payment
          </a>
        </div>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">StreamVault &mdash; Your ultimate streaming destination</p>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'StreamVault - Payment Failed',
      html,
      text: `Payment failed for ${planName}. Update your payment at ${process.env.FRONTEND_URL}/billing`,
    });
  }
}

module.exports = new EmailService();