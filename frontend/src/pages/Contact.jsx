import React from 'react';

const Contact = () => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel">
        <h1 style={{ marginBottom: '20px', fontSize: '2.5rem' }}>Contact Us</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          Have questions or need assistance? Get in touch with our team.
        </p>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" placeholder="Your Name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-input" rows="5" placeholder="Write your message here..." style={{ resize: 'vertical' }}></textarea>
          </div>
          <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Send Message</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
