// Configuration file for the server
module.exports = {
  // MongoDB Atlas Connection
  MONGODB_URI: 'mongodb+srv://kannanrushi05_db_user:V9HCHCbKVRB14uEq@cluster0.p2iuqpr.mongodb.net/web?retryWrites=true&w=majority&appName=Cluster0',
  
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Scraping Configuration
  SCRAPE_INTERVAL_MINUTES: 30,
  TARGET_URL: 'https://news.ycombinator.com',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3000'
};
