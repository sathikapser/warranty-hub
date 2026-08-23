const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'Member'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'asset_added', 
      'asset_updated', 
      'asset_deleted', 
      'document_uploaded', 
      'warranty_updated', 
      'service_created', 
      'service_status_changed', 
      'expense_added', 
      'member_joined',
      'claim_drafted'
    ]
  },
  title: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
