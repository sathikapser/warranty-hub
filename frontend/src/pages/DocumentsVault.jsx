import React, { useState, useEffect } from 'react';
import api from '../api';

const DocumentsVault = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchVault = async () => {
    try {
      const { data } = await api.get('/documents/vault');
      setDocuments(data);
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

  const filteredDocs = filterType === 'all' 
    ? documents 
    : documents.filter(doc => doc.documentType === filterType);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Loading Document Vault...</h2>
      </div>
    );
  }

  const docTypes = ['all', 'bill', 'warranty', 'insurance', 'amc', 'other'];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Centralized Document Vault</h2>
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel" style={{
        display: 'flex',
        gap: '10px',
        padding: '16px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {docTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              backgroundColor: filterType === type ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: filterType === type ? '#000000' : 'var(--text-main)',
              textTransform: 'uppercase'
            }}
          >
            {type}s
          </button>
        ))}
      </div>

      {/* File List */}
      {filteredDocs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No documents found in this category.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredDocs.map(doc => (
            <div key={doc._id} className="glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--secondary)'
                  }}>{doc.documentType}</span>
                  
                  {doc.assetId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Asset: {doc.assetId.assetName}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', lineHeight: 1.4 }}>{doc.fileName}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '15px',
                marginTop: '15px'
              }}>
                <a 
                  href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  Open File ↗
                </a>
                <button 
                  onClick={() => handleDelete(doc._id)} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsVault;
