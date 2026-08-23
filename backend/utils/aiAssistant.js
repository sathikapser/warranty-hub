const Asset = require('../models/Asset');
const Warranty = require('../models/Warranty');
const Service = require('../models/Service');
const Document = require('../models/Document');
const Expense = require('../models/Expense');

/**
 * AI Assistant Engine for WarrantyHub 2.0
 */

// 1. Natural Language Asset Search & Filtering
const parseNlpQuery = async (queryText, workspaceAssetIds) => {
  const query = queryText.toLowerCase();
  const filter = { _id: { $in: workspaceAssetIds } };

  // Category matching
  const categories = ['electronics', 'appliances', 'vehicles', 'industrial equipment', 'lifts', 'generators', 'water purifiers', 'others'];
  for (const cat of categories) {
    if (query.includes(cat)) {
      filter.category = new RegExp(cat, 'i');
      break;
    }
  }

  // Brand matching
  const brands = ['samsung', 'lg', 'apple', 'sony', 'dell', 'hp', 'whirlpool', 'panasonic', 'bosch', 'dyson', 'voltas', 'daikin', 'philips', 'lenovo', 'asus', 'acer'];
  for (const b of brands) {
    if (query.includes(b)) {
      filter.brand = new RegExp(b, 'i');
      break;
    }
  }

  // Fetch candidate assets
  let assets = await Asset.find(filter);

  // Warranty duration / expiration matching
  const today = new Date();
  if (query.includes('expir') || query.includes('warranty') || query.includes('days') || query.includes('active') || query.includes('expired')) {
    const enriched = [];
    for (const asset of assets) {
      const warranty = await Warranty.findOne({ assetId: asset._id });
      let status = 'none';
      let daysRemaining = null;
      if (warranty && warranty.endDate) {
        const end = new Date(warranty.endDate);
        daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        status = daysRemaining < 0 ? 'expired' : (daysRemaining <= 30 ? 'expires-soon' : 'active');
      }

      // Filter logic based on query
      let matches = true;
      if (query.includes('expired') && status !== 'expired') matches = false;
      if (query.includes('active') && status !== 'active' && status !== 'expires-soon') matches = false;
      if (query.includes('60 days') || query.includes('within 60')) {
        if (daysRemaining === null || daysRemaining > 60 || daysRemaining < 0) matches = false;
      }
      if (query.includes('30 days') || query.includes('within 30') || query.includes('soon')) {
        if (daysRemaining === null || daysRemaining > 30 || daysRemaining < 0) matches = false;
      }

      if (matches) {
        enriched.push({
          ...asset.toObject(),
          warranty: warranty || null,
          warrantyStatus: status,
          daysRemaining
        });
      }
    }
    return enriched;
  }

  return assets;
};

// 2. Draft Comprehensive Warranty Claim Kit
const prepareClaimKit = async (assetId, issueDescription) => {
  const asset = await Asset.findById(assetId);
  if (!asset) throw new Error('Asset not found');

  const warranty = await Warranty.findOne({ assetId: asset._id });
  const documents = await Document.find({ assetId: asset._id });
  const services = await Service.find({ assetId: asset._id });

  const today = new Date();
  const purchaseDateStr = new Date(asset.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isCovered = warranty && new Date(warranty.endDate) >= today;
  const warrantyEndDateStr = warranty ? new Date(warranty.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No warranty record';
  
  const hasInvoice = documents.some(d => (d.documentType || '').toLowerCase().includes('invoice') || (d.fileName || '').toLowerCase().includes('invoice') || (d.fileName || '').toLowerCase().includes('bill'));
  const hasWarrantyCard = documents.some(d => (d.documentType || '').toLowerCase().includes('warranty'));

  // Compose Email Template
  const emailSubject = `Warranty Service Claim Request: ${asset.brand} ${asset.assetName} [Serial: ${asset.serialNumber || 'N/A'}]`;
  const emailBody = `Dear ${asset.brand} Customer Service / Authorized Support Team,

I am writing to initiate a warranty claim for my ${asset.brand} ${asset.assetName} (Model: ${asset.modelNumber || 'N/A'}, Serial Number: ${asset.serialNumber || 'N/A'}), purchased on ${purchaseDateStr}.

The product is currently experiencing the following defect:
"${issueDescription || 'Operational malfunction requiring diagnostic inspection and component repair/replacement under standard manufacturer warranty.'}"

Coverage Details:
- Purchase Date: ${purchaseDateStr}
- Warranty Active Until: ${warrantyEndDateStr}
- Current Status: ${isCovered ? 'Active Manufacturer Warranty Coverage' : 'Warranty Expired (Requesting goodwill/discounted repair evaluation)'}
${warranty && warranty.policyNumber ? `- Policy/Registration Number: ${warranty.policyNumber}` : ''}

Attached Documentation Available:
- Official Proof of Purchase / Tax Invoice: ${hasInvoice ? 'Attached' : 'Available upon request'}
- Warranty Card / Registration Document: ${hasWarrantyCard ? 'Attached' : 'Available upon request'}

Please confirm receipt of this claim and provide an RMA / Service Request Ticket Number along with the contact details for the assigned technician or nearest authorized service center.

Thank you for your prompt assistance.

Sincerely,
WarrantyHub Registered Owner`;

  const checklist = [
    { item: 'Purchase Invoice / Receipt (Proof of Date & Vendor)', ready: hasInvoice, note: hasInvoice ? 'Found in Documents Vault' : 'Recommended to upload to Documents Vault' },
    { item: 'Serial Number / IMEI Verification', ready: !!asset.serialNumber, note: asset.serialNumber ? `Verified: ${asset.serialNumber}` : 'Please add Serial Number in Asset Details' },
    { item: 'Clear Photos/Videos of the defect', ready: true, note: 'Capture short clip showing the fault' },
    { item: 'Active Warranty Validation', ready: isCovered, note: isCovered ? `Valid until ${warrantyEndDateStr}` : 'Expired or Not Registered' }
  ];

  return {
    asset: {
      id: asset._id,
      name: asset.assetName,
      brand: asset.brand,
      model: asset.modelNumber,
      serial: asset.serialNumber,
      purchaseDate: purchaseDateStr,
      warrantyEndDate: warrantyEndDateStr,
      isCovered
    },
    claimEmail: {
      to: warranty?.claimEmail || `support@${(asset.brand || 'brand').toLowerCase().replace(/\s+/g, '')}.com`,
      subject: emailSubject,
      body: emailBody
    },
    checklist,
    recommendations: [
      'Call customer care during business hours for fastest ticket generation.',
      'Always obtain a formal Service Job-Sheet Number before handing over the appliance.',
      'Retain all replaced parts if non-warranty charges are ever quoted.'
    ]
  };
};

// 3. Predictive Maintenance & Failure Probability
const calculatePredictiveMaintenance = async (assetId) => {
  const asset = await Asset.findById(assetId);
  if (!asset) throw new Error('Asset not found');

  const services = await Service.find({ assetId: asset._id });
  const warranty = await Warranty.findOne({ assetId: asset._id });
  const expenses = await Expense.find({ assetId: asset._id });

  const ageYears = (new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25);
  const repairCount = services.filter(s => (s.details || '').toLowerCase().includes('repair') || (s.details || '').toLowerCase().includes('replace')).length;
  const totalServiceCost = services.reduce((acc, s) => acc + (s.cost || 0), 0) + expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const costRatio = asset.purchasePrice > 0 ? (totalServiceCost / asset.purchasePrice) : 0;

  let riskLevel = 'Low';
  let probabilityPercentage = 15;
  let recommendation = 'Asset is operating within normal parameters. Continue standard routine care.';

  if (ageYears > 5 || repairCount >= 3 || costRatio > 0.4) {
    riskLevel = 'High';
    probabilityPercentage = 78;
    recommendation = 'High maintenance probability detected. Cumulative repair costs are approaching 40%+ of purchase value. Consider replacing or obtaining an AMC contract.';
  } else if (ageYears > 2.5 || repairCount >= 1 || costRatio > 0.2) {
    riskLevel = 'Moderate';
    probabilityPercentage = 45;
    recommendation = 'Moderate wear detected. Schedule preventive cleaning and electrical checkup before peak season.';
  }

  // Next recommended service date calculation
  const nextRecommendedDate = new Date();
  nextRecommendedDate.setMonth(nextRecommendedDate.getMonth() + (riskLevel === 'High' ? 1 : (riskLevel === 'Moderate' ? 3 : 6)));

  return {
    assetName: `${asset.brand} ${asset.assetName}`,
    category: asset.category,
    ageYears: ageYears.toFixed(1),
    repairHistoryCount: repairCount,
    totalExpenses: totalServiceCost,
    costToAssetRatio: (costRatio * 100).toFixed(1) + '%',
    riskLevel,
    failureProbability: `${probabilityPercentage}%`,
    nextPreventiveServiceDue: nextRecommendedDate.toISOString().split('T')[0],
    recommendation,
    actionItems: [
      riskLevel === 'High' ? 'Evaluate repair vs buy economics' : 'Perform standard filter/ventilation cleaning',
      warranty?.status === 'expired' ? 'Check if Extended Warranty/AMC is available' : 'Keep warranty claim documentation ready',
      'Log all future service receipts for lifetime resale valuation'
    ]
  };
};

// 4. Conversational Chat Engine with Full Workspace Context
const processChatMessage = async (userMessage, user, workspaceAssetIds) => {
  const query = userMessage.toLowerCase().trim();

  // Load all user workspace assets & warranties for context
  const assets = await Asset.find({ _id: { $in: workspaceAssetIds } });
  const today = new Date();

  // Load warranty and service info for all assets
  const assetCatalog = [];
  for (const a of assets) {
    const w = await Warranty.findOne({ assetId: a._id });
    const s = await Service.find({ assetId: a._id });
    const docs = await Document.find({ assetId: a._id });
    
    let daysLeft = null;
    let status = 'none';
    if (w && w.endDate) {
      daysLeft = Math.ceil((new Date(w.endDate) - today) / (1000 * 60 * 60 * 24));
      status = daysLeft < 0 ? 'expired' : (daysLeft <= 30 ? 'expires-soon' : 'active');
    }

    assetCatalog.push({
      id: a._id,
      name: a.assetName,
      brand: a.brand,
      category: a.category,
      model: a.modelNumber || 'N/A',
      serial: a.serialNumber || 'N/A',
      price: a.purchasePrice,
      purchaseDate: new Date(a.purchaseDate).toISOString().split('T')[0],
      warrantyEndDate: w ? new Date(w.endDate).toISOString().split('T')[0] : null,
      warrantyStatus: status,
      daysLeft,
      hasInvoice: docs.some(d => (d.documentType || '').includes('invoice') || (d.fileName || '').includes('invoice')),
      serviceCount: s.length
    });
  }

  // A. Matching specific asset name in message
  const matchedAsset = assetCatalog.find(a => 
    query.includes(a.name.toLowerCase()) || 
    query.includes(a.brand.toLowerCase()) || 
    (a.brand && a.name && query.includes(`${a.brand} ${a.name}`.toLowerCase()))
  );

  // B. Intent: Claim preparation
  if (query.includes('claim') || query.includes('file a claim') || query.includes('rma') || query.includes('broken') || query.includes('noise') || query.includes('not working') || query.includes('damaged') || query.includes('defect')) {
    if (matchedAsset) {
      const claim = await prepareClaimKit(matchedAsset.id, userMessage);
      return {
        reply: `### 🛡️ Warranty Claim Assessment for **${matchedAsset.brand} ${matchedAsset.name}**\n\n` +
          `**Coverage Status**: ${claim.asset.isCovered ? `✅ **Active & Protected** (Valid until ${claim.asset.warrantyEndDate}, ${matchedAsset.daysLeft} days remaining)` : `❌ **Warranty Expired on ${claim.asset.warrantyEndDate}**`}\n\n` +
          `**Serial Number**: \`${claim.asset.serial || 'Not registered'}\`\n\n` +
          `**Document Readiness**: ${claim.checklist.every(c => c.ready) ? '✅ All necessary documents available in vault.' : '⚠️ Some proofs may need verification.'}\n\n` +
          `I have generated a ready-to-send claim email kit and checklist for you below!`,
        actionType: 'claim_kit',
        data: claim
      };
    }
  }

  // C. Intent: Expiration & Status queries
  if (query.includes('expir') || query.includes('status') || query.includes('under warranty') || query.includes('covered') || query.includes('valid')) {
    if (matchedAsset) {
      let statusDesc = '';
      if (matchedAsset.warrantyStatus === 'active') {
        statusDesc = `✅ Yes! Your **${matchedAsset.brand} ${matchedAsset.name}** is **actively protected** under warranty until **${matchedAsset.warrantyEndDate}** (${matchedAsset.daysLeft} days left).`;
      } else if (matchedAsset.warrantyStatus === 'expires-soon') {
        statusDesc = `⚠️ Attention! Your **${matchedAsset.brand} ${matchedAsset.name}** warranty is **expiring soon in ${matchedAsset.daysLeft} days** on **${matchedAsset.warrantyEndDate}**. Consider booking a complimentary maintenance checkup or extending your coverage.`;
      } else if (matchedAsset.warrantyStatus === 'expired') {
        statusDesc = `❌ Your **${matchedAsset.brand} ${matchedAsset.name}** warranty **expired on ${matchedAsset.warrantyEndDate}**. You can register an AMC contract or extended policy to regain protection.`;
      } else {
        statusDesc = `ℹ️ No warranty date is registered for **${matchedAsset.brand} ${matchedAsset.name}**. You can add warranty start & end dates in the Asset Details view.`;
      }

      return {
        reply: `${statusDesc}\n\n` +
          `- **Purchase Date**: ${matchedAsset.purchaseDate}\n` +
          `- **Invoice Attached**: ${matchedAsset.hasInvoice ? 'Yes (Stored in Vault)' : 'No (Upload recommended)'}\n` +
          `- **Past Service Records**: ${matchedAsset.serviceCount} logged`,
        actionType: 'asset_lookup',
        data: matchedAsset
      };
    } else {
      // General list of expiring items
      const expiringSoon = assetCatalog.filter(a => a.warrantyStatus === 'expires-soon');
      const expired = assetCatalog.filter(a => a.warrantyStatus === 'expired');
      const active = assetCatalog.filter(a => a.warrantyStatus === 'active');

      let reply = `### 📊 Workspace Warranty Overview\n\n` +
        `You currently have **${assetCatalog.length} assets** tracked in your household/workspace:\n\n` +
        `- 🟢 **Active Warranties**: ${active.length}\n` +
        `- 🟠 **Expiring Within 30 Days**: ${expiringSoon.length}\n` +
        `- 🔴 **Expired Warranties**: ${expired.length}\n\n`;

      if (expiringSoon.length > 0) {
        reply += `**Urgent Expirations Requiring Attention:**\n` +
          expiringSoon.map(a => `- **${a.brand} ${a.name}**: expires in **${a.daysLeft} days** (${a.warrantyEndDate})`).join('\n') + '\n\n';
      }

      reply += `Ask me about any specific item (e.g., *"Is my Samsung TV covered?"*) or ask to *"Draft a warranty claim"*!`;

      return {
        reply,
        actionType: 'summary',
        data: { active: active.length, expiring: expiringSoon.length, expired: expired.length }
      };
    }
  }

  // D. Intent: Predictive Maintenance / Service Advice
  if (query.includes('predict') || query.includes('maintenance') || query.includes('service') || query.includes('troubleshoot') || query.includes('cost')) {
    if (matchedAsset) {
      const pred = await calculatePredictiveMaintenance(matchedAsset.id);
      return {
        reply: `### 🛠️ Maintenance & Health Intelligence for **${matchedAsset.brand} ${matchedAsset.name}**\n\n` +
          `- **Estimated Failure Risk**: **${pred.riskLevel} (${pred.failureProbability})**\n` +
          `- **Asset Age**: ${pred.ageYears} years\n` +
          `- **Total Lifetime Maintenance Spent**: ₹${pred.totalExpenses.toLocaleString()}\n` +
          `- **Next Recommended Service Date**: **${pred.nextPreventiveServiceDue}**\n\n` +
          `**AI Assessment**: ${pred.recommendation}\n\n` +
          `**Key Action Items**:\n` + pred.actionItems.map(item => `1. ${item}`).join('\n'),
        actionType: 'predictive_maintenance',
        data: pred
      };
    }
  }

  // E. Fallback intelligent response
  return {
    reply: `Hello ${user.name}! I am your **WarrantyHub AI Intelligence Assistant**. 🤖\n\nHere are some of the ways I can help you today:\n\n` +
      `1. 🛡️ **Warranty Verification**: *"Is my LG Refrigerator still covered under warranty?"*\n` +
      `2. 📄 **Automated Claim Kit**: *"My Samsung TV screen is flickering. Help me prepare a warranty claim."*\n` +
      `3. 🔍 **Natural Language Search**: *"Show me all appliances expiring within 60 days."*\n` +
      `4. ⚙️ **Predictive Maintenance**: *"Check maintenance health for my Air Conditioner."*\n` +
      `5. 💰 **Expense & TCO Analysis**: *"What is my total cost of ownership for kitchen electronics?"*\n\n` +
      `How can I assist you right now?`,
    actionType: 'greeting'
  };
};

module.exports = {
  parseNlpQuery,
  prepareClaimKit,
  calculatePredictiveMaintenance,
  processChatMessage
};
