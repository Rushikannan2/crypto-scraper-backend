const cron = require('node-cron');
const WebScraper = require('./scraper');

/**
 * Cron service for automated web scraping
 * Handles scheduled scraping tasks and maintenance
 */
class CronService {
  constructor() {
    this.scraper = new WebScraper();
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the cron service
   * @param {string} schedule - Cron schedule expression (default: every 30 minutes)
   */
  start(schedule = '*/30 * * * *') {
    if (this.isRunning) {
      console.log('Cron service is already running');
      return;
    }

    console.log(`Starting cron service with schedule: ${schedule}`);
    
    // Main scraping job
    const scrapingJob = cron.schedule(schedule, async () => {
      console.log('Running scheduled scraping...');
      try {
        const result = await this.scraper.performScraping();
        console.log('Scheduled scraping completed:', result);
      } catch (error) {
        console.error('Scheduled scraping failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Cleanup job (runs daily at 2 AM UTC)
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      console.log('Running daily cleanup...');
      try {
        const result = await this.scraper.cleanupOldArticles(7); // Clean articles older than 7 days
        console.log('Daily cleanup completed:', result);
      } catch (error) {
        console.error('Daily cleanup failed:', error.message);
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
    console.log('Cron service started successfully');
  }

  /**
   * Stop the cron service
   */
  stop() {
    if (!this.isRunning) {
      console.log('Cron service is not running');
      return;
    }

    console.log('Stopping cron service...');
    
    // Stop all jobs
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} job`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('Cron service stopped');
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
    console.log('Triggering immediate scraping...');
    try {
      const result = await this.scraper.performScraping();
      console.log('Immediate scraping completed:', result);
      return result;
    } catch (error) {
      console.error('Immediate scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Update scraping schedule
   * @param {string} newSchedule - New cron schedule expression
   */
  updateSchedule(newSchedule) {
    if (!this.isRunning) {
      console.log('Cron service is not running');
      return;
    }

    console.log(`Updating scraping schedule to: ${newSchedule}`);
    
    // Stop current scraping job
    const currentJob = this.jobs.get('scraping');
    if (currentJob) {
      currentJob.stop();
    }

    // Create new job with updated schedule
    const newJob = cron.schedule(newSchedule, async () => {
      console.log('Running scheduled scraping with new schedule...');
      try {
        const result = await this.scraper.performScraping();
        console.log('Scheduled scraping completed:', result);
      } catch (error) {
        console.error('Scheduled scraping failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start new job and update reference
    newJob.start();
    this.jobs.set('scraping', newJob);
    
    console.log('Schedule updated successfully');
  }

  /**
   * Perform maintenance tasks
   * @returns {Promise<Object>} Maintenance result
   */
  async performMaintenance() {
    console.log('Performing maintenance tasks...');
    try {
      const cleanupResult = await this.scraper.cleanupOldArticles(7);
      console.log('Maintenance completed:', cleanupResult);
      return cleanupResult;
    } catch (error) {
      console.error('Maintenance failed:', error.message);
      throw error;
    }
  }
}

module.exports = CronService;
