const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['warranty', 'service', 'insurance', 'amc', 'system'],
    default: 'system'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
