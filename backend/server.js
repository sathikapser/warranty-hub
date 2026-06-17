const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { startScheduler } = require('./utils/scheduler');

const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const trackerRoutes = require('./routes/trackers');
const documentRoutes = require('./routes/documents');
const notificationRoutes = require('./routes/notifications');
const familyRoutes = require('./routes/family');
const adminRoutes = require('./routes/admin');

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Allow React app to access
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure local uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api', trackerRoutes); // Exposes /api/warranties, /api/services, etc.
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/admin', adminRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'WarrantyHub API running...' });
});

// Start scheduler
startScheduler();

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
