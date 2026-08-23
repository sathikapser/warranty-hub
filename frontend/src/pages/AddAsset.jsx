import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import confetti from 'canvas-confetti';

const AddAsset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrSuccess, setOcrSuccess] = useState('');

  // Asset Fields
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellerOrStore, setSellerOrStore] = useState('');
  const [warrantyDurationMonths, setWarrantyDurationMonths] = useState(12);
  const [roomOrLocation, setRoomOrLocation] = useState('Living Room');
  const [condition, setCondition] = useState('good');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // OCR file upload
  const [invoiceFile, setInvoiceFile] = useState(null);

  // Check if data prefilled from Dashboard OCR Scanner modal
  useEffect(() => {
    if (location.state?.prefill) {
      const ext = location.state.prefill;
      applyExtractedFields(ext);
    }
  }, [location.state]);

  const applyExtractedFields = (ext) => {
    if (ext.productName) setAssetName(ext.productName);
    if (ext.brand) setBrand(ext.brand);
    if (ext.category) setCategory(ext.category);
    if (ext.purchasePrice) setPurchasePrice(ext.purchasePrice.toString());
    if (ext.modelNumber) setModelNumber(ext.modelNumber);
    if (ext.serialNumber) setSerialNumber(ext.serialNumber);
    if (ext.seller) setSellerOrStore(ext.seller);
    if (ext.warrantyDurationMonths) setWarrantyDurationMonths(ext.warrantyDurationMonths);
    if (ext.purchaseDate) {
      try {
        const formatted = new Date(ext.purchaseDate).toISOString().split('T')[0];
        setPurchaseDate(formatted);
      } catch (dErr) {}
    }
    setOcrSuccess(`Auto-populated extracted details from invoice!`);
  };

  const handleInvoiceChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
      setOcrError('');
      setOcrSuccess('');
    }
  };

  const handleScanInvoice = async () => {
    if (!invoiceFile) {
      setOcrError('Please select a receipt/invoice image first.');
      return;
    }

    setOcrLoading(true);
    setOcrError('');
    setOcrSuccess('');
    
    const formData = new FormData();
    formData.append('invoice', invoiceFile);

    try {
      const { data } = await api.post('/documents/scan-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success && data.extracted) {
        applyExtractedFields(data.extracted);
      } else {
        setOcrError('Could not parse all fields automatically. You can fill them in below.');
      }
    } catch (err) {
      console.error(err);
      setOcrError('OCR analysis error. Please fill fields manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Compute live estimated warranty expiration date
  const computeEstimatedWarrantyEnd = () => {
    if (!purchaseDate) return 'N/A';
    try {
      const d = new Date(purchaseDate);
      d.setMonth(d.getMonth() + parseInt(warrantyDurationMonths || 12));
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'N/A';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: newAsset } = await api.post('/assets', {
        assetName,
        category,
        brand,
        modelNumber,
        serialNumber,
        purchaseDate,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        sellerOrStore,
        warrantyDurationMonths: parseInt(warrantyDurationMonths) || 12,
        roomOrLocation,
        condition,
        assignedTo: assignedTo || null,
        notes
      });

      // If user uploaded an invoice file in the OCR card, attach it to document vault automatically
      if (invoiceFile && newAsset._id) {
        try {
          const docForm = new FormData();
          docForm.append('file', invoiceFile);
          docForm.append('assetId', newAsset._id);
          docForm.append('documentType', 'invoice');
          docForm.append('fileName', invoiceFile.name || 'Purchase Invoice');
          await api.post('/documents/upload', docForm, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (docErr) {
          console.error('Invoice auto-vault upload failed:', docErr);
        }
      }

      // Confetti effect!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        navigate(`/assets/${newAsset._id}`);
      }, 700);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error creating asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Register New Asset & Warranty</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Auto-extract specifications via OCR receipt scanner or enter details manually
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '28px', alignItems: 'start', flexWrap: 'wrap' }}>
        {/* Left Side: Smart OCR Receipt Card */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Smart Invoice OCR</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '16px' }}>
            Upload your receipt (Amazon, Flipkart, Croma, Apple Store) and our OCR will parse product name, brand, date, seller, and price.
          </p>

          <div className="form-group">
            <label className="form-label">Upload Receipt / Invoice</label>
            <input 
              type="file" 
              className="form-input" 
              accept="image/*,.pdf"
              onChange={handleInvoiceChange} 
            />
          </div>

          <button 
            type="button" 
            className="btn btn-accent" 
            onClick={handleScanInvoice} 
            disabled={ocrLoading || !invoiceFile}
            style={{ width: '100%', marginTop: '6px', padding: '12px' }}
          >
            {ocrLoading ? 'Scanning with OCR...' : '🔍 Extract Details'}
          </button>

          {ocrSuccess && (
            <div style={{ 
              marginTop: '12px', 
              color: '#34d399', 
              fontSize: '0.82rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              ✅ {ocrSuccess}
            </div>
          )}

          {ocrError && (
            <div style={{ 
              marginTop: '12px', 
              color: '#f87171', 
              fontSize: '0.82rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              {ocrError}
            </div>
          )}

          {/* Quick Tip */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            💡 Uploading the invoice will also automatically store it in your encrypted <strong>Documents Vault</strong>.
          </div>
        </div>

        {/* Right Side: Detailed Asset Specification Form */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '18px' }}>Asset & Warranty Specifications</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Asset Name *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. French Door Refrigerator / Smart OLED TV"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  className="form-select" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {['Electronics', 'Appliances', 'Vehicles', 'Industrial Equipment', 'Lifts', 'Generators', 'Water Purifiers', 'Others'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Brand / Manufacturer *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Samsung, LG, Apple, Sony"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Model Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  placeholder="e.g. QN90A / RT28T3922S8"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Serial Number (S/N / IMEI)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN-982741"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Purchase Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required 
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purchase Price (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="e.g. 45000"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Seller / Retail Merchant</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={sellerOrStore}
                  onChange={(e) => setSellerOrStore(e.target.value)}
                  placeholder="e.g. Amazon / Reliance Digital"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Warranty Duration</label>
                <select
                  value={warrantyDurationMonths}
                  onChange={(e) => setWarrantyDurationMonths(e.target.value)}
                  className="form-select"
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year (12 Months)</option>
                  <option value={24}>2 Years (24 Months)</option>
                  <option value={36}>3 Years (36 Months)</option>
                  <option value={60}>5 Years (60 Months)</option>
                  <option value={120}>10 Years (Compressor/Motor)</option>
                </select>
              </div>
            </div>

            {/* Computed Expiry Banner */}
            <div style={{
              background: 'rgba(0, 242, 254, 0.06)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🛡️ Estimated Warranty Expiry:</span>
              <strong style={{ color: '#00f2fe' }}>{computeEstimatedWarrantyEnd()}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Room / Household Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={roomOrLocation}
                  onChange={(e) => setRoomOrLocation(e.target.value)}
                  placeholder="e.g. Kitchen, Master Bedroom, Garage"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Family Member (Email)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g. dad@family.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes & Specifications (Optional)</label>
              <textarea 
                rows={2}
                className="form-textarea" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Additional accessories included, custom dealer warranty agreement..."
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '14px', marginTop: '6px' }}>
              {loading ? 'Registering & Shielding Asset...' : '✨ Save Asset & Shield Warranty'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAsset;
