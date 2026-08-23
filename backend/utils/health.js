/**
 * Upgraded Warranty & Asset Health Score Algorithm (0-100)
 */

const calculateAssetHealth = (asset, warranty, services = [], documents = []) => {
  let score = 100;
  const penalties = [];
  const bonuses = [];

  // 1. Age Penalty (up to 20 pts)
  const purchaseDate = new Date(asset.purchaseDate);
  const diffTime = Math.abs(new Date() - purchaseDate);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  const agePenalty = Math.min(20, Math.round(diffYears * 2.5));
  if (agePenalty > 0) {
    score -= agePenalty;
    penalties.push({ reason: `Asset Age (${diffYears.toFixed(1)} yrs)`, points: -agePenalty });
  }

  // 2. Warranty Status Factor
  const today = new Date();
  if (warranty && warranty.endDate) {
    const endDate = new Date(warranty.endDate);
    if (endDate < today) {
      score -= 15;
      penalties.push({ reason: 'Warranty Expired', points: -15 });
    } else {
      const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        score -= 5;
        penalties.push({ reason: `Warranty Expiring Soon (${diffDays} days left)`, points: -5 });
      } else {
        bonuses.push({ reason: 'Active Warranty Protection', points: +10 });
      }
    }
  } else {
    score -= 10;
    penalties.push({ reason: 'No Warranty Registered', points: -10 });
  }

  // 3. Documentation Verification Bonus/Penalty
  const hasInvoice = documents.some(d => (d.documentType || '').toLowerCase().includes('invoice') || (d.fileName || '').toLowerCase().includes('bill') || (d.fileName || '').toLowerCase().includes('invoice'));
  if (hasInvoice) {
    bonuses.push({ reason: 'Tax Invoice Secured in Vault', points: +10 });
    score += 5;
  } else {
    score -= 8;
    penalties.push({ reason: 'Missing Purchase Invoice Proof', points: -8 });
  }

  if (asset.serialNumber) {
    bonuses.push({ reason: 'Serial / S/N Registered', points: +5 });
  } else {
    score -= 5;
    penalties.push({ reason: 'Missing Serial Number', points: -5 });
  }

  // 4. Maintenance / Service Records
  if (services && services.length > 0) {
    let overdueCount = 0;
    let repairCount = 0;

    services.forEach(srv => {
      if (srv.nextServiceDate && new Date(srv.nextServiceDate) < today) {
        overdueCount++;
      }
      const details = (srv.details || '').toLowerCase();
      if (details.includes('repair') || details.includes('replace') || details.includes('broke') || details.includes('fault')) {
        repairCount++;
      }
    });

    if (overdueCount > 0) {
      const p = Math.min(20, overdueCount * 10);
      score -= p;
      penalties.push({ reason: `${overdueCount} Overdue Service(s)`, points: -p });
    } else {
      bonuses.push({ reason: 'Service Schedule Up to Date', points: +5 });
    }

    if (repairCount > 0) {
      const p = Math.min(15, repairCount * 5);
      score -= p;
      penalties.push({ reason: `${repairCount} Historical Repair Incidents`, points: -p });
    }
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  let grade = 'A+';
  let gradeColor = '#10b981';
  let statusText = 'Excellent Health';

  if (finalScore >= 85) {
    grade = 'A';
    gradeColor = '#10b981';
    statusText = 'Optimum Protection';
  } else if (finalScore >= 70) {
    grade = 'B';
    gradeColor = '#00f2fe';
    statusText = 'Good / Stable';
  } else if (finalScore >= 50) {
    grade = 'C';
    gradeColor = '#f59e0b';
    statusText = 'Requires Attention';
  } else {
    grade = 'D';
    gradeColor = '#ef4444';
    statusText = 'High Risk';
  }

  return {
    score: finalScore,
    grade,
    gradeColor,
    statusText,
    penalties,
    bonuses,
    recommendations: generateAssetRecommendations(finalScore, warranty, hasInvoice, asset)
  };
};

const generateAssetRecommendations = (score, warranty, hasInvoice, asset) => {
  const recs = [];
  if (!hasInvoice) {
    recs.push({ action: 'Upload Invoice', tip: 'Attach the original purchase invoice to avoid warranty claim denials.' });
  }
  if (!warranty || warranty.status === 'expired') {
    recs.push({ action: 'Get Extended Warranty / AMC', tip: 'Extend coverage to safeguard against costly component failure.' });
  }
  if (!asset.serialNumber) {
    recs.push({ action: 'Record Serial Number', tip: 'Add product serial number for 1-click manufacturer verification.' });
  }
  if (recs.length === 0) {
    recs.push({ action: 'Routine Check', tip: 'Everything looks optimal! Keep logging scheduled cleanings & services.' });
  }
  return recs;
};

// Workspace / Household Wide Health Score
const calculateWorkspaceHealth = (assetHealthList = []) => {
  if (assetHealthList.length === 0) {
    return {
      overallScore: 100,
      grade: 'A+',
      gradeColor: '#10b981',
      totalAssets: 0,
      activeProtected: 0,
      expiringCount: 0,
      missingInvoicesCount: 0,
      insights: ['Add your first household asset to begin continuous warranty tracking.']
    };
  }

  const totalScore = assetHealthList.reduce((acc, a) => acc + (a.health?.score || 80), 0);
  const avgScore = Math.round(totalScore / assetHealthList.length);

  let activeProtected = 0;
  let expiringCount = 0;
  let missingInvoicesCount = 0;

  assetHealthList.forEach(item => {
    if (item.warrantyStatus === 'active') activeProtected++;
    if (item.warrantyStatus === 'expires-soon') expiringCount++;
    if (!item.hasInvoice) missingInvoicesCount++;
  });

  const insights = [];
  if (expiringCount > 0) {
    insights.push(`⚠️ ${expiringCount} asset(s) are expiring within 30 days. Review extension options.`);
  }
  if (missingInvoicesCount > 0) {
    insights.push(`📄 ${missingInvoicesCount} asset(s) lack invoice proofs in the Vault. Upload them to preserve claim eligibility.`);
  }
  if (activeProtected === assetHealthList.length && expiringCount === 0) {
    insights.push(`🎉 100% of your household assets have active warranty coverage!`);
  }

  return {
    overallScore: avgScore,
    grade: avgScore >= 85 ? 'A+' : avgScore >= 70 ? 'B+' : avgScore >= 50 ? 'C' : 'D',
    gradeColor: avgScore >= 85 ? '#10b981' : avgScore >= 70 ? '#00f2fe' : avgScore >= 50 ? '#f59e0b' : '#ef4444',
    totalAssets: assetHealthList.length,
    activeProtected,
    expiringCount,
    missingInvoicesCount,
    insights
  };
};

module.exports = {
  calculateHealthScore: (asset, warranty, services) => calculateAssetHealth(asset, warranty, services).score,
  calculateAssetHealth,
  calculateWorkspaceHealth
};
