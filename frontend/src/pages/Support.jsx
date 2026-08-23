import React, { useState } from 'react';

const Support = () => {
  // Contact Form state
  const [name, setName] = useState('');
  const [email, setMail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I am your WarrantyHub AI Assistant. How can I help you manage your assets or track warranties today?" }
  ]);

  // FAQs List
  const [faqOpenIdx, setFaqOpenIdx] = useState(null);
  const faqs = [
    { q: "What is Warranty Tracking?", a: "Warranty tracking allows you to register products, specify purchase dates and warranty terms, and receive automated notifications before they expire." },
    { q: "How does the OCR Scanner work?", a: "When adding an asset, you can upload an image of the invoice. Our system processes it via Tesseract OCR to automatically fill in details like product name, price, brand, and date." },
    { q: "Can I share my assets with family?", a: "Yes! In the Family Workspace tab, you can invite family members using their email address. Once linked, they will have shared access to all assets and notification updates." },
    { q: "What are AMC and Insurance trackers?", a: "AMC stands for Annual Maintenance Contract. Together with Insurance, you can record premium amounts, providers, and policy numbers to keep a holistic check on your assets." },
    { q: "How do I configure reminder preferences?", a: "Go to your Profile tab to configure your notification settings. You can opt-in/out of Email or SMS alerts, and set exactly how many days before expiration you want to receive alerts." }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setName('');
    setMail('');
    setSubject('');
    setMessage('');
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    // Pre-programmed bot replies
    setTimeout(() => {
      let botResponse = "I'm not sure about that. Try asking about 'OCR', 'family', 'notifications', or 'warranties'!";
      const textLower = userMsg.toLowerCase();

      if (textLower.includes('ocr') || textLower.includes('scan') || textLower.includes('receipt')) {
        botResponse = "The OCR Receipt scanner extracts info automatically when creating an asset. Just upload a photo/PDF of your bill, and click 'Scan Receipt'!";
      } else if (textLower.includes('family') || textLower.includes('share') || textLower.includes('workspace')) {
        botResponse = "To sync with family, head over to the 'Family Workspace' and send an invite to your family member's email. When they sign up, they will join your workspace!";
      } else if (textLower.includes('notification') || textLower.includes('reminder') || textLower.includes('sms') || textLower.includes('email')) {
        botResponse = "You can manage notification channels and custom reminder intervals (e.g. 7 days, 1 day) in the 'Profile & Settings' page.";
      } else if (textLower.includes('warranty') || textLower.includes('expired') || textLower.includes('renewal')) {
        botResponse = "You can track warranty status from your Dashboard, which features color-coded statuses. Use the quick-actions to renew directly from brand portals.";
      } else if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('hey')) {
        botResponse = "Hi there! I am here to help you manage your warranties. Ask me about OCR receipts, calendar integrations, or adding family members!";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 800);
  };

  const toggleFaq = (idx) => {
    setFaqOpenIdx(faqOpenIdx === idx ? null : idx);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Page Title */}
      <div className="glass-panel" style={{
        marginBottom: '30px',
        padding: '30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8), rgba(10, 14, 23, 0.9))'
      }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Support Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Get instant answers from our AI assistant, explore FAQs, or get in touch with our helpdesk.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        
        {/* FAQs & Contact Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Accordion FAQs */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Frequently Asked Questions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {faqs.map((faq, idx) => (
                <div key={idx} style={{ 
                  borderBottom: '1px solid var(--border-color)', 
                  paddingBottom: '12px'
                }}>
                  <button 
                    onClick={() => toggleFaq(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span>{faqOpenIdx === idx ? '▲' : '▼'}</span>
                  </button>
                  {faqOpenIdx === idx && (
                    <p style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: '0.9rem', 
                      marginTop: '10px',
                      lineHeight: 1.4
                    }}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Helpdesk Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Contact Helpdesk</h3>
            
            {contactSuccess && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--success)',
                color: '#34d399',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '0.85rem'
              }}>Your message has been sent successfully! Our team will respond shortly.</div>
            )}

            <form onSubmit={handleContactSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    required 
                    value={email} 
                    onChange={e => setMail(e.target.value)} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  required 
                  value={message} 
                  onChange={e => setMessage(e.target.value)}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Submit Message
              </button>
            </form>
          </div>

        </div>

        {/* AI Chatbot Column */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '5px' }}>💬 AI Warranty Assistant</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '15px' }}>Instant support on OCR scan issues, sharing warranties, and email notifications.</p>
          
          {/* Message Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--bg-input)',
            borderRadius: '10px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '15px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: msg.sender === 'user' ? '#000' : '#fff',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                boxShadow: msg.sender === 'user' ? '0 2px 10px rgba(0, 242, 254, 0.2)' : 'none'
              }}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Form Area */}
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask me: 'How do I invite family?'..." 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
              Send
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Support;
