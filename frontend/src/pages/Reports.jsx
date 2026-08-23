import React, { useState, useEffect } from 'react';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
// Let's use correct import from react-chartjs-2
import { Pie as PieChart, Bar as BarChart, Doughnut as DoughnutChart } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const Reports = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValue: 0,
    maintenanceCost: 0,
    activeWarranties: 0,
    expiredWarranties: 0,
    expiringSoonWarranties: 0,
    averageAge: 0
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const { data: assetsData } = await api.get('/assets');
        setAssets(assetsData);

        let totalVal = 0;
        let maintCost = 0;
        let activeW = 0;
        let expiredW = 0;
        let soonW = 0;
        let totalAge = 0;

        for (const asset of assetsData) {
          totalVal += asset.purchasePrice || 0;
          
          // Age calculation
          const age = (new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25);
          totalAge += age;

          // Fetch Warranty status
          try {
            const { data: w } = await api.get(`/warranties/${asset._id}`);
            if (w && w.status) {
              if (w.status === 'active') activeW++;
              else if (w.status === 'expired') expiredW++;
              else if (w.status === 'expires-soon') soonW++;
            }
          } catch (err) {}

          // Fetch Services for maintenance cost
          try {
            const { data: services } = await api.get(`/services/${asset._id}`);
            services.forEach(s => {
              maintCost += s.cost || 0;
            });
          } catch (err) {}

          // Fetch Insurance for maintenance cost
          try {
            const { data: ins } = await api.get(`/insurance/${asset._id}`);
            if (ins && ins.cost) maintCost += ins.cost;
          } catch (err) {}

          // Fetch AMC for maintenance cost
          try {
            const { data: amc } = await api.get(`/amc/${asset._id}`);
            if (amc && amc.cost) maintCost += amc.cost;
          } catch (err) {}
        }

        setStats({
          totalValue: totalVal,
          maintenanceCost: maintCost,
          activeWarranties: activeW,
          expiredWarranties: expiredW,
          expiringSoonWarranties: soonW,
          averageAge: assetsData.length > 0 ? (totalAge / assetsData.length).toFixed(1) : 0
        });

      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const categories = ['Electronics', 'Appliances', 'Vehicles', 'Industrial Equipment', 'Lifts', 'Generators', 'Water Purifiers', 'Others'];
  const categoryCounts = categories.map(cat => assets.filter(a => a.category === cat).length);
  const categoryValues = categories.map(cat => 
    assets.filter(a => a.category === cat).reduce((sum, curr) => sum + (curr.purchasePrice || 0), 0)
  );

  // Chart 1: Category Distribution (Doughnut)
  const categoryDistributionData = {
    labels: categories.filter((_, idx) => categoryCounts[idx] > 0),
    datasets: [{
      data: categoryCounts.filter(c => c > 0),
      backgroundColor: [
        'rgba(0, 242, 254, 0.75)',
        'rgba(79, 172, 254, 0.75)',
        'rgba(162, 0, 255, 0.75)',
        'rgba(16, 185, 129, 0.75)',
        'rgba(245, 158, 11, 0.75)',
        'rgba(239, 68, 68, 0.75)',
        'rgba(59, 130, 246, 0.75)',
        'rgba(156, 163, 175, 0.75)'
      ],
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }]
  };

  // Chart 2: Category Valuation (Bar)
  const categoryValuationData = {
    labels: categories.filter((_, idx) => categoryValues[idx] > 0),
    datasets: [{
      label: 'Asset Valuation ($)',
      data: categoryValues.filter(v => v > 0),
      backgroundColor: 'rgba(162, 0, 255, 0.65)',
      borderColor: 'var(--accent)',
      borderWidth: 1
    }]
  };

  // Chart 3: Warranty Status Breakdown (Pie)
  const warrantyStatusData = {
    labels: ['Active', 'Expired', 'Expires Soon'],
    datasets: [{
      data: [stats.activeWarranties, stats.expiredWarranties, stats.expiringSoonWarranties],
      backgroundColor: [
        'rgba(16, 185, 129, 0.75)',
        'rgba(239, 68, 68, 0.75)',
        'rgba(245, 158, 11, 0.75)'
      ],
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }]
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Generating Detailed Reports...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{
        marginBottom: '30px',
        padding: '30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8), rgba(10, 14, 23, 0.9))'
      }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Reports & Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Deep analytics on asset investments, maintenance overheads, and warranty life-cycles.</p>
      </div>

      {/* Numerical Metrics */}
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>PORTFOLIO INVESTMENT</span>
          <h2 style={{ fontSize: '2rem', marginTop: '8px', color: '#ffffff' }}>${stats.totalValue.toLocaleString()}</h2>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>MAINTENANCE & SERVICE OVERHEAD</span>
          <h2 style={{ fontSize: '2rem', marginTop: '8px', color: 'var(--accent)' }}>${stats.maintenanceCost.toLocaleString()}</h2>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--success)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE WARRANTY RATIO</span>
          <h2 style={{ fontSize: '2rem', marginTop: '8px', color: 'var(--success)' }}>
            {stats.activeWarranties + stats.expiringSoonWarranties} / {stats.activeWarranties + stats.expiredWarranties + stats.expiringSoonWarranties || 0}
          </h2>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--info)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>AVERAGE ASSET LIFE</span>
          <h2 style={{ fontSize: '2rem', marginTop: '8px', color: 'var(--info)' }}>{stats.averageAge} Years</h2>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="chart-grid" style={{ marginTop: '30px' }}>
        
        {/* Doughnut Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Category Distribution</h3>
          {categoryDistributionData.datasets[0].data.length > 0 ? (
            <div style={{ width: '100%', maxWidth: '280px' }}>
              <DoughnutChart data={categoryDistributionData} options={{ plugins: { legend: { labels: { color: '#f3f4f6' } } } }} />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '50px 0' }}>No assets registered yet</p>
          )}
        </div>

        {/* Warranty Status Breakdown */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Warranty Status Ratio</h3>
          {stats.activeWarranties + stats.expiredWarranties + stats.expiringSoonWarranties > 0 ? (
            <div style={{ width: '100%', maxWidth: '280px' }}>
              <PieChart data={warrantyStatusData} options={{ plugins: { legend: { labels: { color: '#f3f4f6' } } } }} />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '50px 0' }}>No warranties recorded yet</p>
          )}
        </div>

        {/* Valuation Bar Chart */}
        <div className="glass-panel" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Total Asset Valuation by Category</h3>
          {categoryValuationData.datasets[0].data.length > 0 ? (
            <div style={{ width: '100%', minHeight: '300px' }}>
              <BarChart data={categoryValuationData} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                },
                plugins: { legend: { display: false } }
              }} />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '50px 0' }}>No investment statistics to display</p>
          )}
        </div>

      </div>

    </div>
  );
};

export default Reports;
