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

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'StreamVault API is running',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
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

module.exports = router;
