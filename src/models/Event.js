const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an event name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    goal: {
      type: Number,
      required: [true, 'Please provide a goal amount'],
      default: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      description: 'Evento principal que se muestra por defecto',
    },
    emoji: {
      type: String,
      default: '🎯',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', EventSchema);
