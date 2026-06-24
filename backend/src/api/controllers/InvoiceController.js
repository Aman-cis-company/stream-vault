const path = require('path');
const fs = require('fs');
const InvoiceService = require('../services/InvoiceService');
const InvoicePdfService = require('../services/InvoicePdfService');
const logger = require('../../config/logger');

class InvoiceController {
  async getCustomerInvoices(req, res) {
    try {
      const invoices = await InvoiceService.getCustomerInvoices(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Invoices fetched successfully',
        data: { invoices }
      });
    } catch (err) {
      logger.error('getCustomerInvoices error', { error: err.message });
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoices' });
    }
  }

  async getInvoiceDetails(req, res) {
    try {
      const { id } = req.params;
      const invoice = await InvoiceService.getInvoiceDetails(id, req.user.id);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found or access denied' });
      }
      return res.status(200).json({
        success: true,
        message: 'Invoice details fetched successfully',
        data: { invoice }
      });
    } catch (err) {
      logger.error('getInvoiceDetails error', { error: err.message });
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoice details' });
    }
  }

 async downloadInvoicePdf(req, res) {
  try {
    const { id } = req.params;
    const userRole = req.user.role ? (req.user.role.name || req.user.role) : '';
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const invoice = await InvoiceService.getInvoiceDetails(id, isAdmin ? null : req.user.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found or access denied' });
    }

    const uploadsDir = path.resolve(__dirname, '../../../uploads/invoices');
    const fileName = `${invoice.invoice_number}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Always regenerate to avoid serving corrupted/incomplete files
    await InvoicePdfService.generate(
      invoice,
      invoice.user,
      invoice.subscription?.plan,
      invoice.payment,
      filePath
    );

    // Verify file exists and has content
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ success: false, message: 'PDF generation failed' });
    }

    const fileSize = fs.statSync(filePath).size;
    if (fileSize === 0) {
      return res.status(500).json({ success: false, message: 'Generated PDF is empty' });
    }

    logger.info('Sending invoice PDF', { filePath, fileSize });

    // Set headers explicitly before download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
    res.setHeader('Content-Length', fileSize);

    return res.download(filePath, `invoice-${invoice.invoice_number}.pdf`, (err) => {
      if (err) {
        logger.error('PDF download stream error', { error: err.message });
      }
    });
  } catch (err) {
    logger.error('downloadInvoicePdf error', { error: err.message });
    return res.status(500).json({ success: false, message: err.message || 'Failed to download invoice PDF' });
  }
}

  async resendInvoice(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role ? (req.user.role.name || req.user.role) : '';
      const isAdmin = ['admin', 'super_admin'].includes(userRole);
      await InvoiceService.resendInvoice(id, isAdmin ? null : req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Invoice email resent successfully'
      });
    } catch (err) {
      logger.error('resendInvoice error', { error: err.message });
      return res.status(500).json({ success: false, message: err.message || 'Failed to resend invoice email' });
    }
  }

  // Admin Controllers
  async getAdminInvoices(req, res) {
    try {
      const { status, search, startDate, endDate, page, limit } = req.query;
      const result = await InvoiceService.getAdminInvoices({
        status,
        search,
        startDate,
        endDate,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10
      });
      const stats = await InvoiceService.getBillingStats();
      
      return res.status(200).json({
        success: true,
        message: 'Admin invoices fetched successfully',
        data: {
          invoices: result.invoices,
          total: result.total,
          page: result.page,
          limit: result.limit,
          stats
        }
      });
    } catch (err) {
      logger.error('getAdminInvoices error', { error: err.message });
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch admin invoices' });
    }
  }

  async getAdminInvoiceDetails(req, res) {
    try {
      const { id } = req.params;
      const invoice = await InvoiceService.getInvoiceDetails(id, null);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Invoice details fetched successfully',
        data: { invoice }
      });
    } catch (err) {
      logger.error('getAdminInvoiceDetails error', { error: err.message });
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoice details' });
    }
  }

  async exportInvoices(req, res) {
    try {
      const invoices = await InvoiceService.getInvoicesForExport();
      
      let csv = 'Invoice No,Date,User Name,User Email,Plan,Amount,Tax,Total,Status,Transaction ID\n';
      for (const inv of invoices) {
        const date = new Date(inv.issued_at || inv.created_at).toLocaleDateString('en-US');
        const name = `"${inv.user?.first_name || ''} ${inv.user?.last_name || ''}"`;
        const email = inv.user?.email || '';
        const plan = inv.subscription?.plan?.name || 'Premium Subscription';
        const txnId = inv.stripe_payment_intent_id || '';
        csv += `${inv.invoice_number},${date},${name},${email},${plan},${inv.amount},${inv.tax_amount},${inv.total_amount},${inv.status},${txnId}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=invoices-export.csv');
      return res.status(200).send(csv);
    } catch (err) {
      logger.error('exportInvoices error', { error: err.message });
      return res.status(500).json({ success: false, message: err.message || 'Failed to export invoices' });
    }
  }
}

module.exports = new InvoiceController();
