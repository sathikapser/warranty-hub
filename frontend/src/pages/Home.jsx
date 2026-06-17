import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ userInfo }) => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div className="glass-panel" style={{
        textAlign: 'center',
        padding: '80px 40px',
        marginBottom: '60px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '30px'
      }}>
        {/* Glowing background highlights */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: 'rgba(0, 242, 254, 0.15)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          zIndex: 0
        }}></div>

        <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', lineHeight: 1.1, zIndex: 1, position: 'relative' }}>
          Smart Asset Lifecycle <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Management Platform</span>
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '700px',
          margin: '0 auto 40px auto',
          lineHeight: 1.6,
          zIndex: 1,
          position: 'relative'
        }}>
          WarrantyHub helps you track, organize, and maintain all your assets (appliances, electronics, vehicles, and industrial machinery). Monitor warranties, services, policies, and scan invoices instantly.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', zIndex: 1, position: 'relative' }}>
          {userInfo ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '40px' }}>Features that Empower You</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        marginBottom: '60px'
      }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '2.5rem' }}>⏱️</span>
          <h3>Warranty & AMC Tracking</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Never miss a warranty expiration or AMC renewal. Get automated email and in-app alerts at 30, 15, 7, and 1 day thresholds.
          </p>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
          <h3>OCR Invoice Scanner</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Upload purchase receipts and let our integrated OCR scanner automatically extract brand, purchase date, invoice number, and values.
          </p>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '2.5rem' }}>📈</span>
          <h3>Asset Health Score</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Calculate a dynamic health index from 0 to 100 based on asset age, repair occurrences, and scheduled service adherence.
          </p>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '2.5rem' }}>👥</span>
          <h3>Family Workspace</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Share asset visibility and maintenance duties with family members. Assign specific assets to different individuals.
          </p>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '2.5rem' }}>🗃️</span>
          <h3>Document Vault</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Store all your purchase bills, warranty cards, insurance policies, and service invoices in a secure, organized vault.
          </p>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '2.5rem' }}>📱</span>
          <h3>QR Asset Profile</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Generate a unique QR code for each asset. Simply scan it with a smartphone camera to instantly view specs, documents, and logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
