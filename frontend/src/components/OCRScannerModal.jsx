import React, { useState, useRef } from 'react';
import api from '../api';

const OCRScannerModal = ({ isOpen, onClose, onApplyExtractedData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select an invoice or receipt image first');
      return;
    }

    setIsScanning(true);
    setError('');

    const formData = new FormData();
    formData.append('invoice', selectedFile);

    try {
      const { data } = await api.post('/documents/scan-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        setScanResult(data);
      } else {
        setError(data.error || 'Failed to extract invoice data. Please verify image clarity.');
      }
    } catch (err) {
      console.error('OCR scan failed:', err);
      setError(err.response?.data?.message || 'OCR processing error. Please try another image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (scanResult && scanResult.extracted) {
      onApplyExtractedData(scanResult.extracted, selectedFile);
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>📸</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Smart Invoice OCR Scanner</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Upload Amazon, retail invoice, or receipt to auto-populate your asset details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '0.86rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.02)',
              transition: 'var(--transition-smooth)',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📄</div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
              Drag & Drop Invoice or Click to Browse
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Supports JPG, PNG, WEBP, PDF (Amazon, Croma, Flipkart, Best Buy receipts)
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {/* Image Preview */}
            <div style={{ flex: '1 1 200px', maxWidth: '240px' }}>
              <img
                src={previewUrl}
                alt="Invoice Preview"
                style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
              />
              <button
                onClick={handleReset}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '8px', fontSize: '0.78rem' }}
              >
                Choose Another Image
              </button>
            </div>

            {/* Actions / Results */}
            <div style={{ flex: '2 1 300px' }}>
              {!scanResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '14px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Image ready for analysis. Click below to extract brand, product name, price, purchase date, and serial number.
                  </p>
                  <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="btn btn-primary"
                    style={{ padding: '14px' }}
                  >
                    {isScanning ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pulse-green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />
                        Analyzing Invoice via OCR...
                      </span>
                    ) : (
                      '⚡ Run OCR Extraction'
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#10b981' }}>
                      ✅ Extraction Complete ({scanResult.confidence}% Confidence)
                    </span>
                    <span className="badge badge-purple">{scanResult.extracted.category}</span>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '0.84rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div><strong>Product:</strong> {scanResult.extracted.productName}</div>
                    <div><strong>Brand:</strong> {scanResult.extracted.brand}</div>
                    <div><strong>Purchase Date:</strong> {scanResult.extracted.purchaseDate}</div>
                    <div><strong>Price:</strong> ₹{scanResult.extracted.purchasePrice?.toLocaleString() || '0'}</div>
                    {scanResult.extracted.seller && <div><strong>Seller / Merchant:</strong> {scanResult.extracted.seller}</div>}
                    {scanResult.extracted.serialNumber && <div><strong>Serial / IMEI:</strong> {scanResult.extracted.serialNumber}</div>}
                    <div><strong>Estimated Warranty:</strong> {scanResult.extracted.warrantyDurationMonths} Months</div>
                  </div>

                  <button
                    onClick={handleApply}
                    className="btn btn-primary"
                    style={{ marginTop: '6px', padding: '12px' }}
                  >
                    ✨ Auto-Fill Asset Form with These Details
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OCRScannerModal;
