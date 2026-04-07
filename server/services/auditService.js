const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the audit trail
 * @param {string} documentId - Document ID
 * @param {string} action - CREATE | EDIT | ROLLBACK | APPROVE | ACCESS_CHANGE
 * @param {string} userId - User who performed the action
 * @param {object} metadata - Additional context
 */
const logAction = async (documentId, action, userId, metadata = {}) => {
  try {
    await AuditLog.create({
      documentId,
      action,
      performedBy: userId,
      metadata,
    });
  } catch (error) {
    // Log but don't fail the main operation
    console.error('Audit log error:', error.message);
  }
};

module.exports = { logAction };
