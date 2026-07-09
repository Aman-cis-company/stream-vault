const FROM = process.env.MAIL_FROM || 'StreamVault <noreply@streamvault.com>';

const templates = {
  welcome: (data) => ({
    subject: 'Welcome to StreamVault!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">Welcome to StreamVault!</h2>
        <p>Hello ${data.first_name},</p>
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
    `,
    text: `Welcome to StreamVault, ${data.first_name}! Visit ${process.env.FRONTEND_URL || 'http://localhost:3000'}/plans to subscribe.`,
  }),

  password_reset: (data) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${data.resetToken}`;
    return {
      subject: 'Reset your StreamVault password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e50914;">StreamVault — Password Reset</h2>
          <p>Hello ${data.first_name},</p>
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
      `,
      text: `Reset your StreamVault password: ${resetUrl}`,
    };
  },

  subscription_confirmation: (data) => ({
    subject: `StreamVault - ${data.plan.name} Subscription Confirmed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">Subscription Confirmed!</h2>
        <p>Hello ${data.first_name},</p>
        <p>Your <strong>${data.plan.name}</strong> subscription is now active.</p>
        <p>Enjoy unlimited streaming at StreamVault!</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">StreamVault &mdash; Your ultimate streaming destination</p>
      </div>
    `,
    text: `Your ${data.plan.name} subscription is now active. Enjoy StreamVault!`,
  }),

  payment_failed: (data) => ({
    subject: 'StreamVault - Payment Failed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">Payment Failed</h2>
        <p>Hello ${data.first_name},</p>
        <p>We were unable to process your payment for the <strong>${data.planName}</strong> plan.</p>
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
    `,
    text: `Payment failed for ${data.planName}. Update your payment at ${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`,
  }),

  invoice: (data) => ({
    subject: 'Your StreamVault Invoice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c0392b;">Your StreamVault Invoice</h2>
        <p>Hello ${data.first_name},</p>
        <p>Thank you for your purchase. Your invoice <strong>${data.invoice.invoice_number}</strong> is attached to this email.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f9f9f9;">
            <th style="border: 1px solid #eee; padding: 10px; text-align: left; font-weight: bold;">Plan Name</th>
            <td style="border: 1px solid #eee; padding: 10px;">${data.planName}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #eee; padding: 10px; text-align: left; font-weight: bold;">Amount</th>
            <td style="border: 1px solid #eee; padding: 10px;">${data.invoice.currency} ${data.invoice.total_amount}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <th style="border: 1px solid #eee; padding: 10px; text-align: left; font-weight: bold;">Transaction ID</th>
            <td style="border: 1px solid #eee; padding: 10px;">${data.payment?.stripe_payment_intent_id || 'N/A'}</td>
          </tr>
        </table>
        
        <p>Enjoy streaming your favorite movies and shows in 4K UHD!</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">StreamVault &mdash; Your ultimate streaming destination</p>
      </div>
    `,
    text: `Thank you for your purchase. Your invoice ${data.invoice.invoice_number} for the ${data.planName} plan is attached. Total: ${data.invoice.currency} ${data.invoice.total_amount}. Transaction ID: ${data.payment?.stripe_payment_intent_id || 'N/A'}.`,
    attachments: [
      {
        filename: `invoice-${data.invoice.invoice_number}.pdf`,
        path: data.pdfPath,
      }
    ]
  }),

  login: (data) => ({
    subject: 'StreamVault - New Login Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #222; border-radius: 12px; background-color: #0c0a09; color: #f5f5f4;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #a855f7; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">StreamVault</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a855f7; opacity: 0.8;">Security Alert</span>
        </div>
        <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; font-weight: 700;">New Login Detected</h3>
        <p style="color: #e7e5e4; font-size: 14px; line-height: 1.5;">Hello ${data.first_name},</p>
        <p style="color: #d6d3d1; font-size: 14px; line-height: 1.6;">We detected a new login to your StreamVault account on <strong>${new Date().toLocaleString('en-IN')}</strong>.</p>
        <p style="color: #a8a29e; font-size: 13px; line-height: 1.6; margin-top: 20px;">If this was you, no action is needed. Keep enjoying unlimited access to movies and shows. If you did not log in, please secure your account immediately by resetting your password.</p>
        <div style="text-align: center; margin: 30px 0 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile"
             style="background-color: #a855f7; color: white; padding: 12px 28px;
                    text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.35);">
            Manage Account Settings
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0 20px 0;">
        <p style="color: #78716c; font-size: 11px; text-align: center; margin: 0;">StreamVault &mdash; Your ultimate streaming destination</p>
      </div>
    `,
    text: `Hello ${data.first_name}, a new login was detected on your StreamVault account at ${new Date().toLocaleString('en-IN')}. If this wasn't you, please secure your account.`,
  }),
};

module.exports = { templates, FROM };
