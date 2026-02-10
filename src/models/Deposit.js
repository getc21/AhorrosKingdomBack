const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Please provide an event ID'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [5, 'Minimum deposit is 5 Bs'],
    },
    description: {
      type: String,
      default: 'Depósito regular',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide admin ID'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Deposit', DepositSchema);
