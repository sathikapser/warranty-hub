const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  lastServiceDate: {
    type: Date
  },
  nextServiceDate: {
    type: Date
  },
  frequencyMonths: {
    type: Number,
    default: 0 // 0 means one-time or unscheduled
  },
  provider: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    default: 0
  },
  details: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
