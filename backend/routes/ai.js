const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Asset = require('../models/Asset');
const ActivityLog = require('../models/ActivityLog');
const { 
  processChatMessage, 
  prepareClaimKit, 
  calculatePredictiveMaintenance, 
  parseNlpQuery 
} = require('../utils/aiAssistant');
const { broadcastActivity } = require('../utils/socket');

// Helper to get workspace asset IDs
const getWorkspaceAssetIds = async (user) => {
  const ownerId = user.familyWorkspaceOwnerId || user._id;
  const members = await User.find({ familyWorkspaceOwnerId: ownerId });
  const memberIds = [ownerId, ...members.map(m => m._id)];
  const assets = await Asset.find({ userId: { $in: memberIds } });
  return assets.map(a => a._id);
};

// @desc    Process conversational chat with AI Assistant
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const assetIds = await getWorkspaceAssetIds(req.user);
    const response = await processChatMessage(message, req.user, assetIds);

    res.json(response);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Prepare 1-Click Warranty Claim Kit
// @route   POST /api/ai/claim-prep
// @access  Private
router.post('/claim-prep', protect, async (req, res) => {
  try {
    const { assetId, issueDescription } = req.body;
    if (!assetId) {
      return res.status(400).json({ message: 'Asset ID is required' });
    }

    const claimKit = await prepareClaimKit(assetId, issueDescription);

    // Log activity
    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    const log = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'claim_drafted',
      title: `Drafted Warranty Claim for ${claimKit.asset.brand} ${claimKit.asset.name}`,
      details: issueDescription || 'General malfunction repair claim',
      assetId
    });
    broadcastActivity(workspaceId.toString(), log);

    res.json(claimKit);
  } catch (error) {
    console.error('Claim Prep Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Predictive Maintenance & Failure Diagnostics
// @route   POST /api/ai/predictive-advice
// @access  Private
router.post('/predictive-advice', protect, async (req, res) => {
  try {
    const { assetId } = req.body;
    if (!assetId) {
      return res.status(400).json({ message: 'Asset ID is required' });
    }

    const advice = await calculatePredictiveMaintenance(assetId);
    res.json(advice);
  } catch (error) {
    console.error('Predictive Advice Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Natural Language Query search on Assets
// @route   POST /api/ai/nlp-search
// @access  Private
router.post('/nlp-search', protect, async (req, res) => {
  try {
    const { query } = req.body;
    const assetIds = await getWorkspaceAssetIds(req.user);
    const results = await parseNlpQuery(query || '', assetIds);
    res.json(results);
  } catch (error) {
    console.error('NLP Search Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
