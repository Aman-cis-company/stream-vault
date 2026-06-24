const { Invoice, User, UserSubscription, SubscriptionPlan, Payment } = require('../../models');
const InvoicePdfService = require('./InvoicePdfService');
const EmailService = require('./EmailService');
const logger = require('../../config/logger');
const socketServer = require('../../socket');
const EVENTS = require('../../socket/events');
const path = require('path');
const fs = require('fs');

class InvoiceService {
  /**
   * Automatically creates an invoice from a successful payment.
   * @param {object} payment - Payment database record
   * @returns {Promise<object>} Created invoice record
   */
  async createInvoiceFromPayment(payment) {
    try {
      // Prevent duplicate invoice generation for the same payment
      const existing = await Invoice.findOne({ where: { payment_id: payment.id } });
      if (existing) {
        logger.info('Invoice already exists for payment', { paymentId: payment.id });
        return existing;
      }

      // Fetch related records
      const user = await User.findByPk(payment.user_id);
      if (!user) {
        throw new Error(`User not found for payment ID ${payment.id}`);
      }

      let userSubscription = null;
      let plan = null;
      if (payment.subscription_id) {
        userSubscription = await UserSubscription.findByPk(payment.subscription_id);
        if (userSubscription) {
          plan = await SubscriptionPlan.findByPk(userSubscription.plan_id);
        }
      }

      // Generate invoice number: INV-YYYY-xxxxxx
      const currentYear = new Date().getFullYear();
      const invoiceNumber = `INV-${currentYear}-${String(payment.id).padStart(6, '0')}`;

      // Calculate tax and base amount (inclusive of 18% GST)
      const totalAmount = parseFloat(payment.amount);
      const taxRate = 0.18;
      // tax_amount = total * 18 / 118
      const taxAmount = parseFloat(((totalAmount * taxRate) / (1 + taxRate)).toFixed(2));
      const amount = parseFloat((totalAmount - taxAmount).toFixed(2));

      // Retrieve Stripe invoice ID from Stripe payment intent if present
      let stripeInvoiceId = null;
      if (payment.stripe_payment_intent_id && payment.stripe_payment_intent_id.startsWith('pi_')) {
        try {
          const stripe = require('../../config/stripe');
          const pi = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
          stripeInvoiceId = pi.invoice || null;
        } catch (e) {
          logger.warn('Failed to retrieve stripe invoice id for payment intent', { 
            paymentIntentId: payment.stripe_payment_intent_id, 
            error: e.message 
          });
        }
      }

      // Create record
      const invoice = await Invoice.create({
        invoice_number: invoiceNumber,
        user_id: user.id,
        subscription_id: userSubscription?.id || null,
        payment_id: payment.id,
        stripe_invoice_id: stripeInvoiceId,
        stripe_payment_intent_id: payment.stripe_payment_intent_id || null,
        amount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: payment.currency || 'INR',
        status: payment.status === 'succeeded' ? 'paid' : payment.status === 'failed' ? 'failed' : 'unpaid',
        issued_at: new Date(),
        paid_at: payment.status === 'succeeded' ? (payment.paid_at || new Date()) : null,
      });

      logger.info('Invoice record created', { invoiceId: invoice.id, invoiceNumber });

      // Generate PDF path (store in uploads/invoices/)
      const uploadsDir = path.resolve(__dirname, '../../../uploads/invoices');
      const fileName = `${invoiceNumber}.pdf`;
      const pdfPath = path.join(uploadsDir, fileName);

      // Generate PDF
      await InvoicePdfService.generate(invoice, user, plan, payment, pdfPath);

      // Save relative path
      const relativePdfUrl = `/uploads/invoices/${fileName}`;
      await invoice.update({ invoice_pdf_url: relativePdfUrl });

      // Send Email to customer
      if (payment.status === 'succeeded') {
        const planName = plan?.name || 'Premium Subscription';
        EmailService.sendInvoiceEmail(user, planName, invoice, payment, pdfPath).catch((err) => {
          logger.error('Failed to send invoice email', { invoiceNumber, error: err.message });
        });
      }

      // Real-time notification to user and admin dashboard
      socketServer.emitToUser(user.id, EVENTS.PAYMENT_INVOICE, {
        invoiceId: invoice.id,
        invoiceNumber,
        amount: totalAmount,
        status: invoice.status,
        issued_at: invoice.issued_at,
      });
      socketServer.pushDashboardStats({ refresh: true });

      return invoice;
    } catch (err) {
      logger.error('Error in InvoiceService.createInvoiceFromPayment', { paymentId: payment.id, error: err.message });
      throw err;
    }
  }

  /**
   * Fetch all invoices for a customer (user scope).
   */
  async getCustomerInvoices(userId) {
    return Invoice.findAll({
      where: { user_id: userId },
      include: [
        {
          model: UserSubscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name', 'billing_cycle'] }],
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'payment_method', 'stripe_payment_intent_id'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Fetch details of a specific invoice.
   */
  async getInvoiceDetails(invoiceId, userId = null) {
    const where = { id: invoiceId };
    if (userId) {
      where.user_id = userId;
    }

    return Invoice.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: UserSubscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name', 'billing_cycle', 'price'] }],
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'payment_method', 'stripe_payment_intent_id', 'status', 'paid_at'],
        },
      ],
    });
  }

  /**
   * Fetch all invoices with filters (Admin scope).
   */
  async getAdminInvoices({ status, search, startDate, endDate, page = 1, limit = 10 }) {
    const { Op } = require('sequelize');
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.issued_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.issued_at = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.issued_at = {
        [Op.lte]: new Date(endDate),
      };
    }

    const includeClause = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email'],
        where: search ? {
          [Op.or]: [
            { first_name: { [Op.like]: `%${search}%` } },
            { last_name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        } : undefined,
      },
      {
        model: UserSubscription,
        as: 'subscription',
        include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name'] }],
      },
    ];

    const offset = (page - 1) * limit;
    const { count, rows } = await Invoice.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return {
      invoices: rows,
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  }

  /**
   * Resend invoice email.
   */
  async resendInvoice(invoiceId, userId = null) {
    const invoice = await this.getInvoiceDetails(invoiceId, userId);
    if (!invoice) {
      throw new Error('Invoice not found or access denied');
    }

    const uploadsDir = path.resolve(__dirname, '../../../uploads/invoices');
    const fileName = `${invoice.invoice_number}.pdf`;
    const pdfPath = path.join(uploadsDir, fileName);

    if (!fs.existsSync(pdfPath)) {
      // Regenerate if deleted
      await InvoicePdfService.generate(invoice, invoice.user, invoice.subscription?.plan, invoice.payment, pdfPath);
    }

    const planName = invoice.subscription?.plan?.name || 'Premium Subscription';
    await EmailService.sendInvoiceEmail(invoice.user, planName, invoice, invoice.payment, pdfPath);
    logger.info('Invoice email resent', { invoiceId, invoiceNumber: invoice.invoice_number });
    return true;
  }

  /**
   * Export all invoices data for admin csv.
   */
  async getInvoicesForExport() {
    return Invoice.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email'],
        },
        {
          model: UserSubscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['name'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get billing dashboard statistics for admins.
   */
  async getBillingStats() {
    const { fn, col } = require('sequelize');
    
    const totalRevenue = await Payment.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: { status: 'succeeded' },
      raw: true,
    });

    const monthlyRevenue = await Payment.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: {
        status: 'succeeded',
        paid_at: {
          [require('sequelize').Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      raw: true,
    });

    const totalCount = await Invoice.count();
    const paidCount = await Invoice.count({ where: { status: 'paid' } });
    const failedCount = await Invoice.count({ where: { status: 'failed' } });

    return {
      totalRevenue: parseFloat(totalRevenue?.total || 0),
      monthlyRevenue: parseFloat(monthlyRevenue?.total || 0),
      totalInvoices: totalCount,
      paidInvoices: paidCount,
      failedPayments: failedCount,
    };
  }
}

module.exports = new InvoiceService();
