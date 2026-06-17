import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import MyAssets from './pages/MyAssets';
import AddAsset from './pages/AddAsset';
import AssetDetails from './pages/AssetDetails';
import DocumentsVault from './pages/DocumentsVault';
import Notifications from './pages/Notifications';
import FamilyWorkspace from './pages/FamilyWorkspace';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const info = localStorage.getItem('userInfo');
    if (info) {
      setUserInfo(JSON.parse(info));
    }
    setReady(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    window.location.href = '/login';
  };

  if (!ready) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <h2>Starting WarrantyHub...</h2>
      </div>
    );
  }

  // Route protection helpers
  const PrivateRoute = ({ children }) => {
    return userInfo ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }) => {
    return userInfo && userInfo.role === 'admin' ? children : <Navigate to="/dashboard" />;
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar userInfo={userInfo} onLogout={handleLogout} />
        
        {/* Main Content Area */}
        <div style={{ flex: 1, paddingBottom: '60px' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home userInfo={userInfo} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={userInfo ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={setUserInfo} />} />
            <Route path="/register" element={userInfo ? <Navigate to="/dashboard" /> : <Register onLoginSuccess={setUserInfo} />} />

            {/* Private User Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/assets" element={<PrivateRoute><MyAssets /></PrivateRoute>} />
            <Route path="/assets/add" element={<PrivateRoute><AddAsset /></PrivateRoute>} />
            <Route path="/assets/:id" element={<PrivateRoute><AssetDetails /></PrivateRoute>} />
            <Route path="/vault" element={<PrivateRoute><DocumentsVault /></PrivateRoute>} />
            <Route path="/workspace" element={<PrivateRoute><FamilyWorkspace userInfo={userInfo} /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile userInfo={userInfo} onProfileUpdate={setUserInfo} /></PrivateRoute>} />

            {/* Private Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '24px',
          borderTop: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          marginTop: 'auto'
        }}>
          &copy; {new Date().getFullYear()} WarrantyHub Platform. All Rights Reserved.
        </footer>
      </div>
    </Router>
  );
};

export default App;
