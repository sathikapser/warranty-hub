const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expires-soon', 'expired'],
    default: 'active'
  },
  isExtended: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Warranty', warrantySchema);
