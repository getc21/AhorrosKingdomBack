const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllEvents,
  getPrimaryEvent,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  registerUserToEvent,
  unregisterUserFromEvent,
  getMyRegisteredEvents,
  registerUserToEventAdmin,
  unregisterUserFromEventAdmin,
} = require('../controllers/eventController');

// Public routes
router.get('/primary', protect, getPrimaryEvent);
router.get('/', protect, getAllEvents);
router.get('/user/registered', protect, getMyRegisteredEvents);
router.get('/:eventId', protect, getEventById);
router.get('/:eventId/stats', protect, getEventStats);

// User registration routes
router.post('/:eventId/register', protect, registerUserToEvent);
router.delete('/:eventId/unregister', protect, unregisterUserFromEvent);

// Admin registration routes (register other users)
router.post('/:eventId/register-user', protect, adminOnly, registerUserToEventAdmin);
router.delete('/:eventId/unregister-user', protect, adminOnly, unregisterUserFromEventAdmin);

// Admin routes
router.post('/', protect, adminOnly, createEvent);
router.put('/:eventId', protect, adminOnly, updateEvent);
router.delete('/:eventId', protect, adminOnly, deleteEvent);

module.exports = router;
