import React, { useState, useEffect } from 'react';
import api from '../api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    smsEnabled: false,
    reminderDays: [30, 15, 7, 3, 1]
  });

  const fetchNotifications = async () => {
    try {
      const [notifRes, userRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/auth/profile').catch(() => ({ data: {} }))
      ]);

      setNotifications(notifRes.data);
      if (userRes.data?.notificationPreferences) {
        setPreferences(userRes.data.notificationPreferences);
      }
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

  const handleSavePreferences = async () => {
    try {
      await api.put('/auth/profile', { notificationPreferences: preferences });
      alert('Notification engine preferences saved!');
      setShowPreferences(false);
    } catch (err) {
      alert('Failed to save preferences');
    }
  };

  const toggleDay = (day) => {
    const current = preferences.reminderDays || [];
    if (current.includes(day)) {
      setPreferences({ ...preferences, reminderDays: current.filter(d => d !== day) });
    } else {
      setPreferences({ ...preferences, reminderDays: [...current, day].sort((a, b) => b - a) });
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.isRead;
    return n.type === filterType;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading Notification Center...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Notification Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Real-time warranty expiry milestones, maintenance reminders, and workspace broadcasts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowPreferences(!showPreferences)} className="btn btn-secondary btn-sm">
            ⚙️ Engine Rules
          </button>
          {notifications.some(n => !n.isRead) && (
            <button onClick={handleReadAll} className="btn btn-primary btn-sm">
              ✓ Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Rules / Preferences Panel */}
      {showPreferences && (
        <div className="glass-panel" style={{ marginBottom: '24px', border: '1px solid var(--border-glow)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>⚙️ Smart Expiry Rules & Notification Intervals</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Configure when the background intelligence worker should trigger in-app, email, and socket alerts:
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {[30, 15, 7, 3, 1].map(day => {
              const active = (preferences.reminderDays || []).includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: active ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: active ? '#00f2fe' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.84rem'
                  }}
                >
                  {active ? '☑' : '☐'} {day} Days Before
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.emailEnabled ?? true}
                onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
              />
              Send Email Digest Alerts
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.smsEnabled ?? false}
                onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
              />
              Send SMS Mobile Alerts
            </label>
          </div>

          <button onClick={handleSavePreferences} className="btn btn-primary btn-sm">
            Save Notification Rules
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'unread', label: 'Unread Only' },
          { key: 'warranty', label: '🛡️ Warranties' },
          { key: 'service', label: '🛠️ Services' },
          { key: 'insurance', label: '📄 Insurances' },
          { key: 'amc', label: '⚙️ AMCs' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`btn ${filterType === tab.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔔</div>
          <p style={{ color: 'var(--text-muted)' }}>No alerts found for this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map(n => {
            const isUnread = !n.isRead;
            return (
              <div
                key={n._id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: isUnread ? 'rgba(0, 242, 254, 0.04)' : 'var(--bg-card)',
                  borderLeft: isUnread ? '4px solid var(--primary)' : '1px solid var(--border-subtle)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-purple">
                      {(n.type || 'alert').toUpperCase()}
                    </span>
                    {isUnread && <span className="badge badge-expiring">New</span>}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: isUnread ? '#ffffff' : '#cbd5e1' }}>
                    {n.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '2px', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '6px' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      ✓ Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    title="Delete Notification"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
