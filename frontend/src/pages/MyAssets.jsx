import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const MyAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const { data } = await api.get('/assets');
        setAssets(data);
      } catch (err) {
        console.error('Error fetching assets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const categories = ['All', 'Electronics', 'Appliances', 'Vehicles', 'Industrial Equipment', 'Lifts', 'Generators', 'Water Purifiers', 'Others'];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.modelNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading your assets...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>My Asset Vault</h2>
        <Link to="/assets/add" className="btn btn-primary">➕ Add New Asset</Link>
      </div>

      {/* Filter Section */}
      <div className="glass-panel" style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        marginBottom: '30px',
        padding: '20px'
      }}>
        <div className="form-group" style={{ flex: 2, minWidth: '250px', marginBottom: 0 }}>
          <label className="form-label">Search</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by name, brand, model..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
          <label className="form-label">Category Filter</label>
          <select 
            className="form-input" 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ appearance: 'none', background: 'var(--bg-input)' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat} style={{ background: '#0d1527' }}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No assets found matching your criteria.</p>
          <Link to="/assets/add" className="btn btn-secondary">Create Asset</Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredAssets.map(asset => (
            <div key={asset._id} className="glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              position: 'relative'
            }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'var(--primary)',
                  display: 'block',
                  marginBottom: '8px'
                }}>{asset.category}</span>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{asset.assetName}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
                  {asset.brand} {asset.modelNumber ? `• ${asset.modelNumber}` : ''}
                </p>

                {asset.assignedTo && (
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--accent-glow)',
                    color: '#c084fc',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    border: '1px solid rgba(162,0,255,0.2)',
                    marginBottom: '12px'
                  }}>👤 Assigned to: {asset.assignedTo}</span>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Purchased: {new Date(asset.purchaseDate).toLocaleDateString()}
                </span>
                <Link to={`/assets/${asset._id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  Manage →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAssets;
