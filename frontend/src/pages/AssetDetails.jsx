import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core Data State
  const [asset, setAsset] = useState(null);
  const [health, setHealth] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState('warranty');

  // Sub-modules Forms/Data state
  const [warranty, setWarranty] = useState({});
  const [services, setServices] = useState([]);
  const [insurance, setInsurance] = useState({});
  const [amc, setAmc] = useState({});
  const [documents, setDocuments] = useState([]);

  // Sub-modules Edit States
  const [warrantyForm, setWarrantyForm] = useState({ startDate: '', endDate: '', isExtended: false, provider: '' });
  const [serviceForm, setServiceForm] = useState({ lastServiceDate: '', nextServiceDate: '', frequencyMonths: 6, provider: '', cost: '', details: '' });
  const [insuranceForm, setInsuranceForm] = useState({ provider: '', policyNumber: '', expiryDate: '', cost: '' });
  const [amcForm, setAmcForm] = useState({ provider: '', startDate: '', endDate: '', cost: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('bill');
  const [documentName, setDocumentName] = useState('');

  const [message, setMessage] = useState('');

  const fetchAllDetails = async () => {
    try {
      // 1. Fetch Asset General Specs
      const { data: assetData } = await api.get(`/assets/${id}`);
      setAsset(assetData);

      // 2. Fetch Health Metric
      const { data: healthData } = await api.get(`/assets/${id}/health`);
      setHealth(healthData);

      // 3. Fetch QR Code Profile
      const { data: qrData } = await api.get(`/assets/${id}/qr`);
      setQrCodeUrl(qrData.qrCodeUrl);

      // 4. Fetch Warranty
      const { data: wData } = await api.get(`/trackers/warranties/${id}`);
      setWarranty(wData || {});
      if (wData && wData.startDate) {
        setWarrantyForm({
          startDate: wData.startDate.split('T')[0],
          endDate: wData.endDate.split('T')[0],
          isExtended: wData.isExtended || false,
          provider: wData.provider || ''
        });
      }

      // 5. Fetch Service History
      const { data: sData } = await api.get(`/trackers/services/${id}`);
      setServices(sData || []);

      // 6. Fetch Insurance
      const { data: insData } = await api.get(`/trackers/insurance/${id}`);
      setInsurance(insData || {});
      if (insData && insData.provider) {
        setInsuranceForm({
          provider: insData.provider,
          policyNumber: insData.policyNumber,
          expiryDate: insData.expiryDate.split('T')[0],
          cost: insData.cost || ''
        });
      }

      // 7. Fetch AMC details
      const { data: amcData } = await api.get(`/trackers/amc/${id}`);
      setAmc(amcData || {});
      if (amcData && amcData.provider) {
        setAmcForm({
          provider: amcData.provider,
          startDate: amcData.startDate.split('T')[0],
          endDate: amcData.endDate.split('T')[0],
          cost: amcData.cost || ''
        });
      }

      // 8. Fetch Documents list
      const { data: docData } = await api.get(`/documents/asset/${id}`);
      setDocuments(docData || []);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDetails();
  }, [id]);

  const handleUpdateWarranty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trackers/warranties', { assetId: id, ...warrantyForm });
      setMessage('Warranty updated successfully');
      fetchAllDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServiceLog = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trackers/services', {
        assetId: id,
        lastServiceDate: serviceForm.lastServiceDate || null,
        nextServiceDate: serviceForm.nextServiceDate || null,
        frequencyMonths: parseInt(serviceForm.frequencyMonths) || 0,
        provider: serviceForm.provider,
        cost: serviceForm.cost ? parseFloat(serviceForm.cost) : 0,
        details: serviceForm.details
      });
      setMessage('Service log added!');
      setServiceForm({ lastServiceDate: '', nextServiceDate: '', frequencyMonths: 6, provider: '', cost: '', details: '' });
      fetchAllDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (srvId) => {
    if (!window.confirm('Delete this service record?')) return;
    try {
      await api.delete(`/trackers/services/${srvId}`);
      fetchAllDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInsurance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trackers/insurance', {
        assetId: id,
        provider: insuranceForm.provider,
        policyNumber: insuranceForm.policyNumber,
        expiryDate: insuranceForm.expiryDate,
        cost: insuranceForm.cost ? parseFloat(insuranceForm.cost) : 0
      });
      setMessage('Insurance policy updated!');
      fetchAllDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAMC = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trackers/amc', {
        assetId: id,
        provider: amcForm.provider,
        startDate: amcForm.startDate,
        endDate: amcForm.endDate,
        cost: amcForm.cost ? parseFloat(amcForm.cost) : 0
      });
      setMessage('AMC contract updated!');
      fetchAllDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!documentFile) return;
    const formData = new FormData();
    formData.append('file', documentFile);
    formData.append('assetId', id);
    formData.append('documentType', documentType);
    formData.append('fileName', documentName || documentFile.name);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Document uploaded successfully!');
      setDocumentFile(null);
      setDocumentName('');
      fetchAllDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      fetchAllDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAsset = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this asset? This deletes all warranties, services, and vault documents.')) return;
    try {
      await api.delete(`/assets/${id}`);
      navigate('/assets');
    } catch (err) {
      console.error(err);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading asset profile...</h2>
      </div>
    );
  }

  // Combine warranty events and service logs for the Maintenance Timeline
  const timelineEvents = [];
  if (asset.purchaseDate) {
    timelineEvents.push({
      date: new Date(asset.purchaseDate),
      title: 'Asset Purchased',
      description: `Bought for $${(asset.purchasePrice || 0).toLocaleString()} • ${asset.brand}`,
      icon: '🛒'
    });
  }
  if (warranty && warranty.startDate) {
    timelineEvents.push({
      date: new Date(warranty.startDate),
      title: 'Warranty Commenced',
      description: `Provider: ${warranty.provider || 'OEM'}`,
      icon: '🛡️'
    });
    timelineEvents.push({
      date: new Date(warranty.endDate),
      title: 'Warranty Ends',
      description: `Status: ${warranty.status}`,
      icon: '⚠️'
    });
  }
  services.forEach(s => {
    if (s.lastServiceDate) {
      timelineEvents.push({
        date: new Date(s.lastServiceDate),
        title: 'Service Completed',
        description: `${s.provider ? `Provider: ${s.provider} | ` : ''}Cost: $${s.cost || 0} • Details: ${s.details || 'General servicing'}`,
        icon: '🔧'
      });
    }
  });
  // Sort timeline oldest to newest
  timelineEvents.sort((a, b) => a.date - b.date);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px',
        borderRadius: '20px'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {asset.category}
          </span>
          <h1 style={{ fontSize: '2rem', marginTop: '6px' }}>{asset.assetName}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {asset.brand} • Model: {asset.modelNumber || 'N/A'} • Serial: {asset.serialNumber || 'N/A'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/assets')}>Back</button>
          <button className="btn btn-accent" onClick={handleDeleteAsset} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
            Delete
          </button>
        </div>
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

      {/* Main Grid: Info Sidebar + Tab Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Sidebar: Health & QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Health Score Panel */}
          <div className="glass-panel" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: 600 }}>ASSET HEALTH INDEX</h3>
            
            {health && (
              <div>
                <div style={{
                  fontSize: '3.5rem',
                  fontWeight: 800,
                  color: getHealthColor(health.healthScore),
                  textShadow: `0 0 20px ${getHealthColor(health.healthScore)}44`,
                  lineHeight: '1'
                }}>
                  {health.healthScore}<span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/100</span>
                </div>
                
                <p style={{
                  fontSize: '0.95rem',
                  marginTop: '15px',
                  fontWeight: 600,
                  color: health.healthScore >= 80 ? 'var(--success)' : health.healthScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                }}>
                  {health.healthScore >= 80 ? 'Excellent Status' : health.healthScore >= 50 ? 'Moderate Alert' : 'Critical Maintenance Required'}
                </p>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    <span>Asset Age:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{health.details.ageYears} Yrs</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    <span>Warranty Status:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{health.details.warrantyStatus}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    <span>Repair Incidents:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{health.details.repairsCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Asset Profile */}
          <div className="glass-panel" style={{ textAlign: 'center', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: 600 }}>QR ASSET PROFILE</h3>
            {qrCodeUrl ? (
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <img src={qrCodeUrl} alt="Asset QR Code" style={{ width: '150px', height: '150px', display: 'block' }} />
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generating QR Code...</p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '12px', lineHeight: 1.4 }}>
              Scan QR code to instantly verify asset warranty status and service records.
            </p>
          </div>

        </div>

        {/* Tabbed Content Panel */}
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          
          {/* Tab Headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
            {['warranty', 'services', 'insurance', 'amc', 'documents', 'timeline'].map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); setMessage(''); }}
                style={{
                  flex: 1,
                  padding: '16px 12px',
                  background: 'none',
                  border: 'none',
                  color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                  fontWeight: activeTab === tab ? '700' : '500',
                  fontSize: '0.9rem',
                  borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div style={{ padding: '30px' }}>
            
            {/* Warranty Panel */}
            {activeTab === 'warranty' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Warranty Tracking</h3>
                {warranty && warranty.endDate ? (
                  <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
                      <h4 style={{ 
                        fontSize: '1.25rem', 
                        marginTop: '6px',
                        color: warranty.status === 'active' ? 'var(--success)' : warranty.status === 'expires-soon' ? 'var(--warning)' : 'var(--danger)'
                      }}>{warranty.status.toUpperCase()}</h4>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expiry Date</span>
                      <h4 style={{ fontSize: '1.1rem', marginTop: '6px' }}>{new Date(warranty.endDate).toLocaleDateString()}</h4>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No warranty policy registered for this asset yet.</p>
                )}

                <h4 style={{ marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Register / Edit Warranty Policy</h4>
                <form onSubmit={handleUpdateWarranty} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={warrantyForm.startDate}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={warrantyForm.endDate}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, endDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Provider Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. LG Premium Care"
                      value={warrantyForm.provider}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, provider: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                    <input 
                      type="checkbox" 
                      id="extended"
                      checked={warrantyForm.isExtended}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, isExtended: e.target.checked })}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label htmlFor="extended" className="form-label" style={{ cursor: 'pointer' }}>Extended Warranty Policy</label>
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ gridColumn: 'span 2', marginTop: '10px' }}>Save Warranty</button>
                </form>
              </div>
            )}

            {/* Services Panel */}
            {activeTab === 'services' && (
              <div>
                <h3 style={{ marginBottom: '25px' }}>Service Logs & Scheduler</h3>
                
                {/* Form to log service */}
                <h4 style={{ marginBottom: '15px' }}>Log a Service / Maintenance Job</h4>
                <form onSubmit={handleAddServiceLog} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '35px' }}>
                  <div className="form-group">
                    <label className="form-label">Service Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={serviceForm.lastServiceDate}
                      onChange={(e) => setServiceForm({ ...serviceForm, lastServiceDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Scheduled Service Date (Optional)</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={serviceForm.nextServiceDate}
                      onChange={(e) => setServiceForm({ ...serviceForm, nextServiceDate: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', gridColumn: 'span 2' }}>
                    <div className="form-group">
                      <label className="form-label">Service Provider</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. AC Mechanic Shop"
                        value={serviceForm.provider}
                        onChange={(e) => setServiceForm({ ...serviceForm, provider: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Service Cost ($)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 150"
                        value={serviceForm.cost}
                        onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Maintenance Details / Description</label>
                    <textarea 
                      className="form-input" 
                      rows="3" 
                      placeholder="e.g. Cleaned filters, refilled refrigerant gas."
                      value={serviceForm.details}
                      onChange={(e) => setServiceForm({ ...serviceForm, details: e.target.value })}
                      style={{ resize: 'vertical' }}
                    ></textarea>
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ gridColumn: 'span 2' }}>Add Service Record</button>
                </form>

                {/* History list */}
                <h4 style={{ marginBottom: '15px' }}>Service History logs</h4>
                {services.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No service logs found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {services.map(s => (
                      <div key={s._id} className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>{s.provider || 'Independent service'}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', backgroundColor: 'rgba(0, 242, 254, 0.08)', padding: '2px 8px', borderRadius: '12px' }}>
                              ${s.cost || 0}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.details}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Done: {new Date(s.lastServiceDate).toLocaleDateString()} 
                            {s.nextServiceDate ? ` | Next Service Due: ${new Date(s.nextServiceDate).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteService(s._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Insurance Panel */}
            {activeTab === 'insurance' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Insurance Tracker</h3>
                {insurance && insurance.policyNumber ? (
                  <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Provider</span>
                      <h4 style={{ fontSize: '1.1rem', marginTop: '6px' }}>{insurance.provider}</h4>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Policy Number</span>
                      <h4 style={{ fontSize: '1.1rem', marginTop: '6px' }}>{insurance.policyNumber}</h4>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expiry Date</span>
                      <h4 style={{ fontSize: '1.1rem', marginTop: '6px' }}>{new Date(insurance.expiryDate).toLocaleDateString()}</h4>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No active insurance policy registered.</p>
                )}

                <h4 style={{ marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Update Insurance Policy</h4>
                <form onSubmit={handleUpdateInsurance} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Provider Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={insuranceForm.provider}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                      placeholder="e.g. Geico"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Policy Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={insuranceForm.policyNumber}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                      placeholder="e.g. POL-98317"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={insuranceForm.expiryDate}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, expiryDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Premium Cost ($)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={insuranceForm.cost}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, cost: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ gridColumn: 'span 2', marginTop: '10px' }}>Save Insurance</button>
                </form>
              </div>
            )}

            {/* AMC Panel */}
            {activeTab === 'amc' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Annual Maintenance Contract (AMC)</h3>
                {amc && amc.provider ? (
                  <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contractor</span>
                      <h4 style={{ fontSize: '1.1rem', marginTop: '6px' }}>{amc.provider}</h4>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Date</span>
                      <h4 style={{ fontSize: '1.1rem', marginTop: '6px' }}>{new Date(amc.startDate).toLocaleDateString()}</h4>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>End Date</span>
                      <h4 style={{ fontSize: '1.1rem', marginTop: '6px' }}>{new Date(amc.endDate).toLocaleDateString()}</h4>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No AMC contract registered.</p>
                )}

                <h4 style={{ marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Update AMC Contract</h4>
                <form onSubmit={handleUpdateAMC} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">AMC Provider / Contractor</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={amcForm.provider}
                      onChange={(e) => setAmcForm({ ...amcForm, provider: e.target.value })}
                      placeholder="e.g. Voltas Service Center"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Start Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={amcForm.startDate}
                      onChange={(e) => setAmcForm({ ...amcForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract End Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={amcForm.endDate}
                      onChange={(e) => setAmcForm({ ...amcForm, endDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Annual Cost ($)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={amcForm.cost}
                      onChange={(e) => setAmcForm({ ...amcForm, cost: e.target.value })}
                      placeholder="e.g. 200"
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ gridColumn: 'span 2', marginTop: '10px' }}>Save AMC Contract</button>
                </form>
              </div>
            )}

            {/* Documents Vault */}
            {activeTab === 'documents' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Asset Document Vault</h3>
                
                {/* Upload Form */}
                <form onSubmit={handleUploadDocument} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                  <div className="form-group">
                    <label className="form-label">Document File (PDF / Image)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      required
                      accept=".pdf, image/*"
                      onChange={(e) => setDocumentFile(e.target.files[0])}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Document Type</label>
                    <select 
                      className="form-input" 
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      style={{ appearance: 'none', background: 'var(--bg-input)' }}
                    >
                      <option value="bill" style={{ background: '#0d1527' }}>Bill / Invoice</option>
                      <option value="warranty" style={{ background: '#0d1527' }}>Warranty Card</option>
                      <option value="insurance" style={{ background: '#0d1527' }}>Insurance Policy</option>
                      <option value="amc" style={{ background: '#0d1527' }}>AMC Agreement</option>
                      <option value="other" style={{ background: '#0d1527' }}>Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Display Name / Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. LG AC Extended Warranty Certificate"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ gridColumn: 'span 2' }}>Upload Document</button>
                </form>

                {/* File list */}
                <h4 style={{ marginBottom: '15px' }}>Saved Documents</h4>
                {documents.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No documents uploaded yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {documents.map(doc => (
                      <div key={doc._id} className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{doc.documentType}</span>
                          <h4 style={{ fontSize: '0.95rem', margin: '4px 0' }}>{doc.fileName}</h4>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <a href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            View ↗
                          </a>
                          <button onClick={() => handleDeleteDocument(doc._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Timeline Panel */}
            {activeTab === 'timeline' && (
              <div>
                <h3 style={{ marginBottom: '25px' }}>Service History & Warranty Timeline</h3>
                {timelineEvents.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No chronological events logged yet.</p>
                ) : (
                  <div style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px dashed var(--border-color)', margin: '10px 0 10px 15px' }}>
                    {timelineEvents.map((evt, idx) => (
                      <div key={idx} style={{ position: 'relative', marginBottom: '24px' }}>
                        
                        {/* Timeline Bullet Icon */}
                        <div style={{
                          position: 'absolute',
                          left: '-40px',
                          top: '0px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--bg-card)',
                          border: '2px solid var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}>
                          {evt.icon}
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.date.toLocaleDateString()}</span>
                          <h4 style={{ fontSize: '1rem', margin: '4px 0' }}>{evt.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{evt.description}</p>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default AssetDetails;
