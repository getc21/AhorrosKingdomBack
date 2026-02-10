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
        margin: 50, // Un poco más de margen para que se vea limpio
      });

      const stream = fs.createWriteStream(filePath);
      doc.on('error', (err) => reject(err));
      stream.on('error', (err) => reject(err));
      doc.pipe(stream);

      // --- Header ---
      doc.fontSize(24).font('Helvetica-Bold').text('SISTEMA DE AHORROS ENERGY', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica').text('RECIBO DE DEPÓSITO', { align: 'center' });
      doc.fontSize(9).fillColor('#666').text('Plan de Ahorro Comunitario', { align: 'center' });
      doc.moveDown(1);

      // --- Función Ayudante para Filas (Evita superposición) ---
      const drawRow = (label, value, isBold = false) => {
        const currentY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(label, 50, currentY);
        doc.fontSize(10).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#000').text(value, 180, currentY, { width: 350 });
        doc.moveDown(0.8); // Espaciado entre líneas
      };

      const drawDivider = () => {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eeeeee').stroke();
        doc.moveDown(1);
      };

      // --- Información del Recibo ---
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('INFORMACIÓN DEL RECIBO');
      doc.moveDown(0.5);
      
      drawRow('ID Recibo:', deposit._id.toString().slice(-8).toUpperCase());
      drawRow('Fecha:', new Date(deposit.createdAt).toLocaleDateString('es-BO', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }));

      drawDivider();

      // --- Información del Participante ---
      doc.fontSize(11).font('Helvetica-Bold').text('INFORMACIÓN DEL PARTICIPANTE');
      doc.moveDown(0.5);
      
      drawRow('Nombre:', user.name);
      drawRow('Teléfono:', user.phone);
      drawRow('Plan:', user.planType);
      drawRow('Rol:', user.role);

      drawDivider();

      // --- Detalle del Depósito (Tabla) ---
      doc.fontSize(11).font('Helvetica-Bold').text('DETALLE DEL DEPÓSITO');
      doc.moveDown(0.8);

      // Encabezado de Tabla
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').text('Concepto', 50, tableTop);
      doc.text('Monto', 400, tableTop, { align: 'right', width: 145 });
      
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000').stroke();
      doc.moveDown(0.5);

      // Fila única de depósito
      const rowY = doc.y;
      doc.fontSize(10).font('Helvetica').text('Depósito Registrado', 50, rowY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#2d5016').text(`Bs. ${deposit.amount.toFixed(2)}`, 400, rowY, { align: 'right', width: 145 });
      
      doc.moveDown(1.5);

      // --- Resumen de Ahorro (Caja Destacada) ---
      doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('RESUMEN DE AHORRO');
      doc.moveDown(0.5);

      drawRow('Monto de este Depósito:', `Bs. ${deposit.amount.toFixed(2)}`, true);
      drawRow('Total Ahorrado:', `Bs. ${(user.totalSaved || deposit.amount).toFixed(2)}`, true);
      
      doc.moveDown(1);

      // --- Pie de Firma / Registro ---
      doc.fontSize(9).fillColor('#666').font('Helvetica').text(`Registrado por: ${admin.name}`, { italic: true });
      
      // --- Footer ---
      const bottom = doc.page.height - 70;
      doc.moveTo(50, bottom - 10).lineTo(545, bottom - 10).strokeColor('#cccccc').stroke();
      
      doc.fontSize(8).fillColor('#999').font('Helvetica').text(
        'Este es un recibo automático generado por el sistema de Sistema de ahorros ENERGY. Por favor conserve este comprobante.',
        50, bottom, { align: 'center', width: 495 }
      );
      doc.text(`Generado el: ${new Date().toLocaleString('es-BO')}`, { align: 'center' });

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

  // Mensaje de WhatsApp
  const message = `*RECIBO DE DEPÓSITO - SISTEMA DE AHORROS ENERGY*\n\n` +
    `Hola ${user.name.split(' ')[0]},\n\n` +
    `Tu depósito ha sido registrado exitosamente:\n\n` +
    `*Monto Depositado:* Bs. ${deposit.amount.toFixed(2)}\n` +
    `*Ahorrado Hasta Hoy:* Bs. ${totalSaved.toFixed(2)}\n` +
    `*Plan:* ${user.planType}\n` +
    `*Fecha:* ${new Date(deposit.createdAt).toLocaleDateString('es-BO')}\n\n` +
    `*Tu recibo PDF:* ${pdfUrl}\n\n` +
    `*¡Gracias por tu ahorro!* 💰`;

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

