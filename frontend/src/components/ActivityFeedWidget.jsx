import React, { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';

const ActivityFeedWidget = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { latestActivity } = useSocket();

  const fetchActivities = async () => {
    try {
      const { data } = await api.get('/activity');
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Prepend live incoming activities from Socket.IO
  useEffect(() => {
    if (latestActivity) {
      setActivities(prev => [latestActivity, ...prev.slice(0, 19)]);
    }
  }, [latestActivity]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'asset_added': return '📦';
      case 'asset_updated': return '✏️';
      case 'asset_deleted': return '🗑️';
      case 'document_uploaded': return '📄';
      case 'warranty_updated': return '🛡️';
      case 'service_created': return '🛠️';
      case 'service_status_changed': return '🔄';
      case 'expense_added': return '💰';
      case 'claim_drafted': return '📝';
      case 'member_joined': return '👤';
      default: return '⚡';
    }
  };

  const formatRelativeTime = (timestamp) => {
    const diff = (new Date() - new Date(timestamp)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulse-green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Live Activity Feed</h3>
        </div>
        <button onClick={fetchActivities} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
          Refresh
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading activity stream...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No recent activity logged yet.
          </div>
        ) : (
          activities.map((item, idx) => (
            <div
              key={item._id || idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                fontSize: '0.85rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>{getActionIcon(item.action)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.userName || 'Member'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                  {item.title}
                </div>
                {item.details && (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem', marginTop: '2px' }}>
                    {item.details}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeedWidget;
