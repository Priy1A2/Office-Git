const Version = require('../models/Version');
const Document = require('../models/Document');
const { logAction } = require('./auditService');

/**
 * Create a new version for a document
 * @param {object} params
 * @param {string} params.documentId
 * @param {string} params.content
 * @param {string} params.authorId
 * @param {string} params.message
 * @param {string|null} params.parentVersionId
 * @param {boolean} params.isRollback
 * @returns {object} { version, warning }
 */
const createVersion = async ({ documentId, content, authorId, message, parentVersionId = null, isRollback = false }) => {
  let warning = null;

  // Validate content is not empty
  if (!content || content.trim().length === 0) {
    throw new Error('Version content cannot be empty');
  }

  // Check for duplicate content
  if (!isRollback) {
    const latestVersion = await Version.findOne({ documentId }).sort({ versionNumber: -1 });
    if (latestVersion && latestVersion.content === content) {
      warning = 'Content is identical to the latest version';
    }
    // Set parentVersionId to latest if not provided
    if (!parentVersionId && latestVersion) {
      parentVersionId = latestVersion._id;
    }
  }

  // Get next version number
  const lastVersion = await Version.findOne({ documentId }).sort({ versionNumber: -1 });
  const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

  // Create the version
  const version = await Version.create({
    documentId,
    content,
    author: authorId,
    parentVersionId,
    message,
    versionNumber,
    isApproved: false,
  });

  // Update document's currentVersionId
  await Document.findByIdAndUpdate(documentId, { currentVersionId: version._id });

  // Log audit
  const action = isRollback ? 'ROLLBACK' : (versionNumber === 1 ? 'CREATE' : 'EDIT');
  await logAction(documentId, action, authorId, {
    versionId: version._id,
    versionNumber,
    message,
  });

  return { version, warning };
};

module.exports = { createVersion };
