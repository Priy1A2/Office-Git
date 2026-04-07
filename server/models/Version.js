const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: [true, 'Version content is required'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version',
    default: null,
  },
  message: {
    type: String,
    required: [true, 'Commit message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters'],
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
versionSchema.index({ documentId: 1, versionNumber: -1 });

module.exports = mongoose.model('Version', versionSchema);
