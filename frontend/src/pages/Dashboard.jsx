import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import HealthScoreCard from '../components/HealthScoreCard';
import ActivityFeedWidget from '../components/ActivityFeedWidget';
import CalendarExportModal from '../components/CalendarExportModal';
import OCRScannerModal from '../components/OCRScannerModal';
import { useSocket } from '../context/SocketContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [warrantiesList, setWarrantiesList] = useState([]);
  const [healthOverview, setHealthOverview] = useState(null);
  const [stats, setStats] = useState({
    totalAssets: 0,
    warrantiesActive: 0,
    warrantiesExpiring: 0,
    warrantiesExpired: 0,
    upcomingServices: 0,
    totalValue: 0,
    maintenanceCost: 0
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);

  const { isConnected } = useSocket() || {};

  const fetchDashboardData = async () => {
    try {
      const [assetsRes, healthRes] = await Promise.all([
        api.get('/assets'),
        api.get('/assets/health/overview')
      ]);

      const assetsData = assetsRes.data;
      setAssets(assetsData);
      setHealthOverview(healthRes.data);

      let activeW = 0;
      let expiringW = 0;
      let expiredW = 0;
      let totalVal = 0;
      let maintCost = 0;
      let servicesCount = 0;

      const today = new Date();
      const next30Days = new Date();
      next30Days.setDate(today.getDate() + 30);

      const wList = [];

      for (const asset of assetsData) {
        totalVal += asset.purchasePrice || 0;

        // Fetch Warranty
        try {
          const { data: w } = await api.get(`/warranties/${asset._id}`);
          if (w && w.endDate) {
            const endDate = new Date(w.endDate);
            const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysLeft < 0) {
              expiredW++;
            } else if (daysLeft <= 30) {
              expiringW++;
            } else {
              activeW++;
            }

            wList.push({ asset, warranty: w, daysLeft });
          }
        } catch (e) {}

        // Fetch Services
        try {
          const { data: sList } = await api.get(`/services/${asset._id}`);
          sList.forEach(s => {
            maintCost += s.cost || 0;
            if (s.nextServiceDate) {
              const nextS = new Date(s.nextServiceDate);
              if (nextS >= today && nextS <= next30Days) {
                servicesCount++;
              }
            }
          });
        } catch (e) {}
      }

      setWarrantiesList(wList.sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0)));
      setStats({
        totalAssets: assetsData.length,
        warrantiesActive: activeW,
        warrantiesExpiring: expiringW,
        warrantiesExpired: expiredW,
        upcomingServices: servicesCount,
        totalValue: totalVal,
        maintenanceCost: maintCost
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApplyOCRData = (extracted) => {
    // Navigate to AddAsset with pre-filled state
    navigate('/assets/add', { state: { prefill: extracted } });
  };

  const handleShowQR = async (assetId) => {
    try {
      const { data } = await api.get(`/assets/${assetId}/qr`);
      setQrModalData(data);
    } catch (err) {
      console.error('Error loading QR:', err);
    }
  };

  const doughnutData = {
    labels: ['Active & Protected', 'Expiring in 30 Days', 'Expired'],
    datasets: [
      {
        data: [stats.warrantiesActive, stats.warrantiesExpiring, stats.warrantiesExpired],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '16px 24px' }}>
      {/* Top Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Intelligence Command Center</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Continuous real-time asset monitoring, warranty loss prevention, and expense intelligence
          </p>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowOCRModal(true)} className="btn btn-secondary">
            📸 Scan Receipt (OCR)
          </button>
          <button onClick={() => setShowCalendarModal(true)} className="btn btn-secondary">
            📅 Calendar Sync
          </button>
          <Link to="/ai-assistant" className="btn btn-accent">
            🤖 Ask AI
          </Link>
          <Link to="/assets/add" className="btn btn-primary">
            + Add Asset
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Assets
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {stats.totalAssets}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#00f2fe', marginTop: '2px' }}>
            Active in workspace
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Protected Warranties
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {stats.warrantiesActive}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '2px' }}>
            Fully covered
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', border: stats.warrantiesExpiring > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Expiring &lt; 30 Days
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {stats.warrantiesExpiring}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '2px' }}>
            Action required
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Expired Warranties
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {stats.warrantiesExpired}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '2px' }}>
            Unprotected
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Asset Value
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00f2fe', marginTop: '4px' }}>
            ₹{stats.totalValue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Portfolio valuation
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Services Due
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
            {stats.upcomingServices}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8b5cf6', marginTop: '2px' }}>
            In next 30 days
          </div>
        </div>
      </div>

      {/* Grid: Health Score + Urgent Expiration Radar + Live Activity Feed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* 1. Warranty Health Score Gauge */}
        <HealthScoreCard
          healthData={healthOverview}
          onQuickFix={() => navigate('/vault')}
        />

        {/* 2. Urgent Expiration Radar */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🚨 Expiration Countdown Radar</h3>
            <Link to="/timeline" style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>
              Full Timeline →
            </Link>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {warrantiesList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', padding: '30px 0' }}>
                No active warranty deadlines registered.
              </p>
            ) : (
              warrantiesList.slice(0, 5).map(item => {
                const days = item.daysLeft;
                const isUrgent = days <= 3;
                const isExpiring = days <= 30;
                const isExpired = days < 0;

                return (
                  <div
                    key={item.asset._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isExpired
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isUrgent
                        ? 'rgba(239, 68, 68, 0.12)'
                        : isExpiring
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.3)' : isUrgent ? 'rgba(239, 68, 68, 0.4)' : isExpiring ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>
                        {item.asset.brand} {item.asset.assetName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Expires: {new Date(item.warranty.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${isExpired ? 'badge-expired' : isExpiring ? 'badge-expiring' : 'badge-active'}`}>
                        {isExpired ? 'Expired' : `${days}d left`}
                      </span>
                      <Link
                        to={`/assets/${item.asset._id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Live Socket Activity Stream */}
        <ActivityFeedWidget />
      </div>

      {/* Analytics Chart & Asset Catalog Quick Access */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start', flexWrap: 'wrap' }}>
        {/* Warranty Status Breakdown Chart */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>Warranty Portfolio Status</h3>
          <div style={{ maxHeight: '220px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } } }
              }}
            />
          </div>
        </div>

        {/* Asset Catalog Table */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Household Asset Catalog ({assets.length})</h3>
            <Link to="/assets" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
              View All Assets →
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading workspace assets...</p>
          ) : assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>No assets added yet.</p>
              <Link to="/assets/add" className="btn btn-primary btn-sm">
                + Add Your First Asset
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Purchase Date</th>
                    <th>Price</th>
                    <th>Location / User</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.slice(0, 6).map(asset => (
                    <tr key={asset._id}>
                      <td>
                        <Link to={`/assets/${asset._id}`} style={{ fontWeight: 600, color: '#ffffff' }}>
                          {asset.brand} {asset.assetName}
                        </Link>
                        {asset.serialNumber && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            S/N: {asset.serialNumber}
                          </div>
                        )}
                      </td>
                      <td>{asset.category}</td>
                      <td>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                      <td>₹{asset.purchasePrice?.toLocaleString() || '0'}</td>
                      <td>
                        <span className="badge badge-purple">
                          {asset.assignedTo || asset.roomOrLocation || 'Household'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleShowQR(asset._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="View QR Code"
                          >
                            📱 QR
                          </button>
                          <Link
                            to={`/assets/${asset._id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Open →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Export Modal */}
      <CalendarExportModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />

      {/* OCR Scanner Modal */}
      <OCRScannerModal
        isOpen={showOCRModal}
        onClose={() => setShowOCRModal(false)}
        onApplyExtractedData={handleApplyOCRData}
      />

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="modal-overlay" onClick={() => setQrModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Asset Smart QR Code</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Scan with phone camera or print as a physical label for this appliance
            </p>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px' }}>
              <img src={qrModalData.qrCodeUrl} alt="Asset QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
            <div style={{ fontSize: '0.84rem', color: '#f3f4f6', marginBottom: '16px' }}>
              <strong>{qrModalData.payload?.brand} {qrModalData.payload?.name}</strong><br />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Serial: {qrModalData.payload?.serial || 'N/A'}
              </span>
            </div>
            <button onClick={() => setQrModalData(null)} className="btn btn-secondary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
