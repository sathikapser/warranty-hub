import React, { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';

const STAGES = [
  { key: 'created', label: 'Lodged', icon: '📝' },
  { key: 'assigned', label: 'Assigned', icon: '👤' },
  { key: 'technician_en_route', label: 'En Route', icon: '🚚' },
  { key: 'in_service', label: 'In Service', icon: '⚙️' },
  { key: 'completed', label: 'Completed', icon: '✅' }
];

const ServicesHub = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'preventive', 'history'
  const [serviceRequests, setServiceRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Service Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    assetId: '',
    issueTitle: '',
    issueDescription: '',
    urgency: 'medium',
    serviceProvider: '',
    scheduledDate: '',
    estimatedCost: ''
  });

  // Advance Status Modal
  const [statusModalItem, setStatusModalItem] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    technicianName: '',
    technicianPhone: '',
    actualCost: '',
    note: ''
  });

  const { socket } = useSocket() || {};

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, assetsRes] = await Promise.all([
        api.get('/service-requests'),
        api.get('/assets')
      ]);

      setServiceRequests(reqRes.data);
      setAssets(assetsRes.data);

      // Fetch service logs across all assets
      const logs = [];
      for (const a of assetsRes.data) {
        try {
          const { data: sl } = await api.get(`/services/${a._id}`);
          sl.forEach(s => logs.push({ ...s, asset: a }));
        } catch (e) {}
      }
      setServiceLogs(logs.sort((a, b) => new Date(b.lastServiceDate || 0) - new Date(a.lastServiceDate || 0)));
    } catch (err) {
      console.error('Error loading services data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time service updates
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (newReq) => {
      setServiceRequests(prev => [newReq, ...prev]);
    };

    const handleStatusChanged = (data) => {
      setServiceRequests(prev => prev.map(sr => sr._id === data.serviceRequest?._id ? data.serviceRequest : sr));
    };

    socket.on('service_request_created', handleNewRequest);
    socket.on('service_status_changed', handleStatusChanged);

    return () => {
      socket.off('service_request_created', handleNewRequest);
      socket.off('service_status_changed', handleStatusChanged);
    };
  }, [socket]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/service-requests', requestForm);
      setShowRequestModal(false);
      setRequestForm({
        assetId: '',
        issueTitle: '',
        issueDescription: '',
        urgency: 'medium',
        serviceProvider: '',
        scheduledDate: '',
        estimatedCost: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create service request');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalItem) return;
    try {
      await api.put(`/service-requests/${statusModalItem._id}/status`, statusForm);
      setStatusModalItem(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update service status');
    }
  };

  const getStageIndex = (status) => {
    return STAGES.findIndex(s => s.key === status);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Service & Maintenance Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Multi-stage technician lifecycle tracking, preventive care schedules, and historical maintenance logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowRequestModal(true)} className="btn btn-primary">
            + Lodge Service Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('requests')}
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          🚀 Active Service Requests ({serviceRequests.filter(r => r.status !== 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab('preventive')}
          className={`btn ${activeTab === 'preventive' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          🗓️ Scheduled Preventive Maintenance
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          📜 Complete Service History ({serviceLogs.length})
        </button>
      </div>

      {/* Tab 1: Active Service Requests & Lifecycle Progression */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {serviceRequests.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛠️</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Active Service Requests</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                All household appliances are operating smoothly. Need repair or warranty service?
              </p>
              <button onClick={() => setShowRequestModal(true)} className="btn btn-primary">
                + Create Service Request
              </button>
            </div>
          ) : (
            serviceRequests.map((req) => {
              const currentStageIdx = getStageIndex(req.status);
              const isCompleted = req.status === 'completed';

              return (
                <div key={req._id} className="glass-panel" style={{ padding: '22px' }}>
                  {/* Top Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-purple">{req.requestNumber}</span>
                        <span className={`badge ${req.urgency === 'urgent' ? 'badge-expired' : req.urgency === 'high' ? 'badge-expiring' : 'badge-info'}`}>
                          {req.urgency} Priority
                        </span>
                        {req.isUnderWarranty && (
                          <span className="badge badge-active">Under Warranty</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '8px' }}>
                        {req.issueTitle}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Asset: <strong>{req.assetId?.brand} {req.assetId?.assetName}</strong> • Provider: {req.serviceProvider}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isCompleted && (
                        <button
                          onClick={() => {
                            setStatusModalItem(req);
                            setStatusForm({
                              status: STAGES[Math.min(STAGES.length - 1, currentStageIdx + 1)]?.key || 'in_service',
                              technicianName: req.technicianName || '',
                              technicianPhone: req.technicianPhone || '',
                              actualCost: req.actualCost || '',
                              note: ''
                            });
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          ⚡ Advance Lifecycle Status
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual Stage Lifecycle Tracker */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
                    gap: '8px',
                    margin: '20px 0',
                    position: 'relative'
                  }}>
                    {STAGES.map((stage, idx) => {
                      const isPast = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <div
                          key={stage.key}
                          style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            borderRadius: '12px',
                            background: isCurrent
                              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(139, 92, 246, 0.2))'
                              : isPast
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isCurrent ? '#00f2fe' : isPast ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{stage.icon}</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#00f2fe' : isPast ? '#10b981' : 'var(--text-dim)' }}>
                            {stage.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Technician & Scheduling Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '0.84rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Technician: </span>
                      <strong>{req.technicianName || 'To be assigned'}</strong>
                      {req.technicianPhone && <span style={{ color: 'var(--text-muted)' }}> ({req.technicianPhone})</span>}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Scheduled: </span>
                      <strong>{req.scheduledDate ? new Date(req.scheduledDate).toLocaleDateString() : 'Pending appointment'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Est. Cost: </span>
                      <strong>{req.isUnderWarranty ? 'Free (Under Warranty)' : `₹${req.estimatedCost?.toLocaleString() || 0}`}</strong>
                    </div>
                  </div>

                  {/* Issue Description */}
                  <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '12px', lineHeight: 1.5 }}>
                    <strong>Issue Details:</strong> {req.issueDescription}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Scheduled Preventive Maintenance */}
      {activeTab === 'preventive' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Upcoming Preventive Schedules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assets.filter(a => a.category === 'Appliances' || a.category === 'Vehicles' || a.category === 'Water Purifiers' || a.category === 'Generators').map(asset => (
              <div
                key={asset._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 600 }}>{asset.brand} {asset.assetName}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Category: {asset.category} • Location: {asset.roomOrLocation || 'Household'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRequestModal(true);
                    setRequestForm(prev => ({
                      ...prev,
                      assetId: asset._id,
                      issueTitle: `Routine Preventive Maintenance: ${asset.brand} ${asset.assetName}`,
                      issueDescription: 'Quarterly filter cleaning, diagnostic checkup, and component performance inspection.',
                      urgency: 'low'
                    }));
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  🛠️ Schedule Maintenance
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Complete Service Logs */}
      {activeTab === 'history' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Service & Repair Ledger ({serviceLogs.length})</h3>
          {serviceLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No historical service records found.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Service Date</th>
                  <th>Technician / Provider</th>
                  <th>Cost</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {serviceLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <strong>{log.asset?.brand} {log.asset?.assetName}</strong>
                    </td>
                    <td>{log.lastServiceDate ? new Date(log.lastServiceDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{log.provider || 'Authorized Tech'}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>₹{log.cost?.toLocaleString() || '0'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.details || 'Routine servicing'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Lodge New Service Request</h3>
            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Asset *</label>
                <select
                  required
                  value={requestForm.assetId}
                  onChange={(e) => setRequestForm({ ...requestForm, assetId: e.target.value })}
                  className="form-select"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a._id} value={a._id}>{a.brand} {a.assetName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refrigerator cooling defect / AC Gas leak"
                  value={requestForm.issueTitle}
                  onChange={(e) => setRequestForm({ ...requestForm, issueTitle: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue in detail..."
                  value={requestForm.issueDescription}
                  onChange={(e) => setRequestForm({ ...requestForm, issueDescription: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Urgency Priority</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                    className="form-select"
                  >
                    <option value="low">Low (Routine)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent (Breakdown)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input
                    type="date"
                    value={requestForm.scheduledDate}
                    onChange={(e) => setRequestForm({ ...requestForm, scheduledDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Service Provider / Center</label>
                <input
                  type="text"
                  placeholder="e.g. Samsung Authorized Care / Local Tech"
                  value={requestForm.serviceProvider}
                  onChange={(e) => setRequestForm({ ...requestForm, serviceProvider: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Status Modal */}
      {statusModalItem && (
        <div className="modal-overlay" onClick={() => setStatusModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Advance Lifecycle Status</h3>
            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select New Status Stage</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="form-select"
                >
                  {STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Technician Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh K."
                    value={statusForm.technicianName}
                    onChange={(e) => setStatusForm({ ...statusForm, technicianName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Technician Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={statusForm.technicianPhone}
                    onChange={(e) => setStatusForm({ ...statusForm, technicianPhone: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Actual Cost Paid (₹)</label>
                <input
                  type="number"
                  placeholder="0 (If free under warranty)"
                  value={statusForm.actualCost}
                  onChange={(e) => setStatusForm({ ...statusForm, actualCost: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Update Note / Resolution</label>
                <input
                  type="text"
                  placeholder="e.g. Technician arrived, parts replaced under warranty"
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setStatusModalItem(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesHub;
