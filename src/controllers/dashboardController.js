const User = require('../models/User');
const Deposit = require('../models/Deposit');
const { generateMotivationalMessage } = require('../utils/messageGenerator');

const SAVINGS_GOAL = 500; // Bs

/**
 * @route   GET /api/dashboard/me?eventId=...
 * @desc    Get user dashboard with savings info (optionally filtered by event)
 * @access  Private
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.query;
    console.log('📊 Dashboard Request - User ID:', userId, 'Event ID:', eventId);

    // Build query filter
    const depositFilter = { userId };
    if (eventId) {
      depositFilter.eventId = eventId;
    }

    // Get all deposits for user (filtered by event if provided)
    const deposits = await Deposit.find(depositFilter)
      .populate('eventId', 'name goal isPrimary emoji')
      .sort({ createdAt: -1 });
    
    console.log('💰 Deposits found:', deposits.length);

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
          eventName: d.eventId?.name,
          eventEmoji: d.eventId?.emoji,
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
 * @route   GET /api/dashboard/ranking?eventId=...
 * @desc    Get ranking of users by total savings (optionally filtered by event)
 * @access  Private
 */
exports.getRanking = async (req, res) => {
  try {
    const { eventId } = req.query;
    
    // Build user filter
    let userFilter = { isActive: true, role: 'USER' };
    
    // If eventId is provided, only get users registered in that event
    if (eventId) {
      userFilter.registeredEvents = eventId;
    }
    
    // Get filtered users
    const users = await User.find(userFilter);

    // Calculate totals for each user
    const ranking = await Promise.all(
      users.map(async (user) => {
        const depositFilter = { userId: user._id };
        if (eventId) {
          depositFilter.eventId = eventId;
        }
        
        const deposits = await Deposit.find(depositFilter);
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

    // Filter out users with 0 savings when viewing "Todos los eventos" (no eventId)
    let filteredRanking = ranking;
    if (!eventId) {
      filteredRanking = ranking.filter(user => user.totalSaved > 0);
    }

    // Sort by total saved (descending)
    filteredRanking.sort((a, b) => b.totalSaved - a.totalSaved);

    // Add position
    const rankingWithPosition = filteredRanking.map((user, index) => ({
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
 * @route   GET /api/dashboard/badges/my?eventId=...
 * @desc    Get current user badges (optionally filtered by event)
 * @access  Private
 */
exports.getMyBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { eventId } = req.query;
    
    // Si se proporciona eventId, filtrar las insignias relevantes para ese evento
    if (eventId) {
      // Obtener depósitos del usuario solo para esse evento
      const deposits = await Deposit.find({ userId: req.user._id, eventId })
        .select('amount');
      
      // Obtener información del evento
      const Event = require('../models/Event');
      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      // Calcular estadísticas para este evento específico
      const depositCount = deposits.length;
      const totalSaved = deposits.reduce((sum, dep) => sum + dep.amount, 0);
      const goal = event.goal || 500;
      
      // Para el ranking en este evento, obtener todos los usuarios registrados en el evento
      let position = null;
      const eventUsers = await User.find({ registeredEvents: eventId, isActive: true });
      const userRankings = await Promise.all(
        eventUsers.map(async (u) => {
          const userDeposits = await Deposit.find({ userId: u._id, eventId });
          return {
            userId: u._id,
            totalSaved: userDeposits.reduce((sum, d) => sum + d.amount, 0),
          };
        })
      );
      
      // Ordenar y asignar posición
      userRankings.sort((a, b) => b.totalSaved - a.totalSaved);
      const userRank = userRankings.findIndex(r => r.userId.toString() === req.user._id.toString());
      position = userRank >= 0 ? userRank + 1 : null;
      
      // Filtrar insignias que son relevantes para eventos (excluir algunas que son globales)
      const eventBadges = user.badges.filter((badge) => {
        // Incluir insignias de progreso de depósitos, meta y ranking
        const relevantBadgeIds = [
          'primer_deposito',
          'cinco_depositos',
          'diez_depositos',
          'cuarto_meta',
          'mitad_meta',
          'tres_cuartos_meta',
          'meta_completa',
          'top_tres',
          'deposito_grande',
        ];
        return relevantBadgeIds.includes(badge.id);
      });
      
      return res.status(200).json({
        success: true,
        data: {
          badges: eventBadges || [],
          totalBadges: (eventBadges || []).length,
          eventId,
        },
      });
    }

    // Si no hay eventId, devolver todas las insignias
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