const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/InvoiceController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../../constants/roles');

// Customer APIs
router.get('/invoices', authenticate, InvoiceController.getCustomerInvoices);
router.get('/invoices/:id', authenticate, InvoiceController.getInvoiceDetails);
router.get('/invoices/:id/download', authenticate, InvoiceController.downloadInvoicePdf);
router.post('/invoices/:id/resend', authenticate, InvoiceController.resendInvoice);

// Admin APIs
router.get('/admin/invoices', authenticate, authorize(ROLES.SUPER_ADMIN), InvoiceController.getAdminInvoices);
router.get('/admin/invoices/export', authenticate, authorize(ROLES.SUPER_ADMIN), InvoiceController.exportInvoices);
router.get('/admin/invoices/:id', authenticate, authorize(ROLES.SUPER_ADMIN), InvoiceController.getAdminInvoiceDetails);
router.post('/admin/invoices/:id/resend', authenticate, authorize(ROLES.SUPER_ADMIN), InvoiceController.resendInvoice);

module.exports = router;
