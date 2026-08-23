const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['purchase', 'repair', 'maintenance', 'warranty_extension', 'insurance', 'accessory', 'other'],
    default: 'repair'
  },
  amount: {
    type: Number,
    required: true
  },
  expenseDate: {
    type: Date,
    default: Date.now
  },
  vendor: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  receiptUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
