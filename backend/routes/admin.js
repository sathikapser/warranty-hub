const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Asset = require('../models/Asset');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAssets = await Asset.countDocuments();
    
    // Aggregated details
    const notificationsSent = await Notification.countDocuments();
    
    // Active / Expiring / Expired assets logic
    const users = await User.find({ role: 'user' }).select('name email status createdAt');
    
    res.json({
      totalUsers,
      totalAssets,
      notificationsSent,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Suspend/Unsuspend User
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', protect, admin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.status = status;
    await user.save();
    res.json({ message: `User status changed to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
