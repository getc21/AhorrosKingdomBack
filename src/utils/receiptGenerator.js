const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Crear directorios si no existen
const receiptsDir = path.join(__dirname, '../../receipts');
const imagesDir = path.join(__dirname, '../../receipts/images');

[receiptsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generar PDF de recibo de depósito
 * @param {Object} deposit - Objeto de depósito con información
 * @param {Object} user - Objeto de usuario
 * @param {Object} admin - Objeto de admin que registró el depósito
 * @returns {string} Ruta del archivo PDF generado
 */
/**
 * Generar PDF de recibo de depósito
 */
const generateReceiptPDF = (deposit, user, admin) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `recibo_${deposit._id}_${Date.now()}.pdf`;
      const filePath = path.join(receiptsDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 45,
        bufferPages: true,
      });

      const stream = fs.createWriteStream(filePath);
      doc.on('error', (err) => reject(err));
      stream.on('error', (err) => reject(err));
      doc.pipe(stream);

      // --- COLORS (Lime, Green, Teal theme) ---
      const lime = '#97E332';
      const green = '#6ABF4B';
      const teal = '#008A8A';
      const darkBg = '#0F172A';
      const lightText = '#F1F5F9';
      const darkText = '#0F172A';

      // --- Background color (Fondo blanco para mejor visualización) ---
      doc.fillColor('white').rect(0, 0, doc.page.width, doc.page.height).fill();

      // --- Header con gradiente visual ---
      doc.fillColor(teal).rect(0, 0, doc.page.width, 120).fill();
      
      // Title principal
      doc.fontSize(32).font('Helvetica-Bold').fillColor(lime).text('BLESS UP', { align: 'center', lineBreak: true }, 50);
      doc.fontSize(14).font('Helvetica').fillColor(lightText).text('By Energy', { align: 'center' });
      doc.moveDown(0.8);

      // Divider line
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(lime).lineWidth(2).stroke();
      doc.moveDown(1);

      // Subtitle
      doc.fontSize(11).font('Helvetica').fillColor(green).text('Plan de Ahorro Energy', { align: 'center' });
      doc.fontSize(9).fillColor(darkText).font('Helvetica').text('RECIBO DE DEPÓSITO OFICIAL', { align: 'center' });
      doc.moveDown(1.2);

      // --- Funciones Ayudantes ---
      const drawSectionTitle = (title) => {
        doc.fillColor(teal).rect(50, doc.y, 495, 25).fill();
        doc.fontSize(12).font('Helvetica-Bold').fillColor(lime).text(title, 50, doc.y + 6, { width: 495 });
        doc.moveDown(1.5);
      };

      const drawRow = (label, value, isBold = false) => {
        const currentY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(green).text(label, 50, currentY);
        doc.fontSize(10).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(darkText).text(value, 200, currentY, { width: 345 });
        doc.moveDown(0.75);
      };

      const drawDivider = () => {
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(lime).lineWidth(1).stroke();
        doc.moveDown(0.8);
      };

      // --- Información del Recibo ---
      drawSectionTitle('📋 INFORMACIÓN DEL RECIBO');
      
      drawRow('ID Recibo:', deposit._id.toString().slice(-8).toUpperCase());
      drawRow('Fecha de Registro:', new Date(deposit.createdAt).toLocaleDateString('es-BO', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }));
      drawRow('Evento:', deposit.eventId ? `${deposit.eventId.emoji} ${deposit.eventId.name}` : 'No especificado');

      drawDivider();

      // --- Información del Participante ---
      drawSectionTitle('👤 INFORMACIÓN DEL PARTICIPANTE');
      
      drawRow('Nombre Completo:', user.name);
      drawRow('Teléfono:', user.phone);
      drawRow('Plan de Ahorro:', user.planType);
      drawRow('Rol en Sistema:', user.role);

      drawDivider();

      // --- Detalle del Depósito (Tabla mejorada) ---
      drawSectionTitle('💰 DETALLE DEL DEPÓSITO');

      // Encabezado de Tabla con fondo
      doc.fillColor(green).rect(50, doc.y, 495, 22).fill();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white').text('CONCEPTO', 60, doc.y + 5);
      doc.text('MONTO', 400, doc.y - 17, { align: 'right', width: 135 });
      
      doc.moveDown(1.5);

      // Fila de depósito
      const rowY = doc.y;
      doc.fillColor('#f0f0f0').rect(50, rowY - 2, 495, 25).fill();
      doc.fontSize(11).font('Helvetica').fillColor(darkText).text('Depósito Registrado', 60, rowY + 3);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(green).text(`Bs. ${deposit.amount.toFixed(2)}`, 400, rowY + 3, { align: 'right', width: 135 });
      
      doc.moveDown(1.8);

      // --- Resumen de Ahorro (Caja destacada con colores) ---
      doc.fillColor(lime).rect(50, doc.y, 495, 30).fill();
      doc.fontSize(14).font('Helvetica-Bold').fillColor(darkBg).text('RESUMEN DE AHORRO', { align: 'center', lineBreak: false }, 50, doc.y + 8);
      doc.moveDown(2.2);

      // Resumen más atractivo
      doc.fillColor(teal).rect(50, doc.y, 235, 40).fill();
      doc.fontSize(10).font('Helvetica').fillColor('white').text('Este Depósito', 60, doc.y + 5);
      doc.fontSize(16).font('Helvetica-Bold').fillColor(lime).text(`Bs. ${deposit.amount.toFixed(2)}`, 60, doc.y + 18);
      doc.moveDown(0.5);

      doc.fillColor(green).rect(310, doc.y - 40, 235, 40).fill();
      doc.fontSize(10).font('Helvetica').fillColor('white').text('Total Ahorrado', 320, doc.y - 35);
      doc.fontSize(16).font('Helvetica-Bold').fillColor(lime).text(`Bs. ${(user.totalSaved || deposit.amount).toFixed(2)}`, 320, doc.y - 22);
      
      doc.moveDown(2.5);

      // --- Pie de Firma / Registro ---
      doc.fontSize(9).fillColor(darkText).font('Helvetica').text(`✓ Registrado por: ${admin.name}`, 50, doc.y);
      doc.fontSize(9).fillColor(darkText).font('Helvetica').text(`✓ Verificado y Autorizado por el Sistema BLESS UP`, 50, doc.y + 15);
      
      // --- Footer ---
      const bottom = doc.page.height - 80;
      doc.moveTo(50, bottom - 20).lineTo(545, bottom - 20).strokeColor(lime).lineWidth(2).stroke();
      
      doc.fontSize(8).fillColor(darkText).font('Helvetica').text(
        '✨ BLESS UP By Energy - Sistema de Ahorros Comunitario ✨',
        50, bottom + 5, { align: 'center', width: 495 }
      );
      doc.fontSize(8).fillColor('#666').font('Helvetica').text(
        'Este es un recibo oficial y automático generado por el sistema BLESS UP. Guarde este comprobante como referencia de su depósito.',
        50, bottom + 20, { align: 'center', width: 495 }
      );
      doc.fontSize(7).fillColor('#999').font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-BO')}`, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Obtener URL del PDF (sin convertir a imagen)
 * @param {string} pdfFileName - Nombre del archivo PDF
 * @returns {string} URL pública del PDF
 */
const getPDFUrl = (pdfFileName) => {
  return `${process.env.BACKEND_URL}/receipts/${pdfFileName}`;
};

/**
 * Convertir PDF a imagen PNG (no disponible en Windows sin ImageMagick)
 * En su lugar, generamos una URL del PDF para descargar
 * @param {string} pdfPath - Ruta del archivo PDF
 * @returns {Promise<string>} URL del PDF
 */
const convertPDFToImage = async (pdfPath) => {
  try {
    const pdfFileName = path.basename(pdfPath);
    const pdfUrl = getPDFUrl(pdfFileName);
    return pdfUrl;
  } catch (error) {
    console.error('Error generando URL del PDF:', error);
    throw error;
  }
};

/**
 * Generar link de WhatsApp con PDF
 * @param {string} phoneNumber - Número de teléfono boliviano
 * @param {Object} deposit - Objeto de depósito
 * @param {Object} user - Objeto de usuario
 * @param {string} pdfUrl - URL del PDF del recibo
 * @returns {string} URL de WhatsApp
 */
const generateWhatsAppLinkWithImage = (phoneNumber, deposit, user, pdfUrl) => {
  // Formatear número de teléfono
  let formattedPhone = phoneNumber;
  if (!formattedPhone.startsWith('+')) {
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    formattedPhone = `591${formattedPhone}`;
  } else {
    formattedPhone = formattedPhone.replace('+', '');
  }

  // Calcular total actual
  const totalSaved = user.totalSaved || 0;
  
  // Obtener información del evento
  const eventName = deposit.eventId?.name ? `${deposit.eventId.emoji} ${deposit.eventId.name}` : 'Evento no especificado';

  // Mensaje de WhatsApp mejorado
  const message = `✨ *BLESS UP By Energy* ✨\n` +
    `*RECIBO DE DEPÓSITO OFICIAL*\n\n` +
    `Hola ${user.name.split(' ')[0]} 👋,\n\n` +
    `¡Tu depósito ha sido registrado exitosamente en nuestro sistema!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 *DETALLES DE TU DEPÓSITO*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎯 *Evento:* ${eventName}\n` +
    `💰 *Monto Depositado:* Bs. ${deposit.amount.toFixed(2)}\n` +
    `📊 *Total Ahorrado:* Bs. ${totalSaved.toFixed(2)}\n` +
    `📅 *Fecha:* ${new Date(deposit.createdAt).toLocaleDateString('es-BO')}\n` +
    `📋 *Plan:* ${user.planType}\n\n` +
    `📄 *Descarga tu recibo:* ${pdfUrl}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `¡Gracias por ser parte de BLESS UP! 🚀\n` +
    `Juntos ahorramos, juntos crecemos 💚\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━`;

  // Codificar mensaje para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Retornar URL de WhatsApp
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

module.exports = {
  generateReceiptPDF,
  convertPDFToImage,
  generateWhatsAppLinkWithImage,
};

