import React, { useState, useEffect } from 'react';
import api from '../api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrative data. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    setMessage('');
    setError('');
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      setMessage(`User status updated to ${newStatus}`);
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this user? This cannot be undone.')) return;
    setMessage('');
    setError('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage('User deleted successfully');
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting user');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading admin dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{
        marginBottom: '30px',
        padding: '30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(162, 0, 255, 0.1), rgba(20, 27, 45, 0.8))',
        borderLeft: '4px solid var(--accent)'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Administrative Control Panel</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage users, track platform metrics, and oversee system compliance.</p>
      </div>

      {message && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
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

      {/* Admin stats */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '40px' }}>
        <div className="glass-panel">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL USERS</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--primary)' }}>{stats.totalUsers}</h2>
        </div>
        <div className="glass-panel">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL SYSTEM ASSETS</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--secondary)' }}>{stats.totalAssets}</h2>
        </div>
        <div className="glass-panel">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ALERTS DISPATCHED</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--accent)' }}>{stats.notificationsSent}</h2>
        </div>
      </div>

      {/* User Management List */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>User Management Directory</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: u.status === 'suspended' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: u.status === 'suspended' ? 'var(--danger)' : 'var(--success)'
                    }}>{u.status.toUpperCase()}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleToggleStatus(u._id, u.status)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        {u.status === 'suspended' ? '✓ Unsuspend' : '⛔ Suspend'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u._id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
