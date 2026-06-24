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
};

module.exports = { templates, FROM };
