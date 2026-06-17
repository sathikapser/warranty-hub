import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AddAsset = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  
  // Asset Fields
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // OCR file upload
  const [invoiceFile, setInvoiceFile] = useState(null);

  const handleInvoiceChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
      setOcrError('');
    }
  };

  const handleScanInvoice = async () => {
    if (!invoiceFile) {
      setOcrError('Please select a receipt image first.');
      return;
    }

    setOcrLoading(true);
    setOcrError('');
    
    const formData = new FormData();
    formData.append('invoice', invoiceFile);

    try {
      const { data } = await api.post('/documents/scan-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success && data.extracted) {
        const ext = data.extracted;
        setAssetName(ext.productName || '');
        setBrand(ext.brand || '');
        setPurchasePrice(ext.purchasePrice || '');
        setModelNumber(ext.modelNumber || '');
        setSerialNumber(ext.serialNumber || '');
        if (ext.purchaseDate) {
          // Format date YYYY-MM-DD
          try {
            const formatted = new Date(ext.purchaseDate).toISOString().split('T')[0];
            setPurchaseDate(formatted);
          } catch (dErr) {
            setPurchaseDate('');
          }
        }
      } else {
        setOcrError('Could not read detailed text, but you can fill in details manually.');
      }
    } catch (err) {
      console.error(err);
      setOcrError('OCR analysis failed. Please manually fill the form.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/assets', {
        assetName,
        category,
        brand,
        modelNumber,
        serialNumber,
        purchaseDate,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        assignedTo: assignedTo || null
      });

      navigate('/assets');
    } catch (err) {
      console.error(err);
      alert('Error creating asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        
        {/* OCR Scanner Card */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⚡ Smart OCR Scan</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Upload your purchase invoice/receipt image. Our system will extract the product description, brand, purchase date, and cost automatically!
          </p>

          <div className="form-group">
            <label className="form-label">Upload Invoice Image</label>
            <input 
              type="file" 
              className="form-input" 
              accept="image/*"
              onChange={handleInvoiceChange} 
            />
          </div>

          <button 
            type="button" 
            className="btn btn-accent pulse-glow" 
            onClick={handleScanInvoice} 
            disabled={ocrLoading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {ocrLoading ? 'Analyzing Receipt (Tesseract)...' : 'Scan Receipt'}
          </button>

          {ocrError && (
            <div style={{ 
              marginTop: '15px', 
              color: '#ff6b6b', 
              fontSize: '0.85rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '8px',
              borderRadius: '6px'
            }}>{ocrError}</div>
          )}
        </div>

        {/* Manual Input Form */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Asset Specifications</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Asset Name</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. Smart LED TV"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-input" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ appearance: 'none', background: 'var(--bg-input)' }}
                >
                  {['Electronics', 'Appliances', 'Vehicles', 'Industrial Equipment', 'Lifts', 'Generators', 'Water Purifiers', 'Others'].map(cat => (
                    <option key={cat} value={cat} style={{ background: '#0d1527' }}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Brand</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Samsung"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Model Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  placeholder="e.g. QN90A"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN-982741"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required 
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purchase Price ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="e.g. 1200"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign to Family Member (Email - Optional)</label>
              <input 
                type="email" 
                className="form-input" 
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. son@family.com"
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
              {loading ? 'Creating...' : 'Save Asset'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AddAsset;
