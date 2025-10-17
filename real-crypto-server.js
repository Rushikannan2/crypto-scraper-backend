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
  origin: [
    'http://localhost:3000',
    'https://crypto-scraper-frontend.onrender.com',
    'https://crypto-scraper-frontend.onrender.com',
    process.env.FRONTEND_URL || 'https://crypto-scraper-frontend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    api: 'CoinGecko API Integration'
  });
});

// API routes
app.use('/api/crypto', cryptoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cryptocurrency Scraper API Server - Real Data Mode',
    version: '1.0.0',
    mode: 'Production - MongoDB + CoinGecko API',
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
      'MongoDB Atlas integration',
      'Automatic updates every hour',
      'Manual scraping endpoint',
      'Real-time statistics'
    ]
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
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Trying demo mode instead...');
    
    // Fallback to demo mode if MongoDB fails
    process.env.DEMO_MODE = 'true';
    return false;
  }
};

// Initialize crypto cron service
const initializeCronService = () => {
  try {
    const cryptoCronService = new CryptoCronService();
    
    // Start crypto cron service with default schedule (every hour)
    cryptoCronService.start('0 * * * *');
    
    console.log('✅ Crypto cron service initialized and started');
    console.log('⏰ Automatic scraping schedule: Every hour');
    
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
    const dbConnected = await connectDB();
    
    if (dbConnected !== false) {
      // Initialize cron service only if database is connected
      initializeCronService();
    }
    
    // Start HTTP server
    const server = app.listen(config.PORT, () => {
      console.log(`
🚀 Cryptocurrency Scraper Server Started Successfully!
📡 Server running on port ${config.PORT}
🌍 Environment: ${config.NODE_ENV}
📊 Health check: http://localhost:${config.PORT}/health
🔗 API base: http://localhost:${config.PORT}/api
⏰ Crypto scraping schedule: Every hour
💾 Database: ${dbConnected !== false ? 'MongoDB Atlas Connected' : 'Demo Mode - No Database Required'}
🎯 Ready to fetch live cryptocurrency data from CoinGecko API!
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
