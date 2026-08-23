import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');
    if (err) setError(err);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      onLoginSuccess(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    onLoginSuccess(data);
    navigate('/dashboard');
  };

  const handleDemoLogin = async () => {
    setEmail('demo@warrantyhub.io');
    setPassword('demopass123');
    setLoading(true);
    setError('');
    try {
      // Try login or auto-register demo user
      try {
        const { data } = await api.post('/auth/login', { email: 'demo@warrantyhub.io', password: 'demopass123' });
        localStorage.setItem('userInfo', JSON.stringify(data));
        onLoginSuccess(data);
        navigate('/dashboard');
      } catch (loginErr) {
        const { data } = await api.post('/auth/register', { name: 'Demo Explorer', email: 'demo@warrantyhub.io', password: 'demopass123' });
        localStorage.setItem('userInfo', JSON.stringify(data));
        onLoginSuccess(data);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Unable to login demo account: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 160px)',
      padding: '30px 20px',
      position: 'relative'
    }}>
      {/* Decorative Aurora Orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '280px',
        height: '280px',
        background: 'rgba(0, 242, 254, 0.15)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: '300px',
        height: '300px',
        background: 'rgba(139, 92, 246, 0.15)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel-elevated" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '42px 36px',
        borderRadius: '28px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Brand Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #00f2fe, #8b5cf6)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: '0 8px 24px rgba(0, 242, 254, 0.35)',
            marginBottom: '14px'
          }}>
            🛡️
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Welcome <span className="gradient-text">Back</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            Sign in to access your Asset & Warranty Command Center
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Integration */}
        <div style={{ marginBottom: '20px' }}>
          <GoogleAuthButton
            text="Continue with Google"
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or sign in with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <span>📧 Email Address</span>
            </label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">
                <span>🔒 Password</span>
              </label>
              <Link to="/contact" style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none' }}>
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '1rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace →'}
          </button>
        </form>

        {/* 1-Click Demo Explore Button */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '0.84rem', borderStyle: 'dashed' }}
          >
            ✨ Quick Demo Account Access
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '26px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
