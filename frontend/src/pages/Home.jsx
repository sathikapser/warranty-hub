import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ userInfo }) => {
  return (
    <div style={{ padding: '30px 20px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div className="glass-panel-elevated" style={{
        textAlign: 'center',
        padding: '90px 40px',
        marginBottom: '60px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '36px',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        {/* Glowing Aurora Spheres */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.22) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(70px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(0, 242, 254, 0.12)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          color: '#00f2fe',
          fontSize: '0.84rem',
          fontWeight: 700,
          marginBottom: '24px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1
        }}>
          <span className="pulse-cyan" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe' }} />
          <span>Next-Gen Asset & Warranty Intelligence</span>
        </div>

        <h1 style={{
          fontSize: '3.6rem',
          marginBottom: '24px',
          lineHeight: 1.12,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          zIndex: 1,
          position: 'relative'
        }}>
          Intelligent Asset Lifecycle & <br />
          <span className="gradient-text-aurora">Warranty Protection Engine</span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '740px',
          margin: '0 auto 40px auto',
          lineHeight: 1.65,
          zIndex: 1,
          position: 'relative'
        }}>
          WarrantyHub 2.5 is the enterprise-grade ecosystem to safeguard appliances, electronics, vehicles, and machinery. Never forfeit a warranty claim again with Google-verified security, OCR receipt extraction, and AI claim assistance.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          zIndex: 1,
          position: 'relative',
          flexWrap: 'wrap'
        }}>
          {userInfo ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Launch Command Center →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In with Google
              </Link>
            </>
          )}
        </div>

        {/* Feature Highlights Ticker */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          marginTop: '50px',
          paddingTop: '30px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#00f2fe' }}>✓</span> Google OAuth Verified
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981' }}>✓</span> Zero-Loss Warranty Deadlines
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#8b5cf6' }}>✓</span> AI Claim Kit Generator
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ec4899' }}>✓</span> OCR Invoice Auto-Scan
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Core Superpowers</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginTop: '6px' }}>
          Everything needed to monitor, protect, and maximize the lifespan of your physical investments
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '60px'
      }}>
        <div className="glass-panel glass-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            ⏱️
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>Warranty & AMC Radar</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Never miss an expiring guarantee or AMC renewal. Continuous proactive alerts at 30, 15, 7, and 1-day urgency levels.
          </p>
        </div>

        <div className="glass-panel glass-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            🤖
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>AI Claim & Diagnostics Advisor</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Auto-generate legal claim letters, detect fault symptoms, and estimate replacement vs repair cost benefits instantly.
          </p>
        </div>

        <div className="glass-panel glass-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'rgba(236, 72, 153, 0.15)',
            border: '1px solid rgba(236, 72, 153, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            📸
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>OCR Instant Bill Reader</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Snap an invoice receipt or upload a PDF; client-side neural OCR automatically extracts brand, serials, and dates.
          </p>
        </div>

        <div className="glass-panel glass-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            📈
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>Dynamic Asset Health Index</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Real-time algorithmic scoring (0-100) evaluating appliance age, service frequency, and document completeness.
          </p>
        </div>

        <div className="glass-panel glass-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            👥
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>Family & Team Workspace</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Collaborate on maintenance, delegate appliance custody to household members, and share synced documents effortlessly.
          </p>
        </div>

        <div className="glass-panel glass-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            📱
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>Smart QR Appliance Tags</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Print high-resolution QR badges for physical appliances. Anyone scanning with a smartphone can view service logs instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
