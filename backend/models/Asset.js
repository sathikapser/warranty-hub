const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assetName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Appliances', 'Vehicles', 'Industrial Equipment', 'Lifts', 'Generators', 'Water Purifiers', 'Others'],
    default: 'Others'
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  modelNumber: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  assignedTo: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  sellerOrStore: {
    type: String,
    trim: true,
    default: ''
  },
  warrantyDurationMonths: {
    type: Number,
    default: 12
  },
  roomOrLocation: {
    type: String,
    trim: true,
    default: 'Main Household'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'needs_repair', 'damaged'],
    default: 'good'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);
