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

// Get user events (user can get their own, admin can get anyone's)
router.get('/:id/events', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const requestingUser = req.user; // From protect middleware
    const targetUserId = req.params.id;
    
    // User can only get their own events, unless they're ADMIN
    if (requestingUser.role !== 'ADMIN' && requestingUser._id.toString() !== targetUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these events' });
    }
    
    const user = await User.findById(targetUserId).populate('registeredEvents');
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
