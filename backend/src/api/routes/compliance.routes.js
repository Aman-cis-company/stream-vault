const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../../constants/roles');
const { ContentComplianceRecord, Movie, Episode } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');

const adminOnly = [authenticate, authorize(ROLES.SUPER_ADMIN)];

// GET /api/v1/compliance/records — admin: list all compliance records
router.get('/records', ...adminOnly, async (req, res) => {
  try {
    const records = await ContentComplianceRecord.findAll({
      include: [
        { model: Movie,   as: 'movie',   attributes: ['id', 'title'], required: false },
        { model: Episode, as: 'episode', attributes: ['id', 'title'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    return successResponse(res, 'Compliance records fetched', { records });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch compliance records', 500);
  }
});

// POST /api/v1/compliance/records — admin: add a compliance record
router.post('/records', ...adminOnly, async (req, res) => {
  try {
    const required = ['performer_name', 'date_of_birth', 'id_document_type', 'id_document_ref', 'verified_by', 'verified_at', 'custodian_name', 'custodian_address'];
    for (const field of required) {
      if (!req.body[field]) return errorResponse(res, `${field} is required`, 400);
    }
    const record = await ContentComplianceRecord.create(req.body);
    return successResponse(res, 'Compliance record created', { record }, 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to create compliance record', 500);
  }
});

// PUT /api/v1/compliance/records/:id — admin: update a record
router.put('/records/:id', ...adminOnly, async (req, res) => {
  try {
    const record = await ContentComplianceRecord.findByPk(req.params.id);
    if (!record) return errorResponse(res, 'Record not found', 404);
    await record.update(req.body);
    return successResponse(res, 'Compliance record updated', { record });
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to update compliance record', 500);
  }
});

// DELETE /api/v1/compliance/records/:id — admin: delete a record
router.delete('/records/:id', ...adminOnly, async (req, res) => {
  try {
    const record = await ContentComplianceRecord.findByPk(req.params.id);
    if (!record) return errorResponse(res, 'Record not found', 404);
    await record.destroy();
    return successResponse(res, 'Compliance record deleted');
  } catch (err) {
    return errorResponse(res, 'Failed to delete compliance record', 500);
  }
});

// GET /api/v1/compliance/custodian — public: custodian of records info
router.get('/custodian', (req, res) => {
  return successResponse(res, 'Custodian info fetched', {
    custodian: {
      name:    process.env.COMPLIANCE_CUSTODIAN_NAME    || 'StreamVault Records Manager',
      address: process.env.COMPLIANCE_CUSTODIAN_ADDRESS || '123 Streaming Lane, Mumbai, Maharashtra 400001, India',
      email:   process.env.COMPLIANCE_CUSTODIAN_EMAIL   || 'compliance@streamvault.com',
      phone:   process.env.COMPLIANCE_CUSTODIAN_PHONE   || '+91-XXXXXXXXXX',
    },
  });
});

module.exports = router;
