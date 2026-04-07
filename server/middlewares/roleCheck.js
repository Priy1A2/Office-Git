const Document = require('../models/Document');

/**
 * Check if user has a specific system role
 * @param  {...string} roles - Allowed roles (viewer, editor, approver)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

/**
 * Check if user has access to a specific document
 * @param {'viewer'|'editor'|'approver'|'owner'} level - Minimum access level required
 */
const requireDocumentAccess = (level) => {
  return async (req, res, next) => {
    try {
      const documentId = req.params.id || req.params.documentId;
      if (!documentId) {
        return res.status(400).json({ error: 'Document ID is required' });
      }

      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const userId = req.user._id.toString();
      const ac = document.accessControl;
      const isOwner = ac.owner.toString() === userId;
      const isEditor = ac.editors.some(id => id.toString() === userId);
      const isViewer = ac.viewers.some(id => id.toString() === userId);
      const isApprover = ac.approvers.some(id => id.toString() === userId);

      let hasAccess = false;
      switch (level) {
        case 'owner':
          hasAccess = isOwner;
          break;
        case 'approver':
          hasAccess = isOwner || isApprover;
          break;
        case 'editor':
          hasAccess = isOwner || isEditor;
          break;
        case 'viewer':
          hasAccess = isOwner || isEditor || isViewer || isApprover;
          break;
        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have access to this document' });
      }

      req.document = document;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Access check failed' });
    }
  };
};

module.exports = { requireRole, requireDocumentAccess };
