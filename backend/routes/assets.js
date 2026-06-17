const express = require('express');
const router = express.Router();
const qr = require('qrcode');
const Asset = require('../models/Asset');
const Warranty = require('../models/Warranty');
const Service = require('../models/Service');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { calculateHealthScore } = require('../utils/health');

// Helper to get all user IDs in the family workspace
const getWorkspaceUserIds = async (user) => {
  const ownerId = user.familyWorkspaceOwnerId || user._id;
  const members = await User.find({ familyWorkspaceOwnerId: ownerId });
  const memberIds = members.map(m => m._id);
  return [ownerId, ...memberIds];
};

// @desc    Get all assets for workspace
// @route   GET /api/assets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const workspaceIds = await getWorkspaceUserIds(req.user);
    const assets = await Asset.find({ userId: { $in: workspaceIds } });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get asset by ID
// @route   GET /api/assets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.id || req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Access check
    const workspaceIds = await getWorkspaceUserIds(req.user);
    if (!workspaceIds.map(id => id.toString()).includes(asset.userId.toString())) {
      return res.status(403).json({ message: 'Access denied to this asset' });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private
router.post('/', protect, async (req, res) => {
  const { assetName, category, brand, modelNumber, serialNumber, purchaseDate, purchasePrice, assignedTo } = req.body;

  try {
    const asset = await Asset.create({
      userId: req.user._id, // Owned by creator
      assetName,
      category,
      brand,
      modelNumber,
      serialNumber,
      purchaseDate,
      purchasePrice,
      assignedTo
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Access check
    const workspaceIds = await getWorkspaceUserIds(req.user);
    if (!workspaceIds.map(id => id.toString()).includes(asset.userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    asset.assetName = req.body.assetName || asset.assetName;
    asset.category = req.body.category || asset.category;
    asset.brand = req.body.brand || asset.brand;
    asset.modelNumber = req.body.modelNumber || asset.modelNumber;
    asset.serialNumber = req.body.serialNumber || asset.serialNumber;
    asset.purchaseDate = req.body.purchaseDate || asset.purchaseDate;
    asset.purchasePrice = req.body.purchasePrice !== undefined ? req.body.purchasePrice : asset.purchasePrice;
    asset.assignedTo = req.body.assignedTo !== undefined ? req.body.assignedTo : asset.assignedTo;

    const updatedAsset = await asset.save();
    res.json(updatedAsset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Access check
    const workspaceIds = await getWorkspaceUserIds(req.user);
    if (!workspaceIds.map(id => id.toString()).includes(asset.userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete cascading dependencies
    await Warranty.deleteMany({ assetId: asset._id });
    await Service.deleteMany({ assetId: asset._id });
    await asset.deleteOne();

    res.json({ message: 'Asset and related records removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get QR code for an asset
// @route   GET /api/assets/:id/qr
// @access  Private
router.get('/:id/qr', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const qrPayload = {
      assetId: asset._id,
      name: asset.assetName,
      brand: asset.brand,
      model: asset.modelNumber || 'N/A',
      serial: asset.serialNumber || 'N/A',
      purchaseDate: asset.purchaseDate
    };

    // Generate QR code data URL (scannable payload)
    const qrCodeUrl = await qr.toDataURL(JSON.stringify(qrPayload));
    res.json({ qrCodeUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get Asset Health Score & Timeline details
// @route   GET /api/assets/:id/health
// @access  Private
router.get('/:id/health', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const warranty = await Warranty.findOne({ assetId: asset._id });
    const services = await Service.find({ assetId: asset._id });

    const score = calculateHealthScore(asset, warranty, services);
    res.json({
      healthScore: score,
      details: {
        ageYears: ((new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1),
        warrantyStatus: warranty ? warranty.status : 'None Registered',
        serviceRecordsCount: services.length,
        repairsCount: services.filter(s => (s.details || '').toLowerCase().includes('repair') || (s.details || '').toLowerCase().includes('replace')).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
