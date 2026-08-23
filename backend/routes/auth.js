const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { verifyGoogleToken } = require('../config/google');
const { authLimiter } = require('../middleware/security');
const { validateRegister, validateLogin } = require('../middleware/validator');
const { catchAsync, ApiError } = require('../utils/errorHandler');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey12345!', {
    expiresIn: '30d'
  });
};

const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role || 'user',
  avatar: user.avatar || '',
  googleId: user.googleId || null,
  isGoogleVerified: !!user.isGoogleVerified,
  isEmailVerified: !!user.isEmailVerified,
  authProvider: user.authProvider || 'local',
  familyWorkspaceOwnerId: user.familyWorkspaceOwnerId,
  notificationPreferences: user.notificationPreferences,
  calendarIntegration: user.calendarIntegration,
  earnedBadges: user.earnedBadges || [],
  lastLogin: user.lastLogin,
  token: generateToken(user._id)
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, validateRegister, catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    authProvider: 'local',
    lastLogin: new Date(),
    loginCount: 1
  });

  if (user) {
    res.status(201).json(formatUserResponse(user));
  } else {
    res.status(400).json({ success: false, message: 'Invalid user registration data' });
  }
}));

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, validateLogin, catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
  }

  if (await user.comparePassword(password)) {
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    res.json(formatUserResponse(user));
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
}));

// @desc    Google OAuth Verification & Authentication
// @route   POST /api/auth/google
// @access  Public
router.post('/google', authLimiter, catchAsync(async (req, res) => {
  const { credential, idToken, googleUser } = req.body;

  let googleData = null;

  try {
    if (credential || idToken) {
      googleData = await verifyGoogleToken(credential || idToken);
    } else if (googleUser && googleUser.email) {
      googleData = {
        googleId: googleUser.googleId || googleUser.sub || `google_${Date.now()}`,
        email: googleUser.email.toLowerCase(),
        name: googleUser.name || googleUser.email.split('@')[0],
        picture: googleUser.picture || googleUser.avatar || '',
        isEmailVerified: true
      };
    } else {
      return res.status(400).json({ success: false, message: 'Google authentication credential is required' });
    }
  } catch (tokenErr) {
    return res.status(400).json({ 
      success: false, 
      message: `Google Token Verification Failed: ${tokenErr.message}` 
    });
  }

  const { googleId, email, name, picture, isEmailVerified } = googleData;

  // Search if user exists by email or googleId
  let user = await User.findOne({ 
    $or: [{ email: email.toLowerCase() }, { googleId }] 
  });

  if (user) {
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Contact support.' });
    }

    // Link/update Google info if not already linked
    if (!user.googleId) user.googleId = googleId;
    if (picture && !user.avatar) user.avatar = picture;
    user.isGoogleVerified = true;
    user.isEmailVerified = true;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    return res.json({
      ...formatUserResponse(user),
      isNewUser: false,
      message: 'Google Sign-In successful'
    });
  }

  // Create new verified user via Google
  user = await User.create({
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    googleId,
    avatar: picture || '',
    isGoogleVerified: true,
    isEmailVerified: true,
    authProvider: 'google',
    lastLogin: new Date(),
    loginCount: 1
  });

  res.status(201).json({
    ...formatUserResponse(user),
    isNewUser: true,
    message: 'Google Account verified and registered successfully'
  });
}));

// @desc    Link Google Account to existing authenticated user
// @route   POST /api/auth/link-google
// @access  Private
router.post('/link-google', protect, catchAsync(async (req, res) => {
  const { credential, idToken, googleUser } = req.body;
  let googleData = null;

  if (credential || idToken) {
    googleData = await verifyGoogleToken(credential || idToken);
  } else if (googleUser && googleUser.email) {
    googleData = googleUser;
  } else {
    return res.status(400).json({ success: false, message: 'Google credential required to link account' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.googleId = googleData.googleId || user.googleId;
  user.isGoogleVerified = true;
  user.isEmailVerified = true;
  if (googleData.picture && !user.avatar) {
    user.avatar = googleData.picture;
  }
  await user.save();

  res.json({
    success: true,
    message: 'Google account linked and verified successfully',
    user: formatUserResponse(user)
  });
}));

// @desc    Forgot Password (reset helper)
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', authLimiter, catchAsync(async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email and new password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User with this email not found' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully. You can now login.' });
}));

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json(user);
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.name = req.body.name || user.name;
  if (req.body.email && req.body.email.toLowerCase() !== user.email) {
    const emailTaken = await User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: user._id } });
    if (emailTaken) {
      return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
    }
    user.email = req.body.email.toLowerCase();
  }

  user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
  user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

  if (req.body.password && req.body.password.trim().length >= 6) {
    user.password = req.body.password;
  }
  if (req.body.notificationPreferences) {
    user.notificationPreferences = { ...user.notificationPreferences, ...req.body.notificationPreferences };
  }
  if (req.body.calendarIntegration) {
    user.calendarIntegration = { ...user.calendarIntegration, ...req.body.calendarIntegration };
  }
  if (req.body.earnedBadges) {
    user.earnedBadges = req.body.earnedBadges;
  }

  const updatedUser = await user.save();
  res.json(formatUserResponse(updatedUser));
}));

module.exports = router;
