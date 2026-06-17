const calculateHealthScore = (asset, warranty, services) => {
  let score = 100;
  
  // 1. Age Penalty
  const purchaseDate = new Date(asset.purchaseDate);
  const diffTime = Math.abs(new Date() - purchaseDate);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  score -= Math.min(20, diffYears * 3); // Deduct up to 20 points for age (3 points per year)

  // 2. Warranty Status Penalty
  if (warranty) {
    const today = new Date();
    const endDate = new Date(warranty.endDate);
    if (endDate < today) {
      score -= 15; // Expired warranty
    } else {
      const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        score -= 5; // Warranty expiring in 30 days
      }
    }
  } else {
    // No warranty registered at all
    score -= 5;
  }

  // 3. Service Status Penalty
  if (services && services.length > 0) {
    const today = new Date();
    // Sort services to find the latest
    const sortedServices = [...services].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    // Check if any service nextServiceDate is overdue
    let overdueCount = 0;
    let repairCount = 0;
    
    sortedServices.forEach(srv => {
      if (srv.nextServiceDate && new Date(srv.nextServiceDate) < today) {
        overdueCount++;
      }
      
      // Look for repair indicators in service details
      const details = (srv.details || '').toLowerCase();
      if (details.includes('repair') || details.includes('replace') || details.includes('broke') || details.includes('fault')) {
        repairCount++;
      }
    });

    score -= Math.min(20, overdueCount * 10); // Overdue service deducts 10 pts per incident, max 20
    score -= Math.min(15, repairCount * 5); // Repairs deduct 5 pts per incident, max 15
  } else {
    // No service history
    score -= 10;
  }

  // Bound score between 0 and 100
  return Math.max(10, Math.min(100, Math.round(score)));
};

module.exports = { calculateHealthScore };
