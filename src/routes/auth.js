const express = require('express');
const router = express.Router();
const { register, login, changePassword, skipPasswordChange, registerFirstAdmin } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

// Register (Solo Admin)
router.post(
  '/register',
  protect,
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  handleValidationErrors,
  register
);

// Login
router.post(
  '/login',
  [
    body('phone').notEmpty().withMessage('Phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

// Register First Admin (no auth required - only if no admins exist)
router.post(
  '/register-first-admin',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  handleValidationErrors,
  registerFirstAdmin
);

// Change Password
router.post(
  '/change-password',
  protect,
  [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  handleValidationErrors,
  changePassword
);

// Skip Password Change Requirement
router.post('/skip-password-change', protect, skipPasswordChange);

module.exports = router;
