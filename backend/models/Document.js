const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['bill', 'warranty', 'insurance', 'amc', 'other'],
    required: true
  },
  publicId: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
