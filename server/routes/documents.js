const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireDocumentAccess } = require('../middlewares/roleCheck');
const { upload } = require('../middlewares/validate');
const {
  createDocument,
  listDocuments,
  getDocument,
  updateAccess,
} = require('../controllers/documentController');

// All routes require authentication
router.use(protect);

router.post('/', upload.single('file'), createDocument);
router.get('/', listDocuments);
router.get('/:id', requireDocumentAccess('viewer'), getDocument);
router.patch('/:id/access', requireDocumentAccess('owner'), updateAccess);

module.exports = router;
