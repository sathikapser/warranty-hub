const express = require('express');
const router = express.Router();
const qr = require('qrcode');
const Asset = require('../models/Asset');
const Warranty = require('../models/Warranty');
const Service = require('../models/Service');
const Document = require('../models/Document');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { calculateAssetHealth, calculateWorkspaceHealth } = require('../utils/health');
const { emitWorkspaceEvent, broadcastActivity } = require('../utils/socket');

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
    const assets = await Asset.find({ userId: { $in: workspaceIds } }).sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get overall workspace warranty health score
// @route   GET /api/assets/health/overview
// @access  Private
router.get('/health/overview', protect, async (req, res) => {
  try {
    const workspaceIds = await getWorkspaceUserIds(req.user);
    const assets = await Asset.find({ userId: { $in: workspaceIds } });

    const assetHealthList = [];
    for (const asset of assets) {
      const warranty = await Warranty.findOne({ assetId: asset._id });
      const services = await Service.find({ assetId: asset._id });
      const documents = await Document.find({ assetId: asset._id });
      const health = calculateAssetHealth(asset, warranty, services, documents);

      let wStatus = 'none';
      if (warranty && warranty.endDate) {
        const today = new Date();
        const end = new Date(warranty.endDate);
        const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        wStatus = days < 0 ? 'expired' : (days <= 30 ? 'expires-soon' : 'active');
      }

      const hasInvoice = documents.some(d => (d.documentType || '').includes('invoice') || (d.fileName || '').includes('invoice'));

      assetHealthList.push({
        assetId: asset._id,
        assetName: asset.assetName,
        brand: asset.brand,
        health,
        warrantyStatus: wStatus,
        hasInvoice
      });
    }

    const overview = calculateWorkspaceHealth(assetHealthList);
    res.json({
      ...overview,
      assetHealthList
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get asset by ID
// @route   GET /api/assets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
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
  const { 
    assetName, 
    category, 
    brand, 
    modelNumber, 
    serialNumber, 
    purchaseDate, 
    purchasePrice, 
    assignedTo, 
    sellerOrStore, 
    warrantyDurationMonths, 
    roomOrLocation, 
    condition, 
    notes,
    warrantyEndDate,
    warrantyProvider
  } = req.body;

  try {
    const asset = await Asset.create({
      userId: req.user._id,
      assetName,
      category,
      brand,
      modelNumber,
      serialNumber,
      purchaseDate,
      purchasePrice: Number(purchasePrice) || 0,
      assignedTo,
      sellerOrStore,
      warrantyDurationMonths: Number(warrantyDurationMonths) || 12,
      roomOrLocation: roomOrLocation || 'Main Household',
      condition: condition || 'good',
      notes
    });

    // Auto-create warranty record if duration or end date given
    let calculatedEndDate = warrantyEndDate;
    if (!calculatedEndDate && purchaseDate) {
      const pDate = new Date(purchaseDate);
      const months = Number(warrantyDurationMonths) || 12;
      pDate.setMonth(pDate.getMonth() + months);
      calculatedEndDate = pDate;
    }

    if (calculatedEndDate) {
      const today = new Date();
      const end = new Date(calculatedEndDate);
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      const status = diffDays < 0 ? 'expired' : (diffDays <= 30 ? 'expires-soon' : 'active');

      await Warranty.create({
        assetId: asset._id,
        startDate: purchaseDate || new Date(),
        endDate: calculatedEndDate,
        provider: warrantyProvider || `${brand} Manufacturer Warranty`,
        status
      });
    }

    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;

    // Real-time broadcast
    emitWorkspaceEvent(workspaceId.toString(), 'asset_created', {
      asset,
      createdBy: req.user.name
    });

    // Activity Log
    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'asset_added',
      title: `Added New Asset: ${asset.brand} ${asset.assetName}`,
      details: `${asset.category} • ₹${asset.purchasePrice.toLocaleString()} • In ${asset.roomOrLocation}`,
      assetId: asset._id
    });
    broadcastActivity(workspaceId.toString(), activity);

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

    const workspaceIds = await getWorkspaceUserIds(req.user);
    if (!workspaceIds.map(id => id.toString()).includes(asset.userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    asset.assetName = req.body.assetName || asset.assetName;
    asset.category = req.body.category || asset.category;
    asset.brand = req.body.brand || asset.brand;
    asset.modelNumber = req.body.modelNumber !== undefined ? req.body.modelNumber : asset.modelNumber;
    asset.serialNumber = req.body.serialNumber !== undefined ? req.body.serialNumber : asset.serialNumber;
    asset.purchaseDate = req.body.purchaseDate || asset.purchaseDate;
    asset.purchasePrice = req.body.purchasePrice !== undefined ? Number(req.body.purchasePrice) : asset.purchasePrice;
    asset.assignedTo = req.body.assignedTo !== undefined ? req.body.assignedTo : asset.assignedTo;
    asset.sellerOrStore = req.body.sellerOrStore !== undefined ? req.body.sellerOrStore : asset.sellerOrStore;
    asset.warrantyDurationMonths = req.body.warrantyDurationMonths !== undefined ? Number(req.body.warrantyDurationMonths) : asset.warrantyDurationMonths;
    asset.roomOrLocation = req.body.roomOrLocation !== undefined ? req.body.roomOrLocation : asset.roomOrLocation;
    asset.condition = req.body.condition || asset.condition;
    asset.notes = req.body.notes !== undefined ? req.body.notes : asset.notes;

    const updatedAsset = await asset.save();

    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    emitWorkspaceEvent(workspaceId.toString(), 'asset_updated', {
      asset: updatedAsset,
      updatedBy: req.user.name
    });

    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'asset_updated',
      title: `Updated Asset: ${updatedAsset.brand} ${updatedAsset.assetName}`,
      details: `Changes saved by ${req.user.name}`,
      assetId: updatedAsset._id
    });
    broadcastActivity(workspaceId.toString(), activity);

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

    const workspaceIds = await getWorkspaceUserIds(req.user);
    if (!workspaceIds.map(id => id.toString()).includes(asset.userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assetName = `${asset.brand} ${asset.assetName}`;
    const assetId = asset._id;

    // Delete cascading dependencies
    await Warranty.deleteMany({ assetId: asset._id });
    await Service.deleteMany({ assetId: asset._id });
    await Document.deleteMany({ assetId: asset._id });
    await asset.deleteOne();

    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    emitWorkspaceEvent(workspaceId.toString(), 'asset_deleted', {
      assetId,
      assetName,
      deletedBy: req.user.name
    });

    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'asset_deleted',
      title: `Removed Asset: ${assetName}`,
      details: `Asset and associated records removed from workspace`
    });
    broadcastActivity(workspaceId.toString(), activity);

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

    const warranty = await Warranty.findOne({ assetId: asset._id });

    const qrPayload = {
      platform: 'WarrantyHub 2.0',
      assetId: asset._id,
      name: asset.assetName,
      brand: asset.brand,
      model: asset.modelNumber || 'N/A',
      serial: asset.serialNumber || 'N/A',
      purchaseDate: asset.purchaseDate,
      warrantyExpires: warranty?.endDate || 'N/A',
      status: warranty?.status || 'Active'
    };

    const qrCodeUrl = await qr.toDataURL(JSON.stringify(qrPayload, null, 2));
    res.json({ qrCodeUrl, payload: qrPayload });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get Asset Health Score & Detailed Diagnostic
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
    const documents = await Document.find({ assetId: asset._id });

    const health = calculateAssetHealth(asset, warranty, services, documents);
    res.json({
      healthScore: health.score,
      healthGrade: health.grade,
      healthColor: health.gradeColor,
      statusText: health.statusText,
      penalties: health.penalties,
      bonuses: health.bonuses,
      recommendations: health.recommendations,
      details: {
        ageYears: ((new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1),
        warrantyStatus: warranty ? warranty.status : 'None Registered',
        serviceRecordsCount: services.length,
        documentsCount: documents.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
