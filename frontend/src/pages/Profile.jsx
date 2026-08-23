import React, { useState, useEffect } from 'react';
import api from '../api';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Profile = ({ userInfo, onProfileUpdate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');

  // Notification Preference State
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState([7, 1]);

  // Calendar Sync State
  const [googleSynced, setGoogleSynced] = useState(false);
  const [outlookSynced, setOutlookSynced] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || '');
      setEmail(userInfo.email || '');
      setPhone(userInfo.phone || '');
      setAvatar(userInfo.avatar || '');
      
      if (userInfo.notificationPreferences) {
        setEmailEnabled(userInfo.notificationPreferences.emailEnabled ?? true);
        setSmsEnabled(userInfo.notificationPreferences.smsEnabled ?? false);
        setReminderDays(userInfo.notificationPreferences.reminderDays || [7, 1]);
      }
      if (userInfo.calendarIntegration) {
        setGoogleSynced(userInfo.calendarIntegration.googleSynced ?? false);
        setOutlookSynced(userInfo.calendarIntegration.outlookSynced ?? false);
      }
    }
  }, [userInfo]);

  const handleReminderDayToggle = (day) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.put('/auth/profile', { 
        name, 
        email, 
        phone, 
        avatar,
        password: password ? password : undefined,
        notificationPreferences: { emailEnabled, smsEnabled, reminderDays },
        calendarIntegration: { googleSynced, outlookSynced }
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      onProfileUpdate(data);
      setMessage('Profile and preferences updated successfully!');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLinked = (data) => {
    const updated = data.user || data;
    localStorage.setItem('userInfo', JSON.stringify(updated));
    onProfileUpdate(updated);
    setMessage('Google account successfully linked and verified!');
  };

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Account & Intelligence Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
          Manage your verified identity, multi-channel alerts, and calendar synchronizations
        </p>
      </div>

      {message && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.14)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          padding: '14px 18px',
          borderRadius: '14px',
          marginBottom: '24px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.14)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          padding: '14px 18px',
          borderRadius: '14px',
          marginBottom: '24px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Account Details Form */}
        <div className="glass-panel-elevated" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: userInfo?.isGoogleVerified ? '3px solid #4285F4' : '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              />
            ) : (
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 242, 254, 0.3)'
              }}>
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{name || 'User Profile'}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                <span className="badge badge-purple">{userInfo?.role || 'Member'}</span>
                {userInfo?.isGoogleVerified && (
                  <span className="badge badge-google">✓ Google Verified</span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (For SMS Deadlines)</label>
              <input 
                type="text" 
                className="form-input" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Image URL</label>
              <input 
                type="text" 
                className="form-input" 
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (Leave blank to keep unchanged)</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px', padding: '13px' }}>
              {loading ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Right Column: Google Verification & Integrations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Google Verification Status Card */}
          <div className="glass-panel" style={{
            border: userInfo?.isGoogleVerified ? '1px solid rgba(66, 133, 244, 0.4)' : '1px solid var(--border-subtle)',
            background: userInfo?.isGoogleVerified ? 'rgba(66, 133, 244, 0.06)' : 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="22" height="22" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Google Identity Verification</h3>
              </div>
              {userInfo?.isGoogleVerified ? (
                <span className="badge badge-active">✓ Connected & Verified</span>
              ) : (
                <span className="badge badge-expiring">Unlinked</span>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '16px' }}>
              {userInfo?.isGoogleVerified
                ? 'Your account is cryptographically verified via Google OAuth. Fast login and automated Google Calendar sync are enabled.'
                : 'Link your Google account to unlock instant 1-tap sign in and seamless Google Calendar event synchronization.'}
            </p>

            {!userInfo?.isGoogleVerified && (
              <GoogleAuthButton
                text="Link & Verify Google Account"
                isLinking={true}
                onSuccess={handleGoogleLinked}
                onError={(err) => setError(err)}
              />
            )}
          </div>

          {/* Smart Reminders Preferences */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '12px', fontWeight: 700 }}>🔔 Smart Alerts & Reminders</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '18px' }}>
              Configure proactive multi-channel alerts before any asset warranty expires.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={emailEnabled} 
                  onChange={(e) => setEmailEnabled(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#00f2fe' }}
                />
                <span>Email Notifications (Automated alerts to {email})</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', opacity: !phone ? 0.6 : 1 }}>
                <input 
                  type="checkbox" 
                  checked={smsEnabled} 
                  onChange={(e) => setSmsEnabled(e.target.checked)} 
                  disabled={!phone}
                  style={{ width: '18px', height: '18px', accentColor: '#00f2fe' }}
                />
                <span>SMS Expiry Alerts {!phone && '(Enter phone number above)'}</span>
              </label>
            </div>

            <h4 style={{ fontSize: '0.88rem', marginBottom: '10px', color: 'var(--text-muted)' }}>Proactive Expiration Thresholds:</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[30, 15, 7, 1].map(day => (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleReminderDayToggle(day)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: reminderDays.includes(day) ? '1px solid #00f2fe' : '1px solid var(--border-subtle)',
                    backgroundColor: reminderDays.includes(day) ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255,255,255,0.04)',
                    color: reminderDays.includes(day) ? '#00f2fe' : 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {day} Day{day > 1 ? 's' : ''} Prior
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Sync Integrations */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '12px', fontWeight: 700 }}>📅 Calendar Integrations</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '16px' }}>
              Sync warranty milestones directly as all-day events on your external calendar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>💙</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Google Calendar</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Real-time deadline sync</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleSynced(!googleSynced)}
                  className={`btn ${googleSynced ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                >
                  {googleSynced ? '✓ Synced' : 'Connect'}
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🧡</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Microsoft Outlook</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>iCal feed integration</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOutlookSynced(!outlookSynced)}
                  className={`btn ${outlookSynced ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                >
                  {outlookSynced ? '✓ Synced' : 'Connect'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
