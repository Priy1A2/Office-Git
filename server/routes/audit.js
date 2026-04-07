const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireDocumentAccess } = require('../middlewares/roleCheck');
const { getAuditLog } = require('../controllers/auditController');

router.get('/documents/:id/audit', protect, requireDocumentAccess('viewer'), getAuditLog);

module.exports = router;
