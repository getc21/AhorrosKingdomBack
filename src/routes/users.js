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

// Get user by ID (admin)
router.get('/:id', protect, authorize('ADMIN'), getUser);

// Update user by ID (admin)
router.put('/:id', protect, authorize('ADMIN'), updateUser);

// Delete user by ID (admin)
router.delete('/:id', protect, authorize('ADMIN'), deleteUser);

module.exports = router;
