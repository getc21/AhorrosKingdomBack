const Event = require('../models/Event');
const Deposit = require('../models/Deposit');
const User = require('../models/User');

/**
 * @route   GET /api/events
 * @desc    Get all events
 * @access  Private
 */
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ isPrimary: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/events/primary
 * @desc    Get primary event
 * @access  Private
 */
exports.getPrimaryEvent = async (req, res) => {
  try {
    let primaryEvent = await Event.findOne({ isPrimary: true, isActive: true });
    
    // Si no hay evento principal, devolver el primero
    if (!primaryEvent) {
      primaryEvent = await Event.findOne({ isActive: true }).sort({ createdAt: 1 });
    }
    
    if (!primaryEvent) {
      return res.status(404).json({ success: false, message: 'No primary event found' });
    }
    
    res.status(200).json({ success: true, data: primaryEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/events/:eventId
 * @desc    Get event by ID
 * @access  Private
 */
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/events
 * @desc    Create a new event (admin only)
 * @access  Private/Admin
 */
exports.createEvent = async (req, res) => {
  try {
    const { name, description, goal, emoji, isPrimary } = req.body;

    // Validation
    if (!name || !goal) {
      return res.status(400).json({ success: false, message: 'Please provide name and goal' });
    }

    // Si es primary, desactivar otros primary events
    if (isPrimary) {
      await Event.updateMany({ }, { isPrimary: false });
    }

    const event = await Event.create({
      name,
      description,
      goal,
      emoji: emoji || '🎯',
      isPrimary: isPrimary || false,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   PUT /api/events/:eventId
 * @desc    Update event (admin only)
 * @access  Private/Admin
 */
exports.updateEvent = async (req, res) => {
  try {
    const { name, description, goal, emoji, isPrimary, isActive } = req.body;

    let event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Si es primary, desactivar otros primary events
    if (isPrimary) {
      await Event.updateMany({ _id: { $ne: req.params.eventId } }, { isPrimary: false });
    }

    event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { name, description, goal, emoji, isPrimary, isActive },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   DELETE /api/events/:eventId
 * @desc    Delete event (admin only)
 * @access  Private/Admin
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if there are deposits associated with this event
    const depositCount = await Deposit.countDocuments({ eventId: req.params.eventId });
    
    if (depositCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete event with ${depositCount} associated deposits` 
      });
    }

    await Event.findByIdAndDelete(req.params.eventId);

    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/events/:eventId/stats
 * @desc    Get event statistics
 * @access  Private
 */
exports.getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const deposits = await Deposit.find({ eventId: req.params.eventId })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });

    const totalSaved = deposits.reduce((sum, d) => sum + d.amount, 0);
    const participantCount = new Set(deposits.map(d => d.userId._id.toString())).size;

    res.status(200).json({
      success: true,
      data: {
        event,
        totalSaved,
        depositCount: deposits.length,
        participantCount,
        progressPercent: (totalSaved / event.goal) * 100,
        deposits,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/events/:eventId/register
 * @desc    Register user for an event
 * @access  Private
 */
exports.registerUserToEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already registered
    if (user.registeredEvents.some(id => id.toString() === eventId)) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    // Add event to user's registered events
    user.registeredEvents.push(eventId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Registered for event: ${event.name}`,
      data: user.registeredEvents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   DELETE /api/events/:eventId/unregister
 * @desc    Unregister user from an event
 * @access  Private
 */
exports.unregisterUserFromEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if registered
    if (!user.registeredEvents.some(id => id.toString() === eventId)) {
      return res.status(400).json({ success: false, message: 'Not registered for this event' });
    }

    // Remove event from user's registered events
    user.registeredEvents = user.registeredEvents.filter((id) => id.toString() !== eventId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Unregistered from event: ${event.name}`,
      data: user.registeredEvents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/events/user/registered
 * @desc    Get events registered by current user
 * @access  Private
 */
exports.getMyRegisteredEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('registeredEvents');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user.registeredEvents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /api/events/:eventId/register-user
 * @desc    Register another user for an event (admin only)
 * @access  Private/Admin
 */
exports.registerUserToEventAdmin = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Please provide userId' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already registered
    if (user.registeredEvents.some(id => id.toString() === eventId)) {
      return res.status(400).json({ success: false, message: 'User already registered for this event' });
    }

    // Add event to user's registered events
    user.registeredEvents.push(eventId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Registered for event: ${event.name}`,
      data: user.registeredEvents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   DELETE /api/events/:eventId/unregister-user
 * @desc    Unregister another user from an event (admin only)
 * @access  Private/Admin
 */
exports.unregisterUserFromEventAdmin = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Please provide userId' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if registered
    if (!user.registeredEvents.some(id => id.toString() === eventId)) {
      return res.status(400).json({ success: false, message: 'User not registered for this event' });
    }

    // Remove event from user's registered events
    user.registeredEvents = user.registeredEvents.filter((id) => id.toString() !== eventId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Unregistered from event: ${event.name}`,
      data: user.registeredEvents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
