import React, { useState, useRef, useEffect } from 'react';
import api from '../api';

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '👋 Hello! I am your **WarrantyHub AI Intelligence Assistant**. Ask me anything about your household asset warranties, maintenance schedules, or click a prompt below to prepare a warranty claim kit!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimKitModal, setClaimKitModal] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    '🛡️ Which warranties expire in 60 days?',
    '📝 Draft a warranty claim for an appliance',
    '🛠️ Predict maintenance for high-risk assets',
    '📊 Show overall warranty health breakdown'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: query });
      
      const aiMsg = {
        sender: 'ai',
        text: data.reply,
        actionType: data.actionType,
        data: data.data
      };

      setMessages(prev => [...prev, aiMsg]);

      // If claim kit generated, allow user to open the full modal
      if (data.actionType === 'claim_kit' && data.data) {
        setClaimKitModal(data.data);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ Sorry, I encountered an issue accessing asset intelligence. Please make sure the backend server is running.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 9000,
          background: 'linear-gradient(135deg, #00f2fe, #8b5cf6)',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 20px',
          color: '#070a13',
          fontWeight: 700,
          fontSize: '0.92rem',
          boxShadow: '0 8px 30px rgba(0, 242, 254, 0.4), 0 0 20px rgba(139, 92, 246, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'var(--transition-smooth)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
      >
        <span style={{ fontSize: '1.2rem' }}>🤖</span>
        <span>AI Assistant</span>
      </button>

      {/* Slide-in Assistant Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '28px',
            width: '420px',
            maxWidth: 'calc(100vw - 40px)',
            height: '580px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 9001,
            background: 'rgba(10, 15, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00f2fe, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}>
                🤖
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>Warranty Intelligence AI</h3>
                <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="pulse-green" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  Live Workspace Connected
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.3rem',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              &times;
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
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
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, #00f2fe, #3b82f6)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: msg.sender === 'user' ? '#040814' : '#f3f4f6',
                    fontWeight: msg.sender === 'user' ? 600 : 400,
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '12px 16px',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.text}
                </div>

                {msg.actionType === 'claim_kit' && msg.data && (
                  <button
                    onClick={() => setClaimKitModal(msg.data)}
                    className="btn btn-primary btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '0.78rem' }}
                  >
                    📋 View Full Claim Kit & Email Draft
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '10px 16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="pulse-green" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2fe' }} />
                Consulting warranty intelligence...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{
            padding: '8px 16px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            background: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                style={{
                  whiteSpace: 'nowrap',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.3)'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about warranty, claims, service..."
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary btn-sm"
              style={{ padding: '0 16px' }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Claim Kit Detailed Modal */}
      {claimKitModal && (
        <div className="modal-overlay" onClick={() => setClaimKitModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Warranty Claim Kit: {claimKitModal.asset?.brand} {claimKitModal.asset?.name}
                </h3>
              </div>
              <button
                onClick={() => setClaimKitModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Checklist */}
            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Required Claim Checklist
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {claimKitModal.checklist?.map((item, idx) => (
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

            {/* Pre-drafted Claim Email */}
            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pre-Drafted Official Claim Email
            </h4>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '0.82rem',
              color: '#f3f4f6',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '16px'
            }}>
              <strong>To:</strong> {claimKitModal.claimEmail?.to}<br />
              <strong>Subject:</strong> {claimKitModal.claimEmail?.subject}<br /><br />
              {claimKitModal.claimEmail?.body}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(claimKitModal.claimEmail?.body || '');
                  alert('Claim email copied to clipboard!');
                }}
                className="btn btn-secondary btn-sm"
              >
                📋 Copy Email Text
              </button>
              <a
                href={`mailto:${claimKitModal.claimEmail?.to}?subject=${encodeURIComponent(claimKitModal.claimEmail?.subject || '')}&body=${encodeURIComponent(claimKitModal.claimEmail?.body || '')}`}
                className="btn btn-primary"
              >
                ✉️ Open in Mail Client
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
