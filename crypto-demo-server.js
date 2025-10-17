const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import demo routes
const cryptoRoutes = require('./routes/crypto-demo');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'crypto-demo',
    database: 'Demo Mode - No Database Required'
  });
});

// API routes
app.use('/api/crypto', cryptoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cryptocurrency Scraper API Server - DEMO MODE',
    version: '1.0.0',
    mode: 'DEMO - No Database Required',
    endpoints: {
      health: '/health',
      crypto: '/api/crypto',
      top: '/api/crypto/top',
      latest: '/api/crypto/latest',
      stats: '/api/crypto/stats',
      scrape: 'POST /api/crypto/scrape'
    },
    note: 'This is a demo version with sample cryptocurrency data. No MongoDB connection required!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    stack: error.stack
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🎉 DEMO Cryptocurrency Scraper Server Started Successfully!
📡 Server running on port ${PORT}
🌍 Environment: DEMO MODE
📊 Health check: http://localhost:${PORT}/health
🔗 API base: http://localhost:${PORT}/api
💾 Database: DEMO MODE - No Database Required!
🎯 Sample cryptocurrency data loaded and ready to use

🚀 Next steps:
1. Start the frontend: cd client && npm start
2. Open http://localhost:3000 in your browser
3. Enjoy the crypto dashboard with sample data!
  `);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

module.exports = app;
