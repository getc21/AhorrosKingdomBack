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
        margin: 40,
      });

      const stream = fs.createWriteStream(filePath);
      doc.on('error', (err) => reject(err));
      stream.on('error', (err) => reject(err));
      doc.pipe(stream);

      // --- COLORS ---
      const lime = '#97E332';
      const green = '#6ABF4B';
      const teal = '#008A8A';
      const darkText = '#0F172A';

      // --- HEADER ---
      doc.fontSize(36).font('Helvetica-Bold').fillColor(teal).text('BLESS UP', { align: 'center' });
      doc.fontSize(12).font('Helvetica').fillColor(green).text('By Energy', { align: 'center' });
      doc.moveDown(0.3);
      
      // Línea separadora
      doc.strokeColor(lime).lineWidth(2).moveTo(50, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.8);

      // Subtítulo
      doc.fontSize(10).font('Helvetica').fillColor(darkText).text('Plan de Ahorro Energy', { align: 'center' });
      doc.fontSize(8).fillColor('#666').text('RECIBO DE DEPÓSITO OFICIAL', { align: 'center' });
      doc.moveDown(1);

      // --- SECCIÓN 1: INFORMACIÓN DEL RECIBO ---
      doc.fontSize(11).font('Helvetica-Bold').fillColor(teal).text('[*] INFORMACIÓN DEL RECIBO');
      doc.moveDown(0.5);
      
      doc.fontSize(10).fillColor(darkText);
      doc.font('Helvetica-Bold').text('ID Recibo:', { continued: true }).font('Helvetica').text(` ${deposit._id.toString().slice(-8).toUpperCase()}`);
      
      doc.font('Helvetica-Bold').text('Fecha:', { continued: true }).font('Helvetica').text(` ${new Date(deposit.createdAt).toLocaleDateString('es-BO', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })}`);
      
      const eventName = deposit.eventId ? `${deposit.eventId.name}` : 'No especificado';
      doc.font('Helvetica-Bold').text('Evento:', { continued: true }).font('Helvetica').text(` ${eventName}`);
      
      doc.moveDown(0.8);

      // --- SECCIÓN 2: INFORMACIÓN DEL PARTICIPANTE ---
      doc.fontSize(11).font('Helvetica-Bold').fillColor(teal).text('[*] INFORMACIÓN DEL PARTICIPANTE');
      doc.moveDown(0.5);
      
      doc.fontSize(10).fillColor(darkText);
      doc.font('Helvetica-Bold').text('Nombre:', { continued: true }).font('Helvetica').text(` ${user.name}`);
      doc.font('Helvetica-Bold').text('Teléfono:', { continued: true }).font('Helvetica').text(` ${user.phone}`);
      doc.font('Helvetica-Bold').text('Plan:', { continued: true }).font('Helvetica').text(` ${user.planType}`);
      doc.font('Helvetica-Bold').text('Rol:', { continued: true }).font('Helvetica').text(` ${user.role}`);
      
      doc.moveDown(0.8);

      // --- SECCIÓN 3: DETALLE DEL DEPÓSITO ---
      doc.fontSize(11).font('Helvetica-Bold').fillColor(teal).text('[*] DETALLE DEL DEPÓSITO');
      doc.moveDown(0.5);

      // Tabla simple
      const tableTop = doc.y;
      doc.fillColor(green).rect(50, doc.y, 515, 24).fill();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white').text('CONCEPTO', 60, tableTop + 6);
      doc.text('MONTO', 450, tableTop + 6, { align: 'right' });
      
      doc.moveDown(1.3);

      // Fila de datos
      doc.fillColor('#f5f5f5').rect(50, doc.y, 515, 28).fill();
      doc.fontSize(10).font('Helvetica').fillColor(darkText).text('Depósito Registrado', 60, doc.y + 8);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(green).text(`Bs. ${deposit.amount.toFixed(2)}`, 450, doc.y + 8, { align: 'right', width: 105 });
      
      doc.moveDown(1.8);

      // --- SECCIÓN 4: RESUMEN ---
      doc.fontSize(11).font('Helvetica-Bold').fillColor('white').fillColor(lime).rect(50, doc.y - 5, 515, 30).fill();
      doc.fontSize(11).text('RESUMEN DE AHORRO', { align: 'center' });
      doc.moveDown(1.8);

      // Dos cajas lado a lado
      const boxY = doc.y;
      const boxHeight = 50;
      
      // Caja izquierda
      doc.fillColor(teal).rect(50, boxY, 240, boxHeight).fill();
      doc.fontSize(9).font('Helvetica').fillColor('white').text('Este Depósito', 60, boxY + 8);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(lime).text(`Bs. ${deposit.amount.toFixed(2)}`, 60, boxY + 22);
      
      // Caja derecha
      doc.fillColor(green).rect(305, boxY, 260, boxHeight).fill();
      doc.fontSize(9).font('Helvetica').fillColor('white').text('Total Ahorrado', 315, boxY + 8);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(lime).text(`Bs. ${(user.totalSaved || deposit.amount).toFixed(2)}`, 315, boxY + 22);
      
      doc.moveDown(3.5);

      // --- FOOTER ---
      doc.fontSize(8).fillColor('#666').font('Helvetica').text(`Registrado por: ${admin.name}`, { align: 'left' });
      doc.text('Verificado por el Sistema BLESS UP Energy', { align: 'left' });
      
      doc.moveDown(0.8);
      doc.strokeColor(lime).lineWidth(1).moveTo(50, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(7).fillColor('#999').font('Helvetica').text(
        '** BLESS UP By Energy - Sistema de Ahorros Comunitario **',
        { align: 'center' }
      );
      doc.fontSize(7).fillColor('#999').text(
        'Este es un recibo oficial generado automáticamente. Guarde para sus registros.',
        { align: 'center' }
      );
      doc.fontSize(7).fillColor('#999').text(`Generado: ${new Date().toLocaleString('es-BO')}`, { align: 'center' });

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

