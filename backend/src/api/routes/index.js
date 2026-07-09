const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const movieRoutes = require('./movie.routes');
const stripeRoutes = require('./stripe.routes');
const teamMemberRoutes = require('./teamMember.routes');
const dashboardRoutes = require('./dashboard.routes');
const videoRoutes = require('./video.routes');
const ageRoutes = require('./age.routes');
const parentalControlsRoutes = require('./parentalControls.routes');
const seriesRoutes = require('./series.routes');
const progressRoutes = require('./progress.routes');
const interactionRoutes = require('./interaction.routes');
const userRoutes = require('./user.routes');
const affiliateRoutes = require('./affiliate.routes');
const complianceRoutes = require('./compliance.routes');
const invoiceRoutes = require('./invoice.routes');
const internalRoutes = require('./internal.routes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'StreamVault API is running',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

// Test Email endpoint (public, sends to aman.k@cisinlabs.com)
router.get('/test-email', async (req, res) => {
  try {
    const transporter = require('../../../services/notification/providers/emailProvider');
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'StreamVault <noreply@streamvault.com>',
      to: 'aman.k@cisinlabs.com',
      subject: 'StreamVault - Brevo Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #222; border-radius: 12px; background-color: #0c0a09; color: #f5f5f4; text-align: center;">
          <h2 style="color: #a855f7; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">StreamVault Test</h2>
          <p style="color: #d6d3d1; font-size: 14px; line-height: 1.6; margin-top: 15px;">This is a test email sent from the StreamVault API to verify that the Brevo (Bravo) email integration is working correctly.</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 25px 0;">
          <p style="color: #78716c; font-size: 11px; margin: 0;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
        </div>
      `,
      text: 'This is a test email to verify that the Brevo (Bravo) email integration is working correctly.',
    });

    const nodemailer = require('nodemailer');
    const previewUrl = nodemailer.getTestMessageUrl(info);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      previewUrl: previewUrl || null,
      provider: process.env.EMAIL_PROVIDER || 'smtp',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/movies', movieRoutes);
router.use('/stripe', stripeRoutes);
router.use('/team-members', teamMemberRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/videos', videoRoutes);
router.use('/age', ageRoutes);
router.use('/parental-controls', parentalControlsRoutes);
router.use('/series', seriesRoutes);
router.use('/progress', progressRoutes);
router.use('/interactions', interactionRoutes);
router.use('/user', userRoutes);
router.use('/affiliate', affiliateRoutes);
router.use('/compliance', complianceRoutes);
router.use('/internal', internalRoutes);
router.use('/', invoiceRoutes);

module.exports = router;
