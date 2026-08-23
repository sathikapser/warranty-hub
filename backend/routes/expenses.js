const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Asset = require('../models/Asset');
const Service = require('../models/Service');
const Insurance = require('../models/Insurance');
const AMC = require('../models/AMC');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { broadcastActivity } = require('../utils/socket');

const getWorkspaceUserIds = async (user) => {
  const ownerId = user.familyWorkspaceOwnerId || user._id;
  const members = await User.find({ familyWorkspaceOwnerId: ownerId });
  return [ownerId, ...members.map(m => m._id)];
};

// @desc    Get complete expense summary and analytics
// @route   GET /api/expenses/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const workspaceIds = await getWorkspaceUserIds(req.user);
    const assets = await Asset.find({ userId: { $in: workspaceIds } });
    const assetIds = assets.map(a => a._id);

    let totalPurchaseValue = 0;
    let totalServiceAndRepairCost = 0;
    let totalInsuranceCost = 0;
    let totalAMCCost = 0;
    let totalCustomExpenses = 0;

    const categoryBreakdown = {};
    const assetTCOList = [];
    const monthlySpending = {};

    // Calculate Asset Purchase Values
    assets.forEach(asset => {
      totalPurchaseValue += asset.purchasePrice || 0;
      categoryBreakdown[asset.category] = (categoryBreakdown[asset.category] || 0) + (asset.purchasePrice || 0);
    });

    // Calculate Services
    const services = await Service.find({ assetId: { $in: assetIds } });
    services.forEach(s => {
      totalServiceAndRepairCost += s.cost || 0;
      const monthKey = s.lastServiceDate ? new Date(s.lastServiceDate).toISOString().substring(0, 7) : 'Unknown';
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + (s.cost || 0);
    });

    // Calculate Insurance
    const insurances = await Insurance.find({ assetId: { $in: assetIds } });
    insurances.forEach(i => {
      totalInsuranceCost += i.cost || 0;
    });

    // Calculate AMCs
    const amcs = await AMC.find({ assetId: { $in: assetIds } });
    amcs.forEach(a => {
      totalAMCCost += a.cost || 0;
    });

    // Calculate Custom Expenses
    const expenses = await Expense.find({ assetId: { $in: assetIds } }).sort({ expenseDate: -1 });
    expenses.forEach(e => {
      totalCustomExpenses += e.amount || 0;
      const monthKey = e.expenseDate ? new Date(e.expenseDate).toISOString().substring(0, 7) : 'Unknown';
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + (e.amount || 0);
    });

    // Total Cost of Ownership
    const totalTCO = totalPurchaseValue + totalServiceAndRepairCost + totalInsuranceCost + totalAMCCost + totalCustomExpenses;

    // Per-asset breakdown & Buy vs Repair Recommendation
    for (const asset of assets) {
      const assetServices = services.filter(s => s.assetId.toString() === asset._id.toString());
      const assetExpenses = expenses.filter(e => e.assetId.toString() === asset._id.toString());
      
      const maintenanceSpent = assetServices.reduce((acc, s) => acc + (s.cost || 0), 0) + assetExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      const assetTCO = (asset.purchasePrice || 0) + maintenanceSpent;
      const maintenanceRatio = asset.purchasePrice > 0 ? (maintenanceSpent / asset.purchasePrice) : 0;

      let recommendation = 'Maintain & Service';
      let recommendationReason = 'Maintenance costs are low relative to asset value.';

      if (maintenanceRatio >= 0.45) {
        recommendation = 'Consider Replacement / Upgrade';
        recommendationReason = `Total repair & upkeep costs (${(maintenanceRatio * 100).toFixed(0)}%) are approaching asset replacement threshold.`;
      } else if (maintenanceRatio >= 0.25) {
        recommendation = 'Invest in AMC Protection';
        recommendationReason = 'Moderate ongoing maintenance indicates frequent component wear.';
      }

      assetTCOList.push({
        assetId: asset._id,
        assetName: asset.assetName,
        brand: asset.brand,
        category: asset.category,
        purchasePrice: asset.purchasePrice || 0,
        maintenanceCost: maintenanceSpent,
        totalTCO: assetTCO,
        maintenanceRatio: (maintenanceRatio * 100).toFixed(1),
        recommendation,
        recommendationReason
      });
    }

    res.json({
      overview: {
        totalAssetValue: totalPurchaseValue,
        totalTCO,
        totalServiceAndRepairCost,
        totalInsuranceCost,
        totalAMCCost,
        totalCustomExpenses
      },
      categoryBreakdown,
      monthlySpending,
      assetTCOList: assetTCOList.sort((a, b) => b.totalTCO - a.totalTCO),
      recentExpenses: expenses.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a custom expense
// @route   POST /api/expenses
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { assetId, title, category, amount, expenseDate, vendor, notes } = req.body;
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const expense = await Expense.create({
      assetId,
      userId: req.user._id,
      title,
      category: category || 'repair',
      amount: Number(amount) || 0,
      expenseDate: expenseDate || new Date(),
      vendor: vendor || '',
      notes: notes || ''
    });

    const workspaceId = req.user.familyWorkspaceOwnerId || req.user._id;
    const activity = await ActivityLog.create({
      workspaceId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'expense_added',
      title: `Logged Expense for ${asset.brand} ${asset.assetName}`,
      details: `${title}: ₹${Number(amount).toLocaleString()}`,
      assetId: asset._id
    });
    broadcastActivity(workspaceId.toString(), activity);

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
