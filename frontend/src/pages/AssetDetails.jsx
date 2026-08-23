import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core Data
  const [asset, setAsset] = useState(null);
  const [health, setHealth] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [warranty, setWarranty] = useState({});
  const [services, setServices] = useState([]);
  const [insurance, setInsurance] = useState({});
  const [amc, setAmc] = useState({});
  const [documents, setDocuments] = useState([]);
  const [predictiveData, setPredictiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState('warranty'); // 'warranty', 'services', 'contracts', 'documents', 'expenses', 'ai_advisor'

  // Forms
  const [warrantyForm, setWarrantyForm] = useState({ startDate: '', endDate: '', isExtended: false, provider: '', policyNumber: '', claimPhone: '', claimEmail: '', coverageTerms: '' });
  const [serviceForm, setServiceForm] = useState({ lastServiceDate: new Date().toISOString().split('T')[0], nextServiceDate: '', frequencyMonths: 6, provider: '', cost: '', details: '' });
  const [insuranceForm, setInsuranceForm] = useState({ provider: '', policyNumber: '', expiryDate: '', cost: '' });
  const [amcForm, setAmcForm] = useState({ provider: '', startDate: '', endDate: '', cost: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('invoice');
  const [documentName, setDocumentName] = useState('');

  // AI Claim Kit Modal State
  const [claimModalData, setClaimModalData] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAllDetails = async () => {
    try {
      const [assetRes, healthRes, qrRes, wRes, sRes, insRes, amcRes, docRes, predRes] = await Promise.all([
        api.get(`/assets/${id}`),
        api.get(`/assets/${id}/health`),
        api.get(`/assets/${id}/qr`),
        api.get(`/warranties/${id}`),
        api.get(`/services/${id}`),
        api.get(`/insurance/${id}`),
        api.get(`/amc/${id}`),
        api.get(`/documents/asset/${id}`),
        api.post('/ai/predictive-advice', { assetId: id }).catch(() => ({ data: null }))
      ]);

      setAsset(assetRes.data);
      setHealth(healthRes.data);
      setQrCodeUrl(qrRes.data.qrCodeUrl);
      setWarranty(wRes.data || {});
      if (wRes.data && wRes.data.startDate) {
        setWarrantyForm({
          startDate: wRes.data.startDate.split('T')[0],
          endDate: wRes.data.endDate.split('T')[0],
          isExtended: wRes.data.isExtended || false,
          provider: wRes.data.provider || '',
          policyNumber: wRes.data.policyNumber || '',
          claimPhone: wRes.data.claimPhone || '',
          claimEmail: wRes.data.claimEmail || '',
          coverageTerms: wRes.data.coverageTerms || ''
        });
      }

      setServices(sRes.data || []);
      setInsurance(insRes.data || {});
      if (insRes.data && insRes.data.provider) {
        setInsuranceForm({
          provider: insRes.data.provider,
          policyNumber: insRes.data.policyNumber || '',
          expiryDate: insRes.data.expiryDate ? insRes.data.expiryDate.split('T')[0] : '',
          cost: insRes.data.cost || ''
        });
      }

      setAmc(amcRes.data || {});
      if (amcRes.data && amcRes.data.provider) {
        setAmcForm({
          provider: amcRes.data.provider,
          startDate: amcRes.data.startDate ? amcRes.data.startDate.split('T')[0] : '',
          endDate: amcRes.data.endDate ? amcRes.data.endDate.split('T')[0] : '',
          cost: amcRes.data.cost || ''
        });
      }

      setDocuments(docRes.data || []);
      setPredictiveData(predRes.data);
    } catch (err) {
      console.error('Error fetching asset details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDetails();
  }, [id]);

  // Compute countdown days
  const getWarrantyCountdown = () => {
    if (!warranty || !warranty.endDate) return { label: 'No Warranty', status: 'none', days: 0 };
    const today = new Date();
    const end = new Date(warranty.endDate);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired (${Math.abs(diffDays)}d ago)`, status: 'expired', days: diffDays };
    } else if (diffDays <= 3) {
      return { label: `🔴 Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}!`, status: 'urgent', days: diffDays };
    } else if (diffDays <= 30) {
      return { label: `⚠️ Expires in ${diffDays} days`, status: 'expiring', days: diffDays };
    } else {
      return { label: `🟢 Active (${diffDays} days remaining)`, status: 'active', days: diffDays };
    }
  };

  const handleSaveWarranty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warranties', { ...warrantyForm, assetId: id });
      setMessage('Warranty terms successfully updated!');
      setTimeout(() => setMessage(''), 4000);
      fetchAllDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update warranty');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', { ...serviceForm, assetId: id });
      setServiceForm({
        lastServiceDate: new Date().toISOString().split('T')[0],
        nextServiceDate: '',
        frequencyMonths: 6,
        provider: '',
        cost: '',
        details: ''
      });
      setMessage('Service record logged!');
      setTimeout(() => setMessage(''), 4000);
      fetchAllDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log service');
    }
  };

  const handleSaveInsurance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/insurance', { ...insuranceForm, assetId: id });
      setMessage('Insurance policy updated!');
      setTimeout(() => setMessage(''), 4000);
      fetchAllDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update insurance');
    }
  };

  const handleSaveAMC = async (e) => {
    e.preventDefault();
    try {
      await api.post('/amc', { ...amcForm, assetId: id });
      setMessage('AMC Contract saved!');
      setTimeout(() => setMessage(''), 4000);
      fetchAllDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update AMC');
    }
  };

  const handleUploadDoc = async (e) => {
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
      setDocumentFile(null);
      setDocumentName('');
      setMessage('Document secured in Vault!');
      setTimeout(() => setMessage(''), 4000);
      fetchAllDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      fetchAllDetails();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const handleDeleteAsset = async () => {
    if (!window.confirm('Are you sure you want to delete this asset and all its service/warranty records?')) return;
    try {
      await api.delete(`/assets/${id}`);
      navigate('/assets');
    } catch (err) {
      alert('Failed to delete asset');
    }
  };

  const handleClaimWithAI = async () => {
    setClaimLoading(true);
    try {
      const { data } = await api.post('/ai/claim-prep', {
        assetId: id,
        issueDescription: 'General component malfunction requiring official warranty service inspection.'
      });
      setClaimModalData(data);
    } catch (err) {
      alert('Failed to generate claim kit');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <h2>Loading 360° Asset Intelligence...</h2>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Asset Not Found</h2>
        <Link to="/assets" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Asset Catalog
        </Link>
      </div>
    );
  }

  const countdown = getWarrantyCountdown();
  const totalServiceSpent = services.reduce((acc, s) => acc + (s.cost || 0), 0);
  const totalTCO = (asset.purchasePrice || 0) + totalServiceSpent + (insurance.cost || 0) + (amc.cost || 0);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Success Notification Alert */}
      {message && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#34d399',
          fontSize: '0.88rem',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✅ {message}</span>
          <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}>&times;</button>
        </div>
      )}

      {/* Asset 360° Header Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple">{asset.category}</span>
              <span className={`badge ${countdown.status === 'expired' ? 'badge-expired' : countdown.status === 'urgent' ? 'badge-expired' : countdown.status === 'expiring' ? 'badge-expiring' : 'badge-active'}`}>
                {countdown.label}
              </span>
              <span className="badge badge-info">📍 {asset.roomOrLocation || 'Household'}</span>
              {asset.assignedTo && <span className="badge badge-purple">👤 {asset.assignedTo}</span>}
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>
              {asset.brand} {asset.assetName}
            </h1>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '6px' }}>
              {asset.modelNumber && <span><strong>Model:</strong> {asset.modelNumber}</span>}
              {asset.serialNumber && <span><strong>Serial Number:</strong> {asset.serialNumber}</span>}
              <span><strong>Purchased:</strong> {new Date(asset.purchaseDate).toLocaleDateString()}</span>
              {asset.sellerOrStore && <span><strong>Seller:</strong> {asset.sellerOrStore}</span>}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleClaimWithAI} disabled={claimLoading} className="btn btn-accent">
              {claimLoading ? 'Compiling Kit...' : '📝 Prepare Claim with AI'}
            </button>
            <button onClick={handleDeleteAsset} className="btn btn-danger btn-sm">
              🗑️ Delete Asset
            </button>
          </div>
        </div>

        {/* Diagnostic KPI Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginTop: '22px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Purchase Price</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>₹{asset.purchasePrice?.toLocaleString() || '0'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Lifetime TCO</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00f2fe' }}>₹{totalTCO.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health Grade</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: health?.healthColor || '#10b981' }}>
              Grade {health?.healthGrade || 'A'} ({health?.healthScore || 85}/100)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Documents in Vault</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>{documents.length} Files</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {[
          { key: 'warranty', label: '🛡️ Warranty & Claims' },
          { key: 'services', label: `🛠️ Service History (${services.length})` },
          { key: 'contracts', label: '📄 AMC & Insurance' },
          { key: 'documents', label: `📂 Vault Documents (${documents.length})` },
          { key: 'expenses', label: '💰 Lifetime TCO' },
          { key: 'ai_advisor', label: '🧠 AI Diagnostic Advisor' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Warranty & Claim Details */}
      {activeTab === 'warranty' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Warranty Policy & Coverage Terms</h3>
            <form onSubmit={handleSaveWarranty} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={warrantyForm.startDate}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, startDate: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End / Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={warrantyForm.endDate}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, endDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Warranty Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. Brand Manufacturer / AppleCare"
                    value={warrantyForm.provider}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, provider: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Policy / Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. POL-983271"
                    value={warrantyForm.policyNumber}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, policyNumber: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Authorized Support Phone</label>
                  <input
                    type="text"
                    placeholder="1800-XXX-XXXX"
                    value={warrantyForm.claimPhone}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, claimPhone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Authorized Support Email</label>
                  <input
                    type="email"
                    placeholder="support@brand.com"
                    value={warrantyForm.claimEmail}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, claimEmail: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Coverage Terms & Exclusions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Covers compressor, motor, screen panel. Excludes physical liquid damage."
                  value={warrantyForm.coverageTerms}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, coverageTerms: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="extendedWarranty"
                  checked={warrantyForm.isExtended}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, isExtended: e.target.checked })}
                />
                <label htmlFor="extendedWarranty" style={{ fontSize: '0.88rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  This is an Extended Warranty / Third-Party Protection Plan
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '6px' }}>
                Save Warranty Terms
              </button>
            </form>
          </div>

          {/* Right QR & Claim Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ textAlign: 'center' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Asset Smart QR Tag</h4>
              {qrCodeUrl && (
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: '12px' }}>
                  <img src={qrCodeUrl} alt="Asset QR" style={{ width: '150px', height: '150px' }} />
                </div>
              )}
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Scan to instantly access specs, serial number, and active warranty status
              </p>
            </div>

            <div className="glass-panel" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <h4 style={{ fontSize: '1rem', color: '#a78bfa', marginBottom: '8px' }}>Need to Claim Warranty?</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Our AI will verify coverage, inspect attached invoices, and compile an official claim email letter.
              </p>
              <button onClick={handleClaimWithAI} disabled={claimLoading} className="btn btn-accent" style={{ width: '100%' }}>
                {claimLoading ? 'Generating Kit...' : '⚡ Generate Claim Kit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Service History */}
      {activeTab === 'services' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Maintenance & Repair Timeline ({services.length})</h3>
            {services.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No service logs recorded for this asset yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {services.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{s.provider || 'Technician Care'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Date: {s.lastServiceDate ? new Date(s.lastServiceDate).toLocaleDateString() : 'N/A'} • Next Due: {s.nextServiceDate ? new Date(s.nextServiceDate).toLocaleDateString() : 'None scheduled'}
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '6px' }}>
                        {s.details || 'Routine servicing & inspection'}
                      </p>
                    </div>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>
                      ₹{s.cost?.toLocaleString() || '0'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Service Log Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>+ Log Service Record</h3>
            <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Service Date *</label>
                <input
                  type="date"
                  required
                  value={serviceForm.lastServiceDate}
                  onChange={(e) => setServiceForm({ ...serviceForm, lastServiceDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technician / Center</label>
                <input
                  type="text"
                  placeholder="e.g. Brand Care / Urban Company"
                  value={serviceForm.provider}
                  onChange={(e) => setServiceForm({ ...serviceForm, provider: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cost Incurred (₹)</label>
                <input
                  type="number"
                  placeholder="0 (If free under warranty)"
                  value={serviceForm.cost}
                  onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Next Scheduled Date</label>
                <input
                  type="date"
                  value={serviceForm.nextServiceDate}
                  onChange={(e) => setServiceForm({ ...serviceForm, nextServiceDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Done & Observations</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Gas recharge, filter replacement..."
                  value={serviceForm.details}
                  onChange={(e) => setServiceForm({ ...serviceForm, details: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                Save Service Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: AMC & Insurance */}
      {activeTab === 'contracts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* AMC Contract */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Annual Maintenance Contract (AMC)</h3>
            <form onSubmit={handleSaveAMC} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">AMC Provider</label>
                <input
                  type="text"
                  placeholder="e.g. Voltas AMC / Brand Care"
                  value={amcForm.provider}
                  onChange={(e) => setAmcForm({ ...amcForm, provider: e.target.value })}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={amcForm.startDate}
                    onChange={(e) => setAmcForm({ ...amcForm, startDate: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Renewal Date</label>
                  <input
                    type="date"
                    value={amcForm.endDate}
                    onChange={(e) => setAmcForm({ ...amcForm, endDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Annual Cost (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 3500"
                  value={amcForm.cost}
                  onChange={(e) => setAmcForm({ ...amcForm, cost: e.target.value })}
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                Save AMC Details
              </button>
            </form>
          </div>

          {/* Insurance Policy */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Insurance Protection Policy</h3>
            <form onSubmit={handleSaveInsurance} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Insurance Company</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC ERGO / Bajaj Allianz"
                  value={insuranceForm.provider}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Policy Number</label>
                <input
                  type="text"
                  placeholder="e.g. POL-874291"
                  value={insuranceForm.policyNumber}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Policy Expiration</label>
                  <input
                    type="date"
                    value={insuranceForm.expiryDate}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, expiryDate: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Premium (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1800"
                    value={insuranceForm.cost}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, cost: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                Save Insurance Policy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Documents Vault */}
      {activeTab === 'documents' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Attached Proofs & Documentation ({documents.length})</h3>
            {documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <p>No documents uploaded yet. Upload the purchase invoice to maintain warranty claim eligibility.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {documents.map(doc => (
                  <div
                    key={doc._id}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge badge-purple">{doc.documentType || 'Document'}</span>
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.fileName || 'Uploaded File'}
                    </div>
                    <a
                      href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', marginTop: 'auto' }}
                    >
                      👁️ View / Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>+ Upload Document</h3>
            <form onSubmit={handleUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="form-select"
                >
                  <option value="invoice">Purchase Invoice / Bill</option>
                  <option value="warranty_card">Warranty Card</option>
                  <option value="service_jobsheet">Service Job-Sheet</option>
                  <option value="user_manual">User Manual</option>
                  <option value="other">Other Proof</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Label Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Tax Invoice March 2025"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select File (PDF / JPG / PNG)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocumentFile(e.target.files[0])}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                Upload to Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 5: Lifetime Expense & TCO Breakdown */}
      {activeTab === 'expenses' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Total Cost of Ownership (TCO) Breakdown</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Original Purchase</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>₹{asset.purchasePrice?.toLocaleString() || 0}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Repairs & Servicing</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>₹{totalServiceSpent.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AMC & Policies</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>₹{((insurance.cost || 0) + (amc.cost || 0)).toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(0, 242, 254, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Net TCO Spent</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00f2fe' }}>₹{totalTCO.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: AI Diagnostic & Predictive Maintenance */}
      {activeTab === 'ai_advisor' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.6rem' }}>🧠</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>AI Diagnostic & Failure Forecast</h3>
          </div>

          {predictiveData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '18px',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Failure Risk Assessment</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: predictiveData.riskLevel === 'High' ? '#ef4444' : predictiveData.riskLevel === 'Moderate' ? '#f59e0b' : '#10b981' }}>
                    {predictiveData.riskLevel} ({predictiveData.failureProbability})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Asset Age</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>{predictiveData.ageYears} Years</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Next Recommended Care</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00f2fe' }}>{predictiveData.nextPreventiveServiceDue}</div>
                </div>
              </div>

              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '0.88rem',
                lineHeight: 1.5
              }}>
                <strong>AI Assessment:</strong> {predictiveData.recommendation}
              </div>

              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 600, marginBottom: '8px' }}>Actionable Next Steps:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {predictiveData.actionItems?.map((act, i) => (
                    <div key={i} style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👉</span> {act}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Generating diagnostic forecast...</p>
          )}
        </div>
      )}

      {/* Claim Kit Modal */}
      {claimModalData && (
        <div className="modal-overlay" onClick={() => setClaimModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Official Claim Kit: {claimModalData.asset?.brand} {claimModalData.asset?.name}
                </h3>
              </div>
              <button
                onClick={() => setClaimModalData(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {claimModalData.checklist?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: item.ready ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${item.ready ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                  }}
                >
                  <span style={{ fontSize: '0.86rem', color: '#ffffff' }}>
                    {item.ready ? '✅' : '⚠️'} {item.item}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: item.ready ? '#10b981' : '#f59e0b' }}>
                    {item.note}
                  </span>
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Pre-Drafted Official Email Letter
            </h4>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '0.82rem',
              color: '#f3f4f6',
              whiteSpace: 'pre-wrap',
              maxHeight: '180px',
              overflowY: 'auto',
              marginBottom: '16px'
            }}>
              <strong>To:</strong> {claimModalData.claimEmail?.to}<br />
              <strong>Subject:</strong> {claimModalData.claimEmail?.subject}<br /><br />
              {claimModalData.claimEmail?.body}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(claimModalData.claimEmail?.body || '');
                  alert('Claim email copied!');
                }}
                className="btn btn-secondary btn-sm"
              >
                📋 Copy Email
              </button>
              <a
                href={`mailto:${claimModalData.claimEmail?.to}?subject=${encodeURIComponent(claimModalData.claimEmail?.subject || '')}&body=${encodeURIComponent(claimModalData.claimEmail?.body || '')}`}
                className="btn btn-primary"
              >
                ✉️ Send via Mail Client
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetails;
