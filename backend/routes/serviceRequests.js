const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const Asset = require('../models/Asset');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { emitWorkspaceEvent, broadcastActivity } = require('../utils/socket');

const getWorkspaceUserIds = async (user) => {
  const ownerId = user.familyWorkspaceOwnerId || user._id;
  const members = await User.find({ familyWorkspaceOwnerId: ownerId });
  return [ownerId, ...members.map(m => m._id)];
};

// @desc    Get all service requests for workspace
// @route   GET /api/service-requests
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const workspaceIds = await getWorkspaceUserIds(req.user);
    const assets = await Asset.find({ userId: { $in: workspaceIds } });
    const assetIds = assets.map(a => a._id);

    const requests = await ServiceRequest.find({ assetId: { $in: assetIds } })
      .populate('assetId', 'assetName brand category modelNumber serialNumber')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new service request
// @route   POST /api/service-requests
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { assetId, issueTitle, issueDescription, urgency, serviceProvider, scheduledDate, estimatedCost, isUnderWarranty } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const serviceRequest = await ServiceRequest.create({
      assetId,
      userId: req.user._id,
      issueTitle,
      issueDescription,
      urgency: urgency || 'medium',
      serviceProvider: serviceProvider || `${asset.brand} Authorized Service`,
      scheduledDate: scheduledDate || new Date(Date.now() + 86400000 * 2),
      estimatedCost: estimatedCost || 0,
      isUnderWarranty: isUnderWarranty !== undefined ? isUnderWarranty : true,
      status: 'created',
      statusHistory: [{
        status: 'created',
        updatedBy: req.user.name,
        timestamp: new Date(),
        note: 'Service request lodged by user'
      }]
    });

    const populated = await ServiceRequest.findById(serviceRequest._id)
      .populate('assetId', 'assetName brand category')
      .populate('userId', 'name email');

    // Real-time broadcast
    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    emitWorkspaceEvent(workspaceId.toString(), 'service_request_created', populated);

    // Log Activity
    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'service_created',
      title: `Service Requested: ${asset.brand} ${asset.assetName}`,
      details: `${issueTitle} (${urgency} priority)`,
      assetId: asset._id
    });
    broadcastActivity(workspaceId.toString(), activity);

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update service request status (lifecycle tracking)
// @route   PUT /api/service-requests/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, technicianName, technicianPhone, actualCost, note } = req.body;
    const request = await ServiceRequest.findById(req.params.id).populate('assetId');

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    request.status = status || request.status;
    if (technicianName) request.technicianName = technicianName;
    if (technicianPhone) request.technicianPhone = technicianPhone;
    if (actualCost !== undefined) request.actualCost = actualCost;
    if (status === 'completed') request.completedDate = new Date();

    request.statusHistory.push({
      status: request.status,
      updatedBy: req.user.name,
      timestamp: new Date(),
      note: note || `Status transitioned to ${request.status.replace(/_/g, ' ')}`
    });

    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate('assetId', 'assetName brand category')
      .populate('userId', 'name email');

    // Real-time broadcast to all workspace members
    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    emitWorkspaceEvent(workspaceId.toString(), 'service_status_changed', {
      serviceRequest: populated,
      newStatus: request.status,
      updatedBy: req.user.name
    });

    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'service_status_changed',
      title: `Service Status Updated: ${request.assetId?.assetName || 'Asset'} ➔ ${request.status.toUpperCase().replace(/_/g, ' ')}`,
      details: note || `Technician: ${request.technicianName || 'Assigned'}`,
      assetId: request.assetId?._id
    });
    broadcastActivity(workspaceId.toString(), activity);

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete service request
// @route   DELETE /api/service-requests/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    await request.deleteOne();
    res.json({ message: 'Service request removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
