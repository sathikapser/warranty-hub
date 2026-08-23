const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestNumber: {
    type: String,
    default: () => `SR-${Date.now().toString().slice(-6)}`
  },
  issueTitle: {
    type: String,
    required: true
  },
  issueDescription: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['created', 'assigned', 'technician_en_route', 'in_service', 'completed', 'cancelled'],
    default: 'created'
  },
  serviceProvider: {
    type: String,
    default: 'Authorized Brand Center'
  },
  technicianName: {
    type: String,
    default: ''
  },
  technicianPhone: {
    type: String,
    default: ''
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  isUnderWarranty: {
    type: Boolean,
    default: true
  },
  notes: [{
    author: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: String,
    updatedBy: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
