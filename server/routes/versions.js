const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireDocumentAccess } = require('../middlewares/roleCheck');
const {
  createNewVersion,
  listVersions,
  getVersion,
  rollback,
  approveVersion,
} = require('../controllers/versionController');

// All routes require authentication
router.use(protect);

// Document-scoped version routes
router.post('/documents/:id/versions', requireDocumentAccess('editor'), createNewVersion);
router.get('/documents/:id/versions', requireDocumentAccess('viewer'), listVersions);

// Version-specific routes
router.get('/versions/:id', getVersion);
router.post('/versions/:id/rollback', rollback);
router.post('/versions/:id/approve', approveVersion);

module.exports = router;
