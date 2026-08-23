import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api';

const DocumentsVault = () => {
  const [documents, setDocuments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    assetId: '',
    documentType: 'invoice',
    fileName: '',
    file: null
  });

  const fetchVault = async () => {
    try {
      const [docRes, assetRes] = await Promise.all([
        api.get('/documents/vault'),
        api.get('/assets')
      ]);
      setDocuments(docRes.data);
      setAssets(assetRes.data);
    } catch (err) {
      console.error('Error fetching vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchVault();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.assetId) return;

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('assetId', uploadForm.assetId);
    formData.append('documentType', uploadForm.documentType);
    formData.append('fileName', uploadForm.fileName || uploadForm.file.name);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      setUploadForm({
        assetId: '',
        documentType: 'invoice',
        fileName: '',
        file: null
      });
      fetchVault();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const docTypes = ['all', 'invoice', 'warranty_card', 'service_jobsheet', 'insurance', 'amc', 'other'];

  const filteredDocs = documents.filter(doc => {
    const typeMatch = filterType === 'all' 
      ? true 
      : (filterType === 'invoice' ? (doc.documentType === 'invoice' || doc.documentType === 'bill') : doc.documentType === filterType);
    
    const searchMatch = 
      (doc.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.assetId?.assetName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.assetId?.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && searchMatch;
  });

  const getFileUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading Encrypted Document Vault...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Encrypted Documents Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Permanent cloud storage for proof-of-purchases, tax invoices, warranty cards, and repair job-sheets
          </p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          + Upload Document
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="glass-panel" style={{
        display: 'flex',
        gap: '14px',
        padding: '16px 20px',
        marginBottom: '28px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by file name or asset brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexWrap: 'wrap' }}>
          {docTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className="btn btn-sm"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                backgroundColor: filterType === type ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: filterType === type ? '#000000' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                textTransform: 'capitalize'
              }}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📂</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No documents found in this view.</p>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-secondary btn-sm">
            + Upload Proof
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredDocs.map(doc => (
            <div key={doc._id} className="glass-panel glass-card-interactive" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="badge badge-purple">
                    {(doc.documentType || 'document').replace(/_/g, ' ')}
                  </span>
                  
                  {doc.assetId && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {doc.assetId.brand} {doc.assetId.assetName}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                  {doc.fileName}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Stored: {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '14px',
                marginTop: '16px'
              }}>
                <a 
                  href={getFileUrl(doc.fileUrl)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                >
                  👁️ Open Proof ↗
                </a>
                <button 
                  onClick={() => handleDelete(doc._id)} 
                  className="btn btn-danger btn-sm" 
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  title="Delete Document"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Upload Document to Vault</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Attach to Asset *</label>
                <select
                  required
                  value={uploadForm.assetId}
                  onChange={(e) => setUploadForm({ ...uploadForm, assetId: e.target.value })}
                  className="form-select"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a._id} value={a._id}>{a.brand} {a.assetName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Document Type *</label>
                <select
                  value={uploadForm.documentType}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                  className="form-select"
                >
                  <option value="invoice">Purchase Invoice / Receipt</option>
                  <option value="warranty_card">Warranty Registration Card</option>
                  <option value="service_jobsheet">Service / Repair Job-Sheet</option>
                  <option value="insurance">Insurance Policy Copy</option>
                  <option value="amc">AMC Agreement Contract</option>
                  <option value="other">Other Manual / Document</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Document Label Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Tax Invoice 2025"
                  value={uploadForm.fileName}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Secure in Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsVault;
