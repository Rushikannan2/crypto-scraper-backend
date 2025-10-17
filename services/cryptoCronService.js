const cron = require('node-cron');
const CryptoScraper = require('./cryptoScraper');

/**
 * Cron service for automated cryptocurrency data scraping
 * Handles scheduled scraping tasks and maintenance
 */
class CryptoCronService {
  constructor() {
    this.scraper = new CryptoScraper();
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the cron service
   * @param {string} schedule - Cron schedule expression (default: every hour)
   */
  start(schedule = '0 * * * *') {
    if (this.isRunning) {
      console.log('Crypto cron service is already running');
      return;
    }

    console.log(`Starting crypto cron service with schedule: ${schedule}`);
    
    // Main scraping job
    const scrapingJob = cron.schedule(schedule, async () => {
      console.log('Running scheduled crypto scraping...');
      try {
        const result = await this.scraper.performScraping();
        console.log('Scheduled crypto scraping completed:', result);
      } catch (error) {
        console.error('Scheduled crypto scraping failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Cleanup job (runs daily at 3 AM UTC)
    const cleanupJob = cron.schedule('0 3 * * *', async () => {
      console.log('Running daily crypto cleanup...');
      try {
        const result = await this.scraper.cleanupOldData(24); // Clean data older than 24 hours
        console.log('Daily crypto cleanup completed:', result);
      } catch (error) {
        console.error('Daily crypto cleanup failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Store job references
    this.jobs.set('scraping', scrapingJob);
    this.jobs.set('cleanup', cleanupJob);

    // Start the jobs
    scrapingJob.start();
    cleanupJob.start();
    
    this.isRunning = true;
    console.log('Crypto cron service started successfully');
  }

  /**
   * Stop the cron service
   */
  stop() {
    if (!this.isRunning) {
      console.log('Crypto cron service is not running');
      return;
    }

    console.log('Stopping crypto cron service...');
    
    // Stop all jobs
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} job`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('Crypto cron service stopped');
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }

  /**
   * Trigger immediate scraping (outside of schedule)
   * @returns {Promise<Object>} Scraping result
   */
  async triggerScraping() {
    console.log('Triggering immediate crypto scraping...');
    try {
      const result = await this.scraper.performScraping();
      console.log('Immediate crypto scraping completed:', result);
      return result;
    } catch (error) {
      console.error('Immediate crypto scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Update scraping schedule
   * @param {string} newSchedule - New cron schedule expression
   */
  updateSchedule(newSchedule) {
    if (!this.isRunning) {
      console.log('Crypto cron service is not running');
      return;
    }

    console.log(`Updating crypto scraping schedule to: ${newSchedule}`);
    
    // Stop current scraping job
    const currentJob = this.jobs.get('scraping');
    if (currentJob) {
      currentJob.stop();
    }

    // Create new job with updated schedule
    const newJob = cron.schedule(newSchedule, async () => {
      console.log('Running scheduled crypto scraping with new schedule...');
      try {
        const result = await this.scraper.performScraping();
        console.log('Scheduled crypto scraping completed:', result);
      } catch (error) {
        console.error('Scheduled crypto scraping failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start new job and update reference
    newJob.start();
    this.jobs.set('scraping', newJob);
    
    console.log('Crypto schedule updated successfully');
  }

  /**
   * Perform maintenance tasks
   * @returns {Promise<Object>} Maintenance result
   */
  async performMaintenance() {
    console.log('Performing crypto maintenance tasks...');
    try {
      const cleanupResult = await this.scraper.cleanupOldData(24);
      console.log('Crypto maintenance completed:', cleanupResult);
      return cleanupResult;
    } catch (error) {
      console.error('Crypto maintenance failed:', error.message);
      throw error;
    }
  }
}

module.exports = CryptoCronService;
