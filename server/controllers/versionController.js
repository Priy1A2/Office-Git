const Version = require('../models/Version');
const Document = require('../models/Document');
const { createVersion } = require('../services/versionService');
const { logAction } = require('../services/auditService');

/**
 * @route   POST /api/documents/:id/versions
 * @desc    Create a new version for a document
 */
const createNewVersion = async (req, res, next) => {
  try {
    const { content, message } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Version content cannot be empty' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Commit message is required' });
    }

    const { version, warning } = await createVersion({
      documentId: req.params.id,
      content,
      authorId: req.user._id,
      message: message.trim(),
    });

    const populatedVersion = await Version.findById(version._id).populate('author', 'name email');

    res.status(201).json({
      version: populatedVersion,
      ...(warning && { warning }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/:id/versions
 * @desc    List versions for a document (paginated, newest first)
 */
const listVersions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const versions = await Version.find({ documentId: req.params.id })
      .populate('author', 'name email')
      .sort({ versionNumber: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Version.countDocuments({ documentId: req.params.id });

    res.json({
      versions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/versions/:id
 * @desc    Get a specific version's content
 */
const getVersion = async (req, res, next) => {
  try {
    const version = await Version.findById(req.params.id).populate('author', 'name email');
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json({ version });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/versions/:id/rollback
 * @desc    Rollback to a specific version (creates a NEW version with old content)
 */
const rollback = async (req, res, next) => {
  try {
    const targetVersion = await Version.findById(req.params.id);
    if (!targetVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Check if this is already the current version
    const document = await Document.findById(targetVersion.documentId);
    if (document.currentVersionId && document.currentVersionId.toString() === targetVersion._id.toString()) {
      return res.status(400).json({ error: 'Cannot rollback to the current version' });
    }

    // Create a new version with the old content
    const { version } = await createVersion({
      documentId: targetVersion.documentId,
      content: targetVersion.content,
      authorId: req.user._id,
      message: `[Rollback] Reverted to version ${targetVersion.versionNumber}`,
      parentVersionId: document.currentVersionId,
      isRollback: true,
    });

    const populatedVersion = await Version.findById(version._id).populate('author', 'name email');

    res.status(201).json({ version: populatedVersion });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/versions/:id/approve
 * @desc    Approve a version (approvers only)
 */
const approveVersion = async (req, res, next) => {
  try {
    const version = await Version.findById(req.params.id);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (version.isApproved) {
      return res.status(400).json({ error: 'Version is already approved' });
    }

    // Verify user is an approver for this document
    const document = await Document.findById(version.documentId);
    const userId = req.user._id.toString();
    const isApprover = document.accessControl.approvers.some(id => id.toString() === userId);
    const isOwner = document.accessControl.owner.toString() === userId;

    if (!isApprover && !isOwner) {
      return res.status(403).json({ error: 'Only approvers can approve versions' });
    }

    version.isApproved = true;
    await version.save();

    await logAction(version.documentId, 'APPROVE', req.user._id, {
      versionId: version._id,
      versionNumber: version.versionNumber,
    });

    const populatedVersion = await Version.findById(version._id).populate('author', 'name email');

    res.json({ version: populatedVersion });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNewVersion,
  listVersions,
  getVersion,
  rollback,
  approveVersion,
};
