import React, { useState, useEffect } from 'react';
import api from '../api';

const FamilyWorkspace = ({ userInfo }) => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/family/members');
      setWorkspace(data);
    } catch (err) {
      console.error('Error fetching family details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/family/invite', {
        email: inviteEmail,
        name: inviteName,
        role: inviteRole
      });
      setMessage(data.message);
      setInviteEmail('');
      setInviteName('');
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error inviting member');
    }
  };

  const handleRemove = async (email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the workspace?`)) return;
    setError('');
    setMessage('');
    
    try {
      const { data } = await api.delete(`/family/remove/${email}`);
      setMessage(data.message);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing member');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading Family Workspace...</h2>
      </div>
    );
  }

  // A user is the owner if they don't have familyWorkspaceOwnerId set
  const isOwner = !userInfo.familyWorkspaceOwnerId;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Workspace Banner */}
      <div className="glass-panel" style={{
        marginBottom: '30px',
        padding: '30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8), rgba(10, 14, 23, 0.9))'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Family Workspace</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Collaborative asset sharing. Everyone linked to this workspace has shared access to all assets and trackers!
        </p>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* Workspace Members list */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Workspace Members</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* Owner Display */}
            {workspace.owner && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#fff' }}>{workspace.owner.name} (Owner)</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{workspace.owner.email}</span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--accent-glow)', color: '#c084fc', padding: '2px 8px', borderRadius: '12px' }}>Workspace Owner</span>
              </div>
            )}

            {/* List of other linked members */}
            {workspace.invitedMembers && workspace.invitedMembers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No other family members in this workspace yet.</p>
            ) : (
              workspace.invitedMembers.map((m, idx) => {
                // Check if they are registered
                const isRegistered = workspace.registeredMembers.some(rm => rm.email === m.email);
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>{m.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        backgroundColor: isRegistered ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', 
                        color: isRegistered ? 'var(--success)' : 'var(--warning)', 
                        padding: '2px 8px', 
                        borderRadius: '12px' 
                      }}>
                        {isRegistered ? 'Linked' : 'Pending Link'}
                      </span>
                      {isOwner && (
                        <button 
                          onClick={() => handleRemove(m.email)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

          </div>
        </div>

        {/* Invite Member form */}
        {isOwner ? (
          <div className="glass-panel" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Invite Family Member</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Add family members to sync asset tracking. They can view, edit, and receive notifications for all your assets.
            </p>

            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Member Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family-member@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Workspace Role</label>
                <select 
                  className="form-input" 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{ appearance: 'none', background: 'var(--bg-input)' }}
                >
                  <option value="member" style={{ background: '#0d1527' }}>Member (Full View + CRUD)</option>
                  <option value="admin" style={{ background: '#0d1527' }}>Co-Owner (Full View + CRUD + Invites)</option>
                </select>
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '10px' }}>
                Send Invite Link
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-panel" style={{ height: 'fit-content', borderLeft: '4px solid var(--info)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Workspace Member Portal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              You are currently connected to the workspace owned by **{workspace.owner.name}**. 
              You can edit assets and trackers, but only the owner can invite new members or manage the team structure.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default FamilyWorkspace;
