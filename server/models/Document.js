const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currentVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version',
    default: null,
  },
  accessControl: {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    editors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    viewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    approvers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
}, {
  timestamps: true,
});

// Index for efficient access control queries
documentSchema.index({ 'accessControl.owner': 1 });
documentSchema.index({ 'accessControl.editors': 1 });
documentSchema.index({ 'accessControl.viewers': 1 });
documentSchema.index({ 'accessControl.approvers': 1 });

module.exports = mongoose.model('Document', documentSchema);
