import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../context/SocketContext';

const Navbar = ({ userInfo, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('wh_theme') === 'light';
  });

  const { isConnected } = useSocket() || {};

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('wh_theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  const fetchNotifications = async () => {
    if (!userInfo) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.slice(0, 6));
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error loading nav notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
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
    <nav className="nav-glass-container" style={{
      margin: '16px 20px',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '20px',
      position: 'sticky',
      top: '16px',
      zIndex: 100,
      background: 'rgba(10, 16, 32, 0.75)',
      backdropFilter: 'blur(28px) saturate(200%)',
      WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.35)'
    }}>
      {/* Brand & Live Connection Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #00f2fe, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 4px 16px rgba(0, 242, 254, 0.4)'
          }}>
            🛡️
          </div>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}>
            WarrantyHub <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '7px',
              background: 'rgba(0, 242, 254, 0.15)',
              color: '#00f2fe',
              WebkitTextFillColor: '#00f2fe',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              verticalAlign: 'middle',
              letterSpacing: '0.02em'
            }}>2.5 PRO</span>
          </span>
        </Link>

        {/* Real-Time Sync Pill */}
        {userInfo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '0.74rem',
            color: isConnected ? '#10b981' : '#f87171',
            fontWeight: 600,
            backdropFilter: 'blur(8px)'
          }}>
            <span className={isConnected ? 'pulse-green' : ''} style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#ef4444'
            }} />
            <span>{isConnected ? 'Real-Time Sync' : 'Reconnecting...'}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        {userInfo && (
          <div className="nav-tabs-desktop" style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <Link to="/dashboard" className={isActive('/dashboard') ? 'nav-link active' : 'nav-link'}>Dashboard</Link>
            <Link to="/assets" className={isActive('/assets') ? 'nav-link active' : 'nav-link'}>Assets</Link>
            <Link to="/services" className={isActive('/services') ? 'nav-link active' : 'nav-link'}>Services</Link>
            <Link to="/expenses" className={isActive('/expenses') ? 'nav-link active' : 'nav-link'}>Expenses</Link>
            <Link to="/ai-assistant" className={isActive('/ai-assistant') ? 'nav-link active' : 'nav-link'}>AI Intelligence</Link>
            <Link to="/vault" className={isActive('/vault') ? 'nav-link active' : 'nav-link'}>Vault</Link>
            <Link to="/workspace" className={isActive('/workspace') ? 'nav-link active' : 'nav-link'}>Family</Link>
            <Link to="/timeline" className={isActive('/timeline') ? 'nav-link active' : 'nav-link'}>Timeline</Link>
            {userInfo.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin') ? 'nav-link active' : 'nav-link'} style={{ color: 'var(--accent)' }}>Admin</Link>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isLightMode ? 'Switch to Aurora Obsidian Dark' : 'Switch to Frosted Quartz Light'}
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: '1rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
        >
          {isLightMode ? '🌙' : '✨'}
        </button>

        {userInfo ? (
          <>
            {/* Notification Bell Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.07)', 
                  border: '1px solid var(--border-subtle)', 
                  cursor: 'pointer', 
                  position: 'relative',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#ffffff',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
                  }}>{unreadCount}</span>
                )}
              </button>

              {showDropdown && (
                <div className="glass-panel-elevated" style={{
                  position: 'absolute',
                  right: 0,
                  top: '52px',
                  width: '350px',
                  padding: '18px',
                  zIndex: 200,
                  borderRadius: '18px',
                  maxHeight: '390px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Live Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleReadAll} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>All clear! No new notifications.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} style={{ 
                        padding: '10px 0', 
                        borderBottom: '1px solid rgba(255,255,255,0.06)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '3px',
                        opacity: n.isRead ? 0.65 : 1 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: n.isRead ? 'var(--text-main)' : 'var(--primary)' }}>{n.title}</span>
                          {!n.isRead && (
                            <button onClick={() => handleMarkAsRead(n._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{n.message}</p>
                      </div>
                    ))
                  )}
                  <Link to="/notifications" onClick={() => setShowDropdown(false)} style={{ display: 'block', textAlign: 'center', fontSize: '0.84rem', marginTop: '14px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                    See all notifications →
                  </Link>
                </div>
              )}
            </div>

            {/* User Profile Pill with Google Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                {userInfo.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: userInfo.isGoogleVerified ? '2px solid #4285F4' : '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: userInfo.isGoogleVerified ? '0 0 10px rgba(66, 133, 244, 0.4)' : 'none'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'white',
                    fontSize: '0.88rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {userInfo.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.2 }}>
                    {userInfo.name}
                  </span>
                  {userInfo.isGoogleVerified && (
                    <span style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 600 }}>
                      ✓ Google Verified
                    </span>
                  )}
                </div>
              </Link>
              <button onClick={onLogout} className="btn btn-secondary btn-sm" style={{ padding: '7px 13px', fontSize: '0.8rem' }}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        )}
      </div>

      <style>{`
        .nav-link {
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.88rem;
          padding: 6px 12px;
          border-radius: 10px;
          transition: var(--transition-smooth);
          text-decoration: none;
        }
        .nav-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .nav-link.active {
          color: #00f2fe;
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.25);
          font-weight: 600;
        }
        @media (max-width: 1024px) {
          .nav-tabs-desktop {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
