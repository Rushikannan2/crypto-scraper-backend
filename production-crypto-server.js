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

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection with fallback to demo mode
let isConnected = false;
let demoMode = false;

const connectToMongoDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    demoMode = false;
    console.log('✅ Connected to MongoDB Atlas successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Switching to demo mode...');
    isConnected = false;
    demoMode = true;
  }
};

// Initialize MongoDB connection
connectToMongoDB();

// API routes
app.use('/api/crypto', cryptoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: isConnected ? 'Connected' : 'Demo Mode',
    api: 'CoinGecko API Integration'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cryptocurrency Scraper API Server - Production Mode',
    version: '1.0.0',
    mode: isConnected ? 'Production - MongoDB + CoinGecko API' : 'Demo Mode - Sample Data',
    endpoints: {
      health: '/health',
      crypto: '/api/crypto',
      top: '/api/crypto/top',
      latest: '/api/crypto/latest',
      stats: '/api/crypto/stats',
      scrape: 'POST /api/crypto/scrape'
    },
    documentation: 'See README.md for API documentation',
    features: [
      'Live cryptocurrency data from CoinGecko API',
      isConnected ? 'MongoDB Atlas integration' : 'Demo mode with sample data',
      'Automatic updates every hour',
      'Manual scraping endpoint',
      'Real-time statistics'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: {
      health: '/health',
      crypto: '/api/crypto',
      stats: '/api/crypto/stats'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log('🚀 Cryptocurrency Scraper Server Started Successfully!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`⏰ Crypto scraping schedule: Every hour`);
  console.log(`💾 Database: ${isConnected ? 'MongoDB Atlas Connected' : 'Demo Mode - No Database Required'}`);
  console.log('🎯 Ready to fetch live cryptocurrency data from CoinGecko API!');
});

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
      if (isConnected) {
        mongoose.connection.close();
      }
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      cryptoCronService.stop();
      if (isConnected) {
        mongoose.connection.close();
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize crypto cron service:', error.message);
  }
};

// Initialize cron service after a short delay
setTimeout(initializeCronService, 2000);

module.exports = app;
