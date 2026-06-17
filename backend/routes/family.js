const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Invite family member
// @route   POST /api/family/invite
// @access  Private
router.post('/invite', protect, async (req, res) => {
  const { email, name, role } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const owner = await User.findById(req.user._id);

    // Check if email already in workspace
    const existsInWorkspace = owner.familyMembers.some(m => m.email === email.toLowerCase());
    if (existsInWorkspace) {
      return res.status(400).json({ message: 'User already in workspace' });
    }

    // Add to owner's familyMembers
    owner.familyMembers.push({
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      role: role || 'member'
    });
    await owner.save();

    // Look up if invited user already has an account
    const invitedUser = await User.findOne({ email: email.toLowerCase() });
    if (invitedUser) {
      invitedUser.familyWorkspaceOwnerId = owner._id;
      await invitedUser.save();
    }

    res.json({ message: `Successfully invited ${email} to workspace.`, workspace: owner.familyMembers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get family workspace members
// @route   GET /api/family/members
// @access  Private
router.get('/members', protect, async (req, res) => {
  try {
    const ownerId = req.user.familyWorkspaceOwnerId || req.user._id;
    const owner = await User.findById(ownerId);
    
    // Find all users who are actually linked
    const registeredMembers = await User.find({ familyWorkspaceOwnerId: ownerId }).select('name email role status');
    
    res.json({
      owner: {
        name: owner.name,
        email: owner.email,
        role: 'owner'
      },
      invitedMembers: owner.familyMembers, // lists all (including pending registered)
      registeredMembers: registeredMembers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Remove family member from workspace
// @route   DELETE /api/family/remove/:email
// @access  Private
router.delete('/remove/:email', protect, async (req, res) => {
  const emailToRemove = req.params.email.toLowerCase();

  try {
    const ownerId = req.user.familyWorkspaceOwnerId || req.user._id;
    const owner = await User.findById(ownerId);

    // Remove from array
    owner.familyMembers = owner.familyMembers.filter(m => m.email !== emailToRemove);
    await owner.save();

    // Reset user profile linking if registered
    const memberUser = await User.findOne({ email: emailToRemove, familyWorkspaceOwnerId: ownerId });
    if (memberUser) {
      memberUser.familyWorkspaceOwnerId = null;
      await memberUser.save();
    }

    res.json({ message: 'Family member removed from workspace' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
