// Local configuration for development
module.exports = {
  // Use a local MongoDB or a simpler connection string
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/webscraper_local',
  
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Scraping Configuration
  SCRAPE_INTERVAL_MINUTES: 30,
  TARGET_URL: 'https://news.ycombinator.com',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3000'
};
