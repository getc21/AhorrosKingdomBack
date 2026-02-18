const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, phone, password, planType, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with that phone number' });
    }

    // Create user
    user = await User.create({
      name,
      phone,
      password,
      planType: planType || 'Ahorro Campamento 2027',
      role: role || 'USER',
      needsPasswordChange: true
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        planType: user.planType,
        needsPasswordChange: true, // Siempre true para nuevos registros
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log('Login attempt:', { phone, password: '***' });

    // Validation
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide phone and password' });
    }

    // Check for user - obtener TODOS los campos incluyendo password
    const user = await User.findOne({ phone }).select('+password');
    console.log('Login attempt for user:', phone);
    
    if (!user) {
      console.log('User not found:', phone);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('User found. needsPasswordChange value in DB:', user.needsPasswordChange);

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', phone);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Enviar el valor EXACTO de la base de datos
    const needsChange = user.needsPasswordChange === true;
    console.log('Login successful for:', phone, '- needsPasswordChange:', needsChange);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        planType: user.planType,
        needsPasswordChange: needsChange,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    console.log('=== Change password requested for user:', req.user.id);

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide old and new password' });
    }

    // Get user WITH password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check old password
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      console.log('Old password incorrect for user:', req.user.id);
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    // Update password and flag USING .save() so bcrypt middleware executes
    user.password = newPassword;
    user.needsPasswordChange = false;
    await user.save();
    
    console.log('✓ Password changed successfully for user:', user.phone);
    console.log('✓ needsPasswordChange flag set to:', user.needsPasswordChange);

    res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        planType: user.planType,
        needsPasswordChange: false,
      }
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/auth/skip-password-change
 * @desc    Skip mandatory password change
 * @access  Private
 */
exports.skipPasswordChange = async (req, res) => {
  try {
    console.log('=== Skip password change requested for user:', req.user.id);
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { needsPasswordChange: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✓ Skipped password change for user:', user.phone);
    console.log('✓ needsPasswordChange flag set to:', user.needsPasswordChange);

    res.status(200).json({ 
      success: true, 
      message: 'Password change requirement dismissed',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        planType: user.planType,
        needsPasswordChange: false,
      }
    });
  } catch (err) {
    console.error('Skip password change error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/auth/register-first-admin
 * @desc    Register the FIRST admin (no auth required)
 * @access  Public - Only works if no admins exist
 */
exports.registerFirstAdmin = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Check if any admin already exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      return res.status(403).json({ 
        success: false, 
        message: 'An admin already exists. Use the regular register endpoint with admin authentication.' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with that phone number' });
    }

    // Create first admin
    user = await User.create({
      name,
      phone,
      password,
      planType: 'Ahorro Campamento 2027',
      role: 'ADMIN',
      needsPasswordChange: false
    });

    const token = generateToken(user._id);

    console.log('✓ First admin created:', user.phone);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        planType: user.planType,
        needsPasswordChange: false,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
