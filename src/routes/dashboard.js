const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUserDashboard,
  getAdminStats,
  getRanking,
  getMyBadges,
  getUserBadges,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// Get current user dashboard
router.get('/me', protect, getDashboard);

// Get ranking
router.get('/ranking', protect, getRanking);

// Get my badges
router.get('/badges/my', protect, getMyBadges);

// Get user badges (admin view)
router.get('/badges/user/:id', protect, authorize('ADMIN'), getUserBadges);

// Get admin statistics
router.get('/admin/stats', protect, authorize('ADMIN'), getAdminStats);

// Get user dashboard (admin view)
router.get('/user/:id', protect, authorize('ADMIN'), getUserDashboard);

module.exports = router;
