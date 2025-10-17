const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config-local');

// Import routes
const articleRoutes = require('./routes/articles');

// Import services
const CronService = require('./services/cronService');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
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
app.use('/api/articles', articleRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Web Scraper API Server - Local Development',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      articles: '/api/articles',
      recent: '/api/articles/recent',
      top: '/api/articles/top',
      stats: '/api/articles/stats',
      scrape: 'POST /api/articles/scrape'
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

// Database connection with fallback
const connectDB = async () => {
  try {
    console.log('Connecting to database...');
    
    // Try the configured MongoDB URI first
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('Database connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Database disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('Database reconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Trying to continue without database...');
    console.log('   The server will start but scraping won\'t work until database is connected');
  }
};

// Initialize cron service (only if database is connected)
const initializeCronService = () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cronService = new CronService();
      cronService.start('*/30 * * * *'); // Every 30 minutes
      console.log('✅ Cron service initialized and started');
    } else {
      console.log('⚠️ Cron service not started - database not connected');
    }
  } catch (error) {
    console.error('❌ Failed to initialize cron service:', error.message);
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
🚀 Web Scraper Server Started Successfully!
📡 Server running on port ${config.PORT}
🌍 Environment: ${config.NODE_ENV}
📊 Health check: http://localhost:${config.PORT}/health
🔗 API base: http://localhost:${config.PORT}/api
⏰ Scraping schedule: Every 30 minutes
💾 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}
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
