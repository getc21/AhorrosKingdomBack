const express = require('express');
const router = express.Router();
const {
  createDeposit,
  getMyDeposits,
  getMyDepositsByEvent,
  getUserDeposits,
  getAllDeposits,
  getDepositReceipt,
} = require('../controllers/depositController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

// Rutas específicas PRIMERO
// Descargar recibo PDF de un depósito (Pública para permitir descarga directa del navegador)
router.get('/:depositId/receipt', getDepositReceipt);

// Get current user deposits
router.get('/my', protect, getMyDeposits);

// Get current user deposits by event
router.get('/my/:eventId', protect, getMyDepositsByEvent);

// Get user deposits by ID (admin only)
router.get('/user/:id', protect, authorize('ADMIN'), getUserDeposits);

// Rutas genéricas DESPUÉS
// Create deposit (admin only)
router.post(
  '/',
  protect,
  authorize('ADMIN'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('amount').isFloat({ min: 5 }).withMessage('Amount must be at least 5'),
    body('eventId').notEmpty().withMessage('Event ID is required'),
  ],
  handleValidationErrors,
  createDeposit
);

// Get all deposits (admin only)
router.get('/', protect, authorize('ADMIN'), getAllDeposits);

module.exports = router;
