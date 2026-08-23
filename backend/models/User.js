const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  googleId: {
    type: String,
    default: null,
    sparse: true
  },
  isGoogleVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  familyWorkspaceOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  familyMembers: [{
    email: { type: String, lowercase: true, trim: true },
    name: String,
    role: { type: String, enum: ['admin', 'member'], default: 'member' }
  }],
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  notificationPreferences: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    reminderDays: { type: [Number], default: [7, 1] }
  },
  calendarIntegration: {
    googleSynced: { type: Boolean, default: false },
    outlookSynced: { type: Boolean, default: false }
  },
  earnedBadges: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Hash password before saving if provided and modified
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
