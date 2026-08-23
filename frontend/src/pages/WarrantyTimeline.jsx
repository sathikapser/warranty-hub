import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const WarrantyTimeline = () => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const { data: assets } = await api.get('/assets');
        const items = [];

        for (const asset of assets) {
          try {
            const { data: warranty } = await api.get(`/warranties/${asset._id}`);
            if (warranty && warranty.endDate) {
              const expiry = new Date(warranty.endDate);
              const start = new Date(warranty.startDate);
              const today = new Date();
              
              const totalDays = Math.ceil((expiry - start) / (1000 * 60 * 60 * 24)) || 1;
              const remainingDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
              const progress = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));

              items.push({
                assetId: asset._id,
                name: asset.assetName,
                brand: asset.brand,
                category: asset.category,
                startDate: warranty.startDate,
                endDate: warranty.endDate,
                status: warranty.status,
                remainingDays,
                progress
              });
            }
          } catch (err) {
            console.error('Error fetching warranty for', asset.assetName, err);
          }
        }

        // Sort by expiry date (soonest to expire first)
        items.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        setTimelineData(items);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Electronics': return '💻';
      case 'Appliances': return '🔌';
      case 'Vehicles': return '🚗';
      case 'Industrial Equipment': return '⚙️';
      case 'Lifts': return '🛗';
      case 'Generators': return '⚡';
      case 'Water Purifiers': return '💧';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading Warranty Timeline...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Title block */}
      <div className="glass-panel" style={{
        marginBottom: '40px',
        padding: '30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8), rgba(10, 14, 23, 0.9))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Warranty Timeline</h1>
          <p style={{ color: 'var(--text-muted)' }}>Visual roadmap of your product warranties sorted by expiry date</p>
        </div>
        <Link to="/assets/add" className="btn btn-primary">➕ Register Asset</Link>
      </div>

      {timelineData.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No warranties recorded yet. Please add a warranty tracker to an asset.</p>
          <Link to="/assets" className="btn btn-primary">View Assets to Add Warranty</Link>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '40px', margin: '20px 0' }}>
          
          {/* Vertical axis line */}
          <div style={{
            position: 'absolute',
            left: '15px',
            top: '10px',
            bottom: '10px',
            width: '2px',
            background: 'linear-gradient(180deg, var(--primary), var(--accent), rgba(255,255,255,0.05))',
            borderRadius: '1px'
          }}></div>

          {/* Timeline Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {timelineData.map((item, idx) => {
              const isExpired = item.status === 'expired' || item.remainingDays <= 0;
              const isSoon = item.status === 'expires-soon' || (item.remainingDays > 0 && item.remainingDays <= 30);
              
              let statusText = 'Active';
              let statusColor = 'var(--success)';
              let glowColor = 'rgba(16, 185, 129, 0.2)';

              if (isExpired) {
                statusText = 'Expired';
                statusColor = 'var(--danger)';
                glowColor = 'rgba(239, 68, 68, 0.2)';
              } else if (isSoon) {
                statusText = 'Expires Soon';
                statusColor = 'var(--warning)';
                glowColor = 'rgba(245, 158, 11, 0.2)';
              }

              return (
                <div key={item.assetId} style={{ position: 'relative' }}>
                  
                  {/* Timeline point node */}
                  <div style={{
                    position: 'absolute',
                    left: '-32px',
                    top: '24px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: statusColor,
                    boxShadow: `0 0 10px ${statusColor}`,
                    border: '3px solid var(--bg-dark)',
                    zIndex: 1
                  }}></div>

                  <div className="glass-panel" style={{
                    padding: '24px',
                    borderRadius: '16px',
                    borderLeft: `5px solid ${statusColor}`,
                    transition: 'var(--transition-smooth)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ fontSize: '2.5rem' }}>{getCategoryIcon(item.category)}</span>
                        <div>
                          <h3 style={{ fontSize: '1.25rem' }}>{item.name}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {item.brand} • <span style={{ color: 'var(--primary)' }}>{item.category}</span>
                          </p>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: glowColor,
                          color: statusColor,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: `1px solid ${statusColor}40`,
                          marginBottom: '8px'
                        }}>{statusText}</span>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {isExpired ? (
                            <span style={{ color: 'var(--danger)' }}>Expired on {new Date(item.endDate).toLocaleDateString()}</span>
                          ) : (
                            <span>Expires: {new Date(item.endDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar showing remaining warranty */}
                    {!isExpired && (
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                          <span>Remaining Term</span>
                          <span style={{ color: statusColor, fontWeight: 'bold' }}>{item.remainingDays} Days Left</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${item.progress}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${statusColor}, #ffffff)`,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease-in-out'
                          }}></div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                      <Link to={`/assets/${item.assetId}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        View Details
                      </Link>
                      {!isExpired && (
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(item.brand + ' support renewal')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          🔗 Renew Portal
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};

export default WarrantyTimeline;
