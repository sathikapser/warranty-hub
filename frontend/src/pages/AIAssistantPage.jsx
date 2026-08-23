import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '👋 Welcome to **WarrantyHub AI Intelligence Center**!\n\nI have real-time access to your workspace assets, warranty contracts, service logs, and uploaded receipts. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [selectedAssetForClaim, setSelectedAssetForClaim] = useState('');
  const [claimIssue, setClaimIssue] = useState('');
  const [generatedClaimKit, setGeneratedClaimKit] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data } = await api.get('/assets');
      setAssets(data);
      if (data.length > 0) setSelectedAssetForClaim(data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText) => {
    const query = queryText || input;
    if (!query.trim() || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: query });
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply, actionType: data.actionType, data: data.data }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: '⚠️ Unable to process query right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClaimKit = async (e) => {
    e.preventDefault();
    if (!selectedAssetForClaim) return;

    setClaimLoading(true);
    try {
      const { data } = await api.post('/ai/claim-prep', {
        assetId: selectedAssetForClaim,
        issueDescription: claimIssue
      });
      setGeneratedClaimKit(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to prepare claim kit');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>AI Warranty & Service Intelligence</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Natural language asset search, 1-click claim kit builder, troubleshooting diagnostics, and predictive failure forecasts
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
        {/* Main Conversational AI Chat Box */}
        <div className="glass-panel" style={{ height: '650px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
          {/* Top Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Warranty Intelligence Chat</h3>
                <span style={{ fontSize: '0.74rem', color: '#10b981' }}>Live Workspace Context Active</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #00f2fe, #3b82f6)' : 'rgba(255, 255, 255, 0.04)',
                    color: msg.sender === 'user' ? '#040814' : '#f3f4f6',
                    fontWeight: msg.sender === 'user' ? 600 : 400,
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '14px 18px',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Analyzing workspace intelligence...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
            {[
              'Show all electronics expiring within 60 days',
              'Check coverage for my appliances',
              'Give me maintenance advice for high-risk assets'
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                style={{
                  whiteSpace: 'nowrap',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  fontSize: '0.76rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g., 'Is my TV still under warranty?')"
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary" style={{ padding: '0 22px' }}>
              Send
            </button>
          </form>
        </div>

        {/* Right Side: 1-Click Warranty Claim Builder Tool */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '1.4rem' }}>📝</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Claim Preparation Kit</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select an asset and describe the issue to automatically generate proof checklists and drafted claim letters.
            </p>

            <form onSubmit={handleGenerateClaimKit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Asset to Claim</label>
                <select
                  value={selectedAssetForClaim}
                  onChange={(e) => setSelectedAssetForClaim(e.target.value)}
                  className="form-select"
                >
                  {assets.map(a => (
                    <option key={a._id} value={a._id}>{a.brand} {a.assetName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Defect / Malfunction Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Compressor noise / screen display artifacts..."
                  value={claimIssue}
                  onChange={(e) => setClaimIssue(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <button type="submit" disabled={claimLoading || !selectedAssetForClaim} className="btn btn-accent" style={{ width: '100%', padding: '12px' }}>
                {claimLoading ? 'Compiling Kit...' : '⚡ Generate Claim Kit'}
              </button>
            </form>
          </div>

          {/* Generated Claim Preview */}
          {generatedClaimKit && (
            <div className="glass-panel" style={{ border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#a78bfa' }}>
                  Kit Ready: {generatedClaimKit.asset?.brand} {generatedClaimKit.asset?.name}
                </h4>
                <span className={`badge ${generatedClaimKit.asset?.isCovered ? 'badge-active' : 'badge-expired'}`}>
                  {generatedClaimKit.asset?.isCovered ? 'Covered' : 'Expired'}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                <strong>Valid Until:</strong> {generatedClaimKit.asset?.warrantyEndDate}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                {generatedClaimKit.checklist?.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: c.ready ? '#34d399' : '#fbbf24' }}>
                    {c.ready ? '✅' : '⚠️'} {c.item}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedClaimKit.claimEmail?.body || '');
                  alert('Claim email copied to clipboard!');
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                📋 Copy Official Email Draft
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
