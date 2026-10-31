const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middlewares/error.middleware');

// Route modules
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const noteRoutes = require('./routes/note.routes');
const labelRoutes = require('./routes/label.routes');
const shareRoutes = require('./routes/share.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching origins
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Also allow any localhost port during development
    if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Dev friendly
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/public', express.static(path.resolve(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    service: 'TDTU Note App Backend API',
    version: '1.0.0'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' không tồn tại trên hệ thống.`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
