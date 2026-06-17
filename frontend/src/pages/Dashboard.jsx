import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    warrantiesActive: 0,
    warrantiesExpired: 0,
    upcomingServices: 0,
    upcomingInsurance: 0,
    upcomingAMC: 0,
    totalValue: 0,
    maintenanceCost: 0,
    expensiveAsset: { name: 'None', price: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: assetsData } = await api.get('/assets');
        setAssets(assetsData);

        // Fetch tracker metrics
        let activeW = 0;
        let expiredW = 0;
        let servicesCount = 0;
        let insuranceCount = 0;
        let amcCount = 0;
        let totalVal = 0;
        let maintCost = 0;
        let maxPrice = 0;
        let maxAssetName = 'None';

        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        for (const asset of assetsData) {
          totalVal += asset.purchasePrice || 0;
          if ((asset.purchasePrice || 0) > maxPrice) {
            maxPrice = asset.purchasePrice;
            maxAssetName = `${asset.brand} ${asset.assetName}`;
          }

          // Warranties
          try {
            const { data: w } = await api.get(`/warranties/${asset._id}`);
            if (w.status === 'active' || w.status === 'expires-soon') activeW++;
            if (w.status === 'expired') expiredW++;
          } catch (err) {}

          // Services
          try {
            const { data: sList } = await api.get(`/services/${asset._id}`);
            sList.forEach(s => {
              maintCost += s.cost || 0;
              if (s.nextServiceDate) {
                const nextS = new Date(s.nextServiceDate);
                if (nextS >= today && nextS <= nextMonth) {
                  servicesCount++;
                }
              }
            });
          } catch (err) {}

          // Insurance
          try {
            const { data: ins } = await api.get(`/insurance/${asset._id}`);
            if (ins.cost) maintCost += ins.cost;
            if (ins.expiryDate) {
              const exp = new Date(ins.expiryDate);
              if (exp >= today && exp <= nextMonth) {
                insuranceCount++;
              }
            }
          } catch (err) {}

          // AMC
          try {
            const { data: amc } = await api.get(`/amc/${asset._id}`);
            if (amc.cost) maintCost += amc.cost;
            if (amc.endDate) {
              const exp = new Date(amc.endDate);
              if (exp >= today && exp <= nextMonth) {
                amcCount++;
              }
            }
          } catch (err) {}
        }

        setStats({
          totalAssets: assetsData.length,
          warrantiesActive: activeW,
          warrantiesExpired: expiredW,
          upcomingServices: servicesCount,
          upcomingInsurance: insuranceCount,
          upcomingAMC: amcCount,
          totalValue: totalVal,
          maintenanceCost: maintCost,
          expensiveAsset: { name: maxAssetName, price: maxPrice }
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading dashboard metrics...</h2>
      </div>
    );
  }

  // Chart Data: Assets by Category
  const categories = ['Electronics', 'Appliances', 'Vehicles', 'Industrial Equipment', 'Lifts', 'Generators', 'Water Purifiers', 'Others'];
  const categoryCounts = categories.map(cat => assets.filter(a => a.category === cat).length);
  
  const pieData = {
    labels: categories.filter((_, idx) => categoryCounts[idx] > 0),
    datasets: [
      {
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
      }
    ]
  };

  // Chart Data: Asset values per Category
  const categoryVal = categories.map(cat => 
    assets.filter(a => a.category === cat).reduce((sum, current) => sum + (current.purchasePrice || 0), 0)
  );

  const barData = {
    labels: categories.filter((_, idx) => categoryVal[idx] > 0),
    datasets: [
      {
        label: 'Purchase Value ($)',
        data: categoryVal.filter(v => v > 0),
        backgroundColor: 'rgba(79, 172, 254, 0.65)',
        borderColor: 'var(--secondary)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8), rgba(10, 14, 23, 0.9))'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-muted)' }}>Keep track of your asset assets and service warranties</p>
        </div>
        <Link to="/assets/add" className="btn btn-primary">➕ Add Asset</Link>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL ASSETS</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px' }}>{stats.totalAssets}</h2>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--success)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>WARRANTIES ACTIVE</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--success)' }}>{stats.warrantiesActive}</h2>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--danger)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>EXPIRED WARRANTIES</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--danger)' }}>{stats.warrantiesExpired}</h2>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>UPCOMING EXPIRIES</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--warning)' }}>
            {stats.upcomingServices + stats.upcomingInsurance + stats.upcomingAMC}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next 30 Days</span>
        </div>
      </div>

      {/* Financial Analytics */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Financial Health</h2>
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL ASSET PORTFOLIO VALUE</span>
            <h2 style={{ fontSize: '2rem', marginTop: '8px', color: 'var(--primary)' }}>${stats.totalValue.toLocaleString()}</h2>
          </div>
          <span style={{ fontSize: '2.5rem' }}>💰</span>
        </div>

        <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL MAINTENANCE COST</span>
            <h2 style={{ fontSize: '2rem', marginTop: '8px', color: 'var(--accent)' }}>${stats.maintenanceCost.toLocaleString()}</h2>
          </div>
          <span style={{ fontSize: '2.5rem' }}>🛠️</span>
        </div>

        <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>MOST VALUABLE ASSET</span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '8px', color: '#ffffff' }}>{stats.expensiveAsset.name}</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>${stats.expensiveAsset.price.toLocaleString()}</span>
          </div>
          <span style={{ fontSize: '2.5rem' }}>💎</span>
        </div>
      </div>

      {/* Charts Section */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', marginTop: '20px' }}>Visual Analytics</h2>
      <div className="chart-grid">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Category Distribution</h3>
          {pieData.datasets[0].data.length > 0 ? (
            <div style={{ width: '100%', maxWidth: '280px' }}>
              <Pie data={pieData} options={{ plugins: { legend: { labels: { color: '#f3f4f6' } } } }} />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '50px 0' }}>No assets registered yet to chart</p>
          )}
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Asset Value by Category</h3>
          {barData.datasets[0].data.length > 0 ? (
            <div style={{ width: '100%', minHeight: '220px' }}>
              <Bar data={barData} options={{ 
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
            <p style={{ color: 'var(--text-muted)', padding: '50px 0' }}>No value statistics to display</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
