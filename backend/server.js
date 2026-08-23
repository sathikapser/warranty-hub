const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { startScheduler } = require('./utils/scheduler');
const { initSocket } = require('./utils/socket');
const { apiLimiter, sanitizeInput } = require('./middleware/security');

// Route Handlers
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const trackerRoutes = require('./routes/trackers');
const documentRoutes = require('./routes/documents');
const notificationRoutes = require('./routes/notifications');
const familyRoutes = require('./routes/family');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const serviceRequestRoutes = require('./routes/serviceRequests');
const activityRoutes = require('./routes/activity');
const calendarRoutes = require('./routes/calendar');
const expenseRoutes = require('./routes/expenses');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with server
initSocket(server);

// Security & Base Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(sanitizeInput);

// Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test' && !req.url.startsWith('/uploads')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Ensure local uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Apply general API Rate Limiter
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api', trackerRoutes); // /api/warranties, /api/services, /api/insurance, /api/amc
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/expenses', expenseRoutes);

// Base Health & Capabilities Route
app.get('/', (req, res) => {
  res.json({ 
    name: 'WarrantyHub 2.0 Enterprise Engine',
    status: 'online',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
    security: {
      rateLimiting: 'active',
      helmet: 'enabled',
      googleAuth: 'verified'
    },
    capabilities: [
      'google_oauth_verification',
      'assets_inventory', 
      'warranties_tracking', 
      'services_scheduling', 
      'ai_intelligence_assistant', 
      'ocr_receipt_scan', 
      'family_workspace', 
      'realtime_socket_events', 
      'calendar_ics_sync', 
      'tco_expense_analytics'
    ]
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start scheduler
startScheduler();

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${statusCode} - ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🛡️  WarrantyHub 2.5 Enterprise Server Active`);
  console.log(`🚀  Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐  Google OAuth Verification: Ready`);
  console.log(`⚡  Real-Time Socket Engine: Ready`);
  console.log(`=================================================`);
});

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server };
