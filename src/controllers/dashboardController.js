const User = require('../models/User');
const Deposit = require('../models/Deposit');
const { generateMotivationalMessage } = require('../utils/messageGenerator');

const SAVINGS_GOAL = 500; // Bs

/**
 * @route   GET /api/dashboard/me
 * @desc    Get user dashboard with savings info
 * @access  Private
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📊 Dashboard Request - User ID:', userId);

    // Get all deposits for user
    const deposits = await Deposit.find({ userId })
      .sort({ createdAt: -1 });
    
    console.log('💰 Deposits found:', deposits.length);
    console.log('Deposits:', deposits);

    // Calculate totals
    const totalSaved = deposits.reduce((sum, dep) => sum + dep.amount, 0);
    const progressPercent = Math.min((totalSaved / SAVINGS_GOAL) * 100, 100);
    const remainingAmount = Math.max(SAVINGS_GOAL - totalSaved, 0);

    console.log('Total Saved:', totalSaved);

    // Get last deposit date
    const lastDeposit = deposits.length > 0 ? deposits[0].createdAt : null;

    // Generate motivational message
    const motivationalMessage = generateMotivationalMessage(progressPercent, lastDeposit);

    res.status(200).json({
      success: true,
      data: {
        totalSaved: parseFloat(totalSaved.toFixed(2)),
        goal: SAVINGS_GOAL,
        progressPercent: parseFloat(progressPercent.toFixed(2)),
        remainingAmount: parseFloat(remainingAmount.toFixed(2)),
        motivationalMessage,
        lastDepositDate: lastDeposit,
        depositCount: deposits.length,
        depositHistory: deposits.map((d) => ({
          id: d._id,
          amount: d.amount,
          date: d.createdAt,
          description: d.description,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/dashboard/user/:id
 * @desc    Get user dashboard (admin view)
 * @access  Private/Admin
 */
exports.getUserDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get all deposits for user
    const deposits = await Deposit.find({ userId: id })
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalSaved = deposits.reduce((sum, dep) => sum + dep.amount, 0);
    const progressPercent = Math.min((totalSaved / SAVINGS_GOAL) * 100, 100);
    const remainingAmount = Math.max(SAVINGS_GOAL - totalSaved, 0);

    // Get last deposit date
    const lastDeposit = deposits.length > 0 ? deposits[0].createdAt : null;

    // Generate motivational message
    const motivationalMessage = generateMotivationalMessage(progressPercent, lastDeposit);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          planType: user.planType,
        },
        totalSaved: parseFloat(totalSaved.toFixed(2)),
        goal: SAVINGS_GOAL,
        progressPercent: parseFloat(progressPercent.toFixed(2)),
        remainingAmount: parseFloat(remainingAmount.toFixed(2)),
        motivationalMessage,
        lastDepositDate: lastDeposit,
        depositCount: deposits.length,
        depositHistory: deposits.map((d) => ({
          id: d._id,
          amount: d.amount,
          date: d.createdAt,
          description: d.description,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/dashboard/ranking
 * @desc    Get ranking of users by total savings
 * @access  Private
 */
exports.getRanking = async (req, res) => {
  try {
    // Get all active users
    const users = await User.find({ isActive: true, role: 'USER' });

    // Calculate totals for each user
    const ranking = await Promise.all(
      users.map(async (user) => {
        const deposits = await Deposit.find({ userId: user._id });
        const totalSaved = deposits.reduce((sum, dep) => sum + dep.amount, 0);
        const depositCount = deposits.length;
        
        return {
          id: user._id,
          name: user.name,
          phone: user.phone,
          totalSaved: parseFloat(totalSaved.toFixed(2)),
          depositCount,
          progressPercent: parseFloat(Math.min((totalSaved / SAVINGS_GOAL) * 100, 100).toFixed(2)),
        };
      })
    );

    // Sort by total saved (descending)
    ranking.sort((a, b) => b.totalSaved - a.totalSaved);

    // Add position
    const rankingWithPosition = ranking.map((user, index) => ({
      position: index + 1,
      ...user,
    }));

    res.status(200).json({
      success: true,
      data: rankingWithPosition,
    });
  } catch (err) {
    console.error('Error getting ranking:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/dashboard/admin/stats
 * @desc    Get admin statistics
 * @access  Private/Admin
 */
exports.getAdminStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({ role: 'USER' });

    // Total deposits and amount
    const deposits = await Deposit.find();
    const totalAmount = deposits.reduce((sum, dep) => sum + dep.amount, 0);

    // Users by plan
    const usersByPlan = await User.aggregate([
      { $match: { role: 'USER' } },
      { $group: { _id: '$planType', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDeposits: deposits.length,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        usersByPlan,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/dashboard/badges/my
 * @desc    Get current user badges
 * @access  Private
 */
exports.getMyBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        badges: user.badges || [],
        totalBadges: (user.badges || []).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/dashboard/badges/user/:id
 * @desc    Get user badges (admin view)
 * @access  Private/Admin
 */
exports.getUserBadges = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        badges: user.badges || [],
        totalBadges: (user.badges || []).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};