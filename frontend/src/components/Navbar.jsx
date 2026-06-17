import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const Navbar = ({ userInfo, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!userInfo) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.slice(0, 5)); // Show top 5
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error loading nav notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [userInfo]);

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

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav-container glass-panel" style={{
      margin: '20px',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '20px',
      position: 'sticky',
      top: '20px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>WarrantyHub</span>
        </Link>
        
        {userInfo && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/dashboard" className={isActive('/dashboard') ? 'nav-link active' : 'nav-link'}>Dashboard</Link>
            <Link to="/assets" className={isActive('/assets') ? 'nav-link active' : 'nav-link'}>My Assets</Link>
            <Link to="/vault" className={isActive('/vault') ? 'nav-link active' : 'nav-link'}>Document Vault</Link>
            <Link to="/workspace" className={isActive('/workspace') ? 'nav-link active' : 'nav-link'}>Family Workspace</Link>
            {userInfo.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin') ? 'nav-link active' : 'nav-link'} style={{ color: 'var(--accent)' }}>Admin Panel</Link>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {userInfo ? (
          <>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="nav-btn"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  position: 'relative',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                  }}>{unreadCount}</span>
                )}
              </button>

              {showDropdown && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  right: 0,
                  top: '45px',
                  width: '320px',
                  padding: '16px',
                  zIndex: 200,
                  borderRadius: '12px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  maxHeight: '350px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleReadAll} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} style={{ 
                        padding: '10px 0', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px',
                        opacity: n.isRead ? 0.6 : 1 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: n.isRead ? 'var(--text-main)' : 'var(--primary)' }}>{n.title}</span>
                          {!n.isRead && (
                            <button onClick={() => handleMarkAsRead(n._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</p>
                      </div>
                    ))
                  )}
                  <Link to="/notifications" onClick={() => setShowDropdown(false)} style={{ display: 'block', textAlign: 'center', fontSize: '0.85rem', marginTop: '12px', color: 'var(--secondary)' }}>See all notifications</Link>
                </div>
              )}
            </div>

            {/* Profile & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '0.85rem'
                }}>
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{userInfo.name}</span>
              </Link>
              <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Logout</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Register</Link>
          </div>
        )}
      </div>

      <style>{`
        .nav-link {
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.95rem;
          padding: 8px 12px;
          border-radius: 8px;
          transition: var(--transition-smooth);
        }
        .nav-link:hover, .nav-link.active {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }
        .nav-link.active {
          border-bottom: 2px solid var(--primary);
          border-radius: 8px 8px 0 0;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
