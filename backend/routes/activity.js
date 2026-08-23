const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// @desc    Get live workspace activity feed
// @route   GET /api/activity
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    const activities = await ActivityLog.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('assetId', 'assetName brand category');

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
