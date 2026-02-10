const express = require('express');
const router = express.Router();
const {
  getCurrentUser,
  getUser,
  getAllUsers,
  updateProfile,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Get current user
router.get('/me', protect, getCurrentUser);

// Update profile
router.put('/me', protect, updateProfile);

// Get all users (admin)
router.get('/', protect, authorize('ADMIN'), getAllUsers);

// Get user events
router.get('/:id/events', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id).populate('registeredEvents');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user.registeredEvents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user by ID (admin)
router.get('/:id', protect, authorize('ADMIN'), getUser);

// Update user by ID (admin)
router.put('/:id', protect, authorize('ADMIN'), updateUser);

// Delete user by ID (admin)
router.delete('/:id', protect, authorize('ADMIN'), deleteUser);

module.exports = router;
