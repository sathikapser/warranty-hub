const express = require('express');
const router = express.Router();
const Warranty = require('../models/Warranty');
const Service = require('../models/Service');
const Insurance = require('../models/Insurance');
const AMC = require('../models/AMC');
const Asset = require('../models/Asset');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { emitWorkspaceEvent, broadcastActivity } = require('../utils/socket');

// Middleware to verify user owns the asset before editing trackers
const verifyAssetOwnership = async (req, res, next) => {
  const assetId = req.body.assetId || req.query.assetId || req.params.assetId;
  if (!assetId) {
    return res.status(400).json({ message: 'Asset ID is required' });
  }
  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    req.asset = asset;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 1. Warranty Routes
// ==========================================

// Get warranty for an asset
router.get('/warranties/:assetId', protect, async (req, res) => {
  try {
    const warranty = await Warranty.findOne({ assetId: req.params.assetId });
    res.json(warranty || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Update warranty for an asset
router.post('/warranties', protect, verifyAssetOwnership, async (req, res) => {
  const { assetId, startDate, endDate, isExtended, provider, policyNumber, claimPhone, claimEmail, coverageTerms } = req.body;
  try {
    let warranty = await Warranty.findOne({ assetId });

    // Determine status
    const today = new Date();
    const expiry = new Date(endDate);
    let status = 'active';
    if (expiry < today) {
      status = 'expired';
    } else {
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        status = 'expires-soon';
      }
    }

    if (warranty) {
      warranty.startDate = startDate;
      warranty.endDate = endDate;
      warranty.isExtended = isExtended || false;
      warranty.provider = provider || warranty.provider;
      warranty.policyNumber = policyNumber !== undefined ? policyNumber : warranty.policyNumber;
      warranty.claimPhone = claimPhone !== undefined ? claimPhone : warranty.claimPhone;
      warranty.claimEmail = claimEmail !== undefined ? claimEmail : warranty.claimEmail;
      warranty.coverageTerms = coverageTerms || warranty.coverageTerms;
      warranty.status = status;
      await warranty.save();
    } else {
      warranty = await Warranty.create({
        assetId,
        startDate,
        endDate,
        isExtended,
        provider,
        policyNumber,
        claimPhone,
        claimEmail,
        coverageTerms,
        status
      });
    }

    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    emitWorkspaceEvent(workspaceId.toString(), 'warranty_updated', {
      warranty,
      assetName: req.asset.assetName
    });

    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'warranty_updated',
      title: `Warranty Updated for ${req.asset.brand} ${req.asset.assetName}`,
      details: `Status: ${status.toUpperCase()} • Valid until ${new Date(endDate).toLocaleDateString()}`,
      assetId: req.asset._id
    });
    broadcastActivity(workspaceId.toString(), activity);

    res.json(warranty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==========================================
// 2. Service Log Routes
// ==========================================

// Get all service logs for an asset
router.get('/services/:assetId', protect, async (req, res) => {
  try {
    const services = await Service.find({ assetId: req.params.assetId }).sort({ lastServiceDate: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create service log
router.post('/services', protect, verifyAssetOwnership, async (req, res) => {
  const { assetId, lastServiceDate, nextServiceDate, frequencyMonths, provider, cost, details } = req.body;
  try {
    const service = await Service.create({
      assetId,
      lastServiceDate,
      nextServiceDate,
      frequencyMonths,
      provider,
      cost: Number(cost) || 0,
      details
    });

    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'service_created',
      title: `Logged Service for ${req.asset.brand} ${req.asset.assetName}`,
      details: `${provider || 'Technician'} • ₹${(Number(cost) || 0).toLocaleString()} • ${details || 'Routine care'}`,
      assetId: req.asset._id
    });
    broadcastActivity(workspaceId.toString(), activity);

    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete service log
router.delete('/services/:id', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service log not found' });
    await service.deleteOne();
    res.json({ message: 'Service log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 3. Insurance Routes
// ==========================================

// Get insurance for an asset
router.get('/insurance/:assetId', protect, async (req, res) => {
  try {
    const insurance = await Insurance.findOne({ assetId: req.params.assetId });
    res.json(insurance || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Update insurance
router.post('/insurance', protect, verifyAssetOwnership, async (req, res) => {
  const { assetId, provider, policyNumber, expiryDate, cost } = req.body;
  try {
    let insurance = await Insurance.findOne({ assetId });
    if (insurance) {
      insurance.provider = provider;
      insurance.policyNumber = policyNumber;
      insurance.expiryDate = expiryDate;
      insurance.cost = Number(cost) || 0;
      await insurance.save();
    } else {
      insurance = await Insurance.create({
        assetId,
        provider,
        policyNumber,
        expiryDate,
        cost: Number(cost) || 0
      });
    }
    res.json(insurance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==========================================
// 4. AMC Routes
// ==========================================

// Get AMC for an asset
router.get('/amc/:assetId', protect, async (req, res) => {
  try {
    const amc = await AMC.findOne({ assetId: req.params.assetId });
    res.json(amc || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Update AMC
router.post('/amc', protect, verifyAssetOwnership, async (req, res) => {
  const { assetId, provider, startDate, endDate, cost } = req.body;
  try {
    let amc = await AMC.findOne({ assetId });
    if (amc) {
      amc.provider = provider;
      amc.startDate = startDate;
      amc.endDate = endDate;
      amc.cost = Number(cost) || 0;
      await amc.save();
    } else {
      amc = await AMC.create({
        assetId,
        provider,
        startDate,
        endDate,
        cost: Number(cost) || 0
      });
    }
    res.json(amc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
