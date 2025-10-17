const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

// Import routes
const cryptoRoutes = require('./routes/crypto');

// Import services
const CryptoCronService = require('./services/cryptoCronService');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3000',
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
    environment: config.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API routes
app.use('/api/crypto', cryptoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cryptocurrency Scraper API Server - Production Mode',
    version: '1.0.0',
    mode: 'Production - MongoDB Connected',
    endpoints: {
      health: '/health',
      crypto: '/api/crypto',
      top: '/api/crypto/top',
      latest: '/api/crypto/latest',
      stats: '/api/crypto/stats',
      scrape: 'POST /api/crypto/scrape'
    },
    documentation: 'See README.md for API documentation'
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
    ...(config.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Database connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    
    await mongoose.connect(config.MONGODB_URI);
    
    console.log('✅ MongoDB Atlas connected successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize crypto cron service
const initializeCronService = () => {
  try {
    const cryptoCronService = new CryptoCronService();
    
    // Start crypto cron service with default schedule (every hour)
    cryptoCronService.start('0 * * * *');
    
    console.log('✅ Crypto cron service initialized and started');
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      cryptoCronService.stop();
      mongoose.connection.close();
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      cryptoCronService.stop();
      mongoose.connection.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize crypto cron service:', error.message);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize cron service
    initializeCronService();
    
    // Start HTTP server
    const server = app.listen(config.PORT, () => {
      console.log(`
🚀 Cryptocurrency Scraper Server Started Successfully!
📡 Server running on port ${config.PORT}
🌍 Environment: ${config.NODE_ENV}
📊 Health check: http://localhost:${config.PORT}/health
🔗 API base: http://localhost:${config.PORT}/api
⏰ Crypto scraping schedule: Every hour
💾 Database: MongoDB Atlas Connected
🎯 Ready to fetch live cryptocurrency data!
      `);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
