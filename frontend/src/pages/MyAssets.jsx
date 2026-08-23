import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const MyAssets = () => {
  const [assets, setAssets] = useState([]);
  const [warranties, setWarranties] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [qrModalData, setQrModalData] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data } = await api.get('/assets');
      setAssets(data);

      // Fetch warranties for status badges
      const wMap = {};
      for (const a of data) {
        try {
          const { data: w } = await api.get(`/warranties/${a._id}`);
          if (w && w.endDate) wMap[a._id] = w;
        } catch (e) {}
      }
      setWarranties(wMap);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Electronics', 'Appliances', 'Vehicles', 'Industrial Equipment', 'Lifts', 'Generators', 'Water Purifiers', 'Others'];

  const filteredAssets = assets.filter(asset => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      asset.assetName.toLowerCase().includes(term) ||
      asset.brand.toLowerCase().includes(term) ||
      (asset.modelNumber || '').toLowerCase().includes(term) ||
      (asset.serialNumber || '').toLowerCase().includes(term) ||
      (asset.roomOrLocation || '').toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getWarrantyStatusBadge = (assetId) => {
    const w = warranties[assetId];
    if (!w || !w.endDate) return <span className="badge badge-info">No Warranty</span>;

    const today = new Date();
    const end = new Date(w.endDate);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return <span className="badge badge-expired">Expired</span>;
    if (daysLeft <= 3) return <span className="badge badge-expired">🔴 {daysLeft}d left</span>;
    if (daysLeft <= 30) return <span className="badge badge-expiring">⚠️ {daysLeft}d left</span>;
    return <span className="badge badge-active">🟢 Protected</span>;
  };

  const handleShowQR = async (assetId) => {
    try {
      const { data } = await api.get(`/assets/${assetId}/qr`);
      setQrModalData(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading asset intelligence portfolio...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Household Asset Portfolio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Catalog of all protected appliances, gadgets, vehicles, and equipment
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'grid' ? '#000' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'list' ? '#000' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              ☰ List
            </button>
          </div>
          <Link to="/assets/add" className="btn btn-primary">
            + Register Asset
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '24px',
        padding: '16px 20px',
        alignItems: 'center'
      }}>
        <div style={{ flex: '2 1 240px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by asset name, brand, serial number, room..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select 
            className="form-select" 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '100%' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          Showing <strong>{filteredAssets.length}</strong> of {assets.length}
        </div>
      </div>

      {/* Assets Presentation */}
      {filteredAssets.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No assets match your search criteria.</p>
          <Link to="/assets/add" className="btn btn-secondary btn-sm">+ Register New Asset</Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '20px'
        }}>
          {filteredAssets.map(asset => (
            <div key={asset._id} className="glass-panel glass-card-interactive" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className="badge badge-purple">{asset.category}</span>
                  {getWarrantyStatusBadge(asset._id)}
                </div>
                
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', fontWeight: 700 }}>
                  <Link to={`/assets/${asset._id}`} style={{ color: '#ffffff' }}>
                    {asset.brand} {asset.assetName}
                  </Link>
                </h3>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '10px' }}>
                  {asset.modelNumber ? `Model: ${asset.modelNumber}` : 'Standard Model'}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span className="badge badge-info">📍 {asset.roomOrLocation || 'Household'}</span>
                  {asset.assignedTo && <span className="badge badge-purple">👤 {asset.assignedTo}</span>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Price</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>₹{asset.purchasePrice?.toLocaleString() || '0'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleShowQR(asset._id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                  >
                    📱 QR
                  </button>
                  <Link to={`/assets/${asset._id}`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.76rem' }}>
                    Manage →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Location / Room</th>
                <th>Purchase Date</th>
                <th>Value</th>
                <th>Warranty Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr key={asset._id}>
                  <td>
                    <Link to={`/assets/${asset._id}`} style={{ fontWeight: 600, color: '#ffffff' }}>
                      {asset.brand} {asset.assetName}
                    </Link>
                    {asset.serialNumber && <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>S/N: {asset.serialNumber}</div>}
                  </td>
                  <td>{asset.category}</td>
                  <td>{asset.roomOrLocation || 'Household'}</td>
                  <td>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                  <td>₹{asset.purchasePrice?.toLocaleString() || '0'}</td>
                  <td>{getWarrantyStatusBadge(asset._id)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleShowQR(asset._id)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        QR
                      </button>
                      <Link to={`/assets/${asset._id}`} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
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

      {/* QR Modal */}
      {qrModalData && (
        <div className="modal-overlay" onClick={() => setQrModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Smart QR Tag</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Scan to view serial number and active warranty
            </p>
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', display: 'inline-block', marginBottom: '14px' }}>
              <img src={qrModalData.qrCodeUrl} alt="Asset QR" style={{ width: '180px', height: '180px' }} />
            </div>
            <div style={{ fontSize: '0.84rem', color: '#ffffff', marginBottom: '14px' }}>
              <strong>{qrModalData.payload?.brand} {qrModalData.payload?.name}</strong>
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

export default MyAssets;
