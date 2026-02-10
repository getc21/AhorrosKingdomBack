const Deposit = require('../models/Deposit');
const User = require('../models/User');
const { generateReceiptPDF, generateWhatsAppLinkWithImage } = require('../utils/receiptGenerator');
const { checkBadges } = require('../config/badges');

/**
 * @route   POST /api/deposits
 * @desc    Create a new deposit (admin only)
 * @access  Private/Admin
 */
exports.createDeposit = async (req, res) => {
  try {
    const { userId, amount, eventId } = req.body;

    // Validation
    if (!userId || !amount || !eventId) {
      return res.status(400).json({ success: false, message: 'Please provide userId, amount, and eventId' });
    }

    if (amount < 5) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is 5 Bs' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if event exists
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Create deposit
    const deposit = await Deposit.create({
      userId,
      eventId,
      amount,
      createdBy: req.user._id,
    });

    await deposit.populate('userId', 'name phone planType');
    await deposit.populate('createdBy', 'name');
    await deposit.populate('eventId', 'name emoji goal');

    // Calcular total ahorrado para este evento antes de crear el depósito
    const allDeposits = await Deposit.find({ userId, eventId }).sort({ createdAt: 1 });
    const totalSaved = allDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const depositCount = allDeposits.length;

    // Verificar nuevas insignias
    const checkBadges = require('../config/badges').checkBadges;
    const newBadges = checkBadges(
      user,
      depositCount,
      totalSaved,
      event.goal || 500,
      null,
      allDeposits
    );

    // Agregar nuevas insignias al usuario
    if (newBadges.length > 0) {
      user.badges = [...user.badges, ...newBadges];
      await user.save();
    }

    // Generar recibo PDF
    try {
      const admin = await User.findById(req.user._id);
      const userFull = await User.findById(userId);
      
      // Calcular total ahorrado
      const allDepositsForReceipt = await Deposit.find({ userId, eventId });
      const totalSavedForReceipt = allDepositsForReceipt.reduce((sum, d) => sum + (d.amount || 0), 0);
      userFull.totalSaved = totalSavedForReceipt;
      
      // Generar PDF
      const generateReceiptPDF = require('../utils/receiptGenerator').generateReceiptPDF;
      const pdfPath = await generateReceiptPDF(deposit, userFull, admin);
      
      // Obtener URL del PDF
      const pdfFileName = pdfPath.split('\\').pop() || pdfPath.split('/').pop();
      const pdfUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/receipts/${pdfFileName}`;
      
      // Generar link de WhatsApp con PDF
      const generateWhatsAppLinkWithImage = require('../utils/receiptGenerator').generateWhatsAppLinkWithImage;
      const whatsappLink = generateWhatsAppLinkWithImage(userFull.phone, deposit, userFull, pdfUrl);
      
      // Agregar datos al objeto de respuesta
      const depositData = deposit.toObject();
      depositData.whatsappLink = whatsappLink;
      depositData.pdfUrl = pdfUrl;
      depositData.totalSaved = totalSaved;
      
      return res.status(201).json({ success: true, data: depositData });
    } catch (pdfError) {
      console.error('Error generando recibo:', pdfError);
      // Continuamos aunque falle el PDF, el depósito ya fue creado
      return res.status(201).json({ success: true, data: deposit });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/deposits/:depositId/receipt
 * @desc    Descargar recibo PDF de un depósito
 * @access  Private
 */
exports.getDepositReceipt = async (req, res) => {
  try {
    const { depositId } = req.params;
    
    // Verificar que el depósito existe y Popular los campos relacionados
    const deposit = await Deposit.findById(depositId)
      .populate('userId')
      .populate('createdBy')
      .populate('eventId', 'name emoji goal');
    
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    // Calcular total ahorrado
    const allDeposits = await Deposit.find({ userId: deposit.userId });
    const totalSaved = allDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    deposit.userId.totalSaved = totalSaved;
    
    // Generar el recibo
    const filePath = await generateReceiptPDF(deposit, deposit.userId, deposit.createdBy);
    
    // Enviar archivo para descarga directa
    res.download(filePath, `recibo_deposito_${depositId}.pdf`, (err) => {
      if (err) {
        console.error('Error enviando archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error generating download' });
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/deposits/my/:eventId
 * @desc    Get current user deposits for a specific event
 * @access  Private
 */
exports.getMyDepositsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const deposits = await Deposit.find({ userId: req.user._id, eventId })
      .populate('createdBy', 'name')
      .populate('eventId', 'name goal')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/deposits/my
 * @desc    Get current user deposits
 * @access  Private
 */
exports.getMyDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user._id })
      .populate('createdBy', 'name')
      .populate('eventId', 'name goal emoji')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/deposits/user/:id
 * @desc    Get user deposits (admin only)
 * @access  Private/Admin
 */
exports.getUserDeposits = async (req, res) => {
  try {
    const { id } = req.params;

    const deposits = await Deposit.find({ userId: id })
      .populate('userId', 'name phone planType')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   GET /api/deposits
 * @desc    Get all deposits (admin only)
 * @access  Private/Admin
 */
exports.getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .populate('userId', 'name phone planType')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
