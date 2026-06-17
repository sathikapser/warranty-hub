import React, { useState, useEffect } from 'react';
import api from '../api';

const Profile = ({ userInfo, onProfileUpdate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name);
      setEmail(userInfo.email);
      setPhone(userInfo.phone || '');
    }
  }, [userInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.put('/auth/profile', { name, email, phone, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      onProfileUpdate(data);
      setMessage('Profile updated successfully!');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '24px', fontSize: '2rem' }}>My Profile</h2>

        {message && (
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.15)', 
            border: '1px solid var(--success)', 
            color: '#34d399', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '0.875rem'
          }}>{message}</div>
        )}

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid var(--danger)', 
            color: '#ff6b6b', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '0.875rem'
          }}>{error}</div>
        )}

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
            <label className="form-label">Phone Number (For Twilio SMS alerts)</label>
            <input 
              type="text" 
              className="form-input" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +12345678901"
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password (Leave blank to keep current)</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
