import React from 'react';

const About = () => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel">
        <h1 style={{ marginBottom: '20px', fontSize: '2.5rem' }}>About WarrantyHub</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '20px' }}>
          WarrantyHub was created to solve a common everyday pain point: forgetting warranty expiries, service dates, and losing purchase receipts.
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '20px' }}>
          Our mission is to help individuals, families, and property managers monitor their physical assets from purchase to disposal. By offering smart scheduling, health indexes, invoice scanning, and secure vault storage, we eliminate unnecessary repair costs and maximize asset lifespans.
        </p>
      </div>
    </div>
  );
};

export default About;
