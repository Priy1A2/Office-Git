const { body } = require('express-validator');
const Document = require('../models/Document');
const { createVersion } = require('../services/versionService');
const { extractTextFromPDF } = require('../utils/pdfParser');
const { logAction } = require('../services/auditService');

/**
 * @route   POST /api/documents
 * @desc    Create a new document (text content or file upload)
 */
const createDocument = async (req, res, next) => {
  try {
    const { title, content, message } = req.body;
    let documentContent = content;

    // Handle file upload
    if (req.file) {
      const ext = req.file.originalname.toLowerCase();
      if (ext.endsWith('.pdf')) {
        documentContent = await extractTextFromPDF(req.file.buffer);
      } else {
        documentContent = req.file.buffer.toString('utf-8');
      }
    }

    if (!documentContent || documentContent.trim().length === 0) {
      return res.status(400).json({ error: 'Document content cannot be empty' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Document title is required' });
    }

    // Create document
    const document = await Document.create({
      title: title.trim(),
      createdBy: req.user._id,
      accessControl: {
        owner: req.user._id,
        editors: [],
        viewers: [],
        approvers: [],
      },
    });

    // Create initial version
    const { version } = await createVersion({
      documentId: document._id,
      content: documentContent,
      authorId: req.user._id,
      message: message || 'Initial version',
    });

    res.status(201).json({
      document: {
        ...document.toObject(),
        currentVersion: version,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents
 * @desc    List documents accessible to the current user
 */
const listDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const documents = await Document.find({
      $or: [
        { 'accessControl.owner': userId },
        { 'accessControl.editors': userId },
        { 'accessControl.viewers': userId },
        { 'accessControl.approvers': userId },
      ],
    })
      .populate('createdBy', 'name email')
      .populate('currentVersionId', 'versionNumber message createdAt author isApproved')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments({
      $or: [
        { 'accessControl.owner': userId },
        { 'accessControl.editors': userId },
        { 'accessControl.viewers': userId },
        { 'accessControl.approvers': userId },
      ],
    });

    res.json({
      documents,
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
 * @route   GET /api/documents/:id
 * @desc    Get a single document with current version
 */
const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('accessControl.owner', 'name email')
      .populate('accessControl.editors', 'name email')
      .populate('accessControl.viewers', 'name email')
      .populate('accessControl.approvers', 'name email')
      .populate({
        path: 'currentVersionId',
        populate: { path: 'author', select: 'name email' },
      });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/documents/:id/access
 * @desc    Update document access control (owner only)
 */
const updateAccess = async (req, res, next) => {
  try {
    const { editors, viewers, approvers } = req.body;
    const document = req.document;

    if (editors) document.accessControl.editors = editors;
    if (viewers) document.accessControl.viewers = viewers;
    if (approvers) document.accessControl.approvers = approvers;

    await document.save();

    await logAction(document._id, 'ACCESS_CHANGE', req.user._id, {
      editors,
      viewers,
      approvers,
    });

    res.json({ document });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDocument,
  listDocuments,
  getDocument,
  updateAccess,
};
