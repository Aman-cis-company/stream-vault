const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const logger = require('../../config/logger');

class InvoicePdfService {
  /**
   * Generates a professional PDF invoice and saves it to the filesystem.
   * @param {object} invoice - Invoice database record
   * @param {object} user - User database record
   * @param {object} plan - SubscriptionPlan database record
   * @param {object} payment - Payment database record
   * @param {string} filePath - Absolute path to save the PDF
   * @returns {Promise<string>} Path of the generated PDF
   */
  generate(invoice, user, plan, payment, filePath) {
    return new Promise((resolve, reject) => {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Styling Color system
        const primaryColor = '#c0392b'; // Crimson Red
        const darkColor = '#0f111a';    // Midnight Navy/Black
        const grayColor = '#555555';
        const lightGray = '#f5f6fa';
        const successColor = '#27ae60';

        // ── Brand Header ──
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(24).text('StreamVault', 50, 50);
        doc.fillColor(grayColor).font('Helvetica').fontSize(9).text('Premium Subscription Platform', 50, 80);

        // ── Invoice Title & Metadata (Right side) ──
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(18).text('INVOICE', 400, 50, { align: 'right' });
        doc.fillColor(grayColor).font('Helvetica').fontSize(10)
           .text(`Invoice No: ${invoice.invoice_number}`, 400, 75, { align: 'right' })
           .text(`Issued Date: ${new Date(invoice.issued_at || invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 400, 90, { align: 'right' })
           .text(`Status: ${invoice.status.toUpperCase()}`, 400, 105, { align: 'right' });

        // Line separator
        doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#e1e8ed').lineWidth(1).stroke();

        // ── Bill To details ──
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(11).text('BILL TO:', 50, 150);
        doc.fillColor(darkColor).font('Helvetica').fontSize(10)
           .text(`${user.first_name} ${user.last_name}`, 50, 165)
           .text(user.email, 50, 180);
        
        if (user.phone) {
          doc.text(`Phone: ${user.phone}`, 50, 195);
        }

        // ── Payment details (Right side) ──
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(11).text('PAYMENT DETAILS:', 320, 150);
        doc.fillColor(darkColor).font('Helvetica').fontSize(10)
           .text(`Method: ${payment?.payment_method?.toUpperCase() || 'Card'}`, 320, 165)
           .text(`Transaction ID: ${payment?.stripe_payment_intent_id || 'N/A'}`, 320, 180)
           .text(`Currency: ${invoice.currency}`, 320, 195);

        // Line separator
        doc.moveTo(50, 220).lineTo(545, 220).strokeColor('#e1e8ed').lineWidth(1).stroke();

        // ── Invoice Items Table ──
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10);
        doc.text('DESCRIPTION', 50, 240);
        doc.text('QTY', 330, 240, { width: 40, align: 'center' });
        doc.text('UNIT PRICE', 390, 240, { width: 80, align: 'right' });
        doc.text('TOTAL', 480, 240, { width: 65, align: 'right' });

        // Table header bottom line
        doc.moveTo(50, 255).lineTo(545, 255).strokeColor('#e1e8ed').lineWidth(1).stroke();

        const planName = plan?.name || 'Premium Subscription';
        const billingCycle = plan?.billing_cycle || 'monthly';
        const descText = `StreamVault ${planName} Plan - Recurring Subscription (${billingCycle})`;

        // Table content row
        doc.fillColor(darkColor).font('Helvetica').fontSize(10);
        doc.text(descText, 50, 270, { width: 260 });
        doc.text('1', 330, 270, { width: 40, align: 'center' });
        doc.text(`${invoice.currency} ${invoice.amount}`, 390, 270, { width: 80, align: 'right' });
        doc.text(`${invoice.currency} ${invoice.amount}`, 480, 270, { width: 65, align: 'right' });

        // Table row bottom line
        doc.moveTo(50, 310).lineTo(545, 310).strokeColor('#e1e8ed').lineWidth(1).stroke();

        // ── Summary / Totals ──
        const subtotal = invoice.amount;
        const tax = invoice.tax_amount || 0;
        const total = invoice.total_amount;

        doc.fillColor(grayColor).font('Helvetica').fontSize(10);
        doc.text('Subtotal:', 350, 330, { width: 120, align: 'right' });
        doc.fillColor(darkColor).text(`${invoice.currency} ${subtotal}`, 480, 330, { width: 65, align: 'right' });

        doc.fillColor(grayColor).text('Tax (18% GST):', 350, 350, { width: 120, align: 'right' });
        doc.fillColor(darkColor).text(`${invoice.currency} ${tax}`, 480, 350, { width: 65, align: 'right' });

        doc.moveTo(350, 370).lineTo(545, 370).strokeColor('#e1e8ed').lineWidth(1).stroke();

        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(11);
        doc.text('Total Amount:', 350, 385, { width: 120, align: 'right' });
        doc.text(`${invoice.currency} ${total}`, 480, 385, { width: 65, align: 'right' });

        // ── Footer notice ──
        doc.fillColor(grayColor).font('Helvetica').fontSize(10);
        doc.text('Thank you for your purchase!', 50, 460, { align: 'center' });
        
        doc.fontSize(8);
        doc.text('For queries or support, reach out to us at support@streamvault.com', 50, 480, { align: 'center' });
        doc.text('Terms and Conditions apply. Please refer to http://localhost:3000/terms for details.', 50, 495, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          logger.info('Invoice PDF generated successfully', { filePath });
          resolve(filePath);
        });

        stream.on('error', (err) => {
          logger.error('Invoice PDF write stream error', { error: err.message });
          reject(err);
        });

      } catch (err) {
        logger.error('Invoice PDF generation catch error', { error: err.message });
        reject(err);
      }
    });
  }
}

module.exports = new InvoicePdfService();
