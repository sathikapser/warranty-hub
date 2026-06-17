import React, { useState, useEffect } from 'react';
import api from '../api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      await api.put('/notifications/read/all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading Notifications...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>All Notifications</h2>
        {notifications.some(n => !n.isRead) && (
          <button onClick={handleReadAll} className="btn btn-secondary">✓ Mark All Read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No notifications found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {notifications.map(n => (
            <div key={n._id} className="glass-panel" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: n.isRead ? 'var(--bg-card)' : 'rgba(0, 242, 254, 0.03)',
              borderLeft: n.isRead ? '1px solid var(--border-color)' : '4px solid var(--primary)',
              padding: '20px'
            }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  color: n.type === 'warranty' ? 'var(--success)' : n.type === 'service' ? 'var(--primary)' : n.type === 'insurance' ? 'var(--secondary)' : 'var(--warning)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>{n.type} Alert</span>
                <h3 style={{ fontSize: '1.1rem', margin: '6px 0', color: n.isRead ? 'var(--text-muted)' : '#ffffff' }}>{n.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.4 }}>{n.message}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', marginTop: '8px' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!n.isRead && (
                  <button 
                    onClick={() => handleMarkAsRead(n._id)} 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    Mark Read
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(n._id)} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
