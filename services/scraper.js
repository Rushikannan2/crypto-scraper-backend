const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');

/**
 * Web scraper service for Hacker News
 * Scrapes articles from Hacker News and stores them in MongoDB
 */
class WebScraper {
  constructor() {
    this.baseUrl = 'https://news.ycombinator.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Scrape articles from Hacker News
   * @returns {Promise<Array>} Array of scraped articles
   */
  async scrapeArticles() {
    try {
      console.log('Starting web scraping...');
      
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      // Parse the main story table
      $('.athing').each((index, element) => {
        try {
          const $element = $(element);
          const $nextRow = $element.next();
          
          // Extract article data
          const titleElement = $element.find('.titleline > a').first();
          const title = titleElement.text().trim();
          const link = titleElement.attr('href');
          
          // Handle relative URLs
          const fullLink = link && link.startsWith('http') 
            ? link 
            : link && link.startsWith('/') 
              ? `https://news.ycombinator.com${link}`
              : link;

          // Extract score and comments from the next row
          const scoreText = $nextRow.find('.score').text();
          const score = scoreText ? parseInt(scoreText.split(' ')[0]) : 0;
          
          const commentsElement = $nextRow.find('a[href*="item?id="]').last();
          const commentsText = commentsElement.text();
          const comments = commentsText.includes('comment') 
            ? parseInt(commentsText.split(' ')[0]) || 0 
            : 0;

          // Extract author
          const author = $nextRow.find('.hnuser').text().trim() || 'Unknown';

          if (title && fullLink) {
            articles.push({
              title,
              link: fullLink,
              score,
              comments,
              author,
              scrapedAt: new Date(),
              publishedAt: new Date() // Hacker News doesn't provide exact publish dates
            });
          }
        } catch (error) {
          console.error('Error parsing article:', error.message);
        }
      });

      console.log(`Scraped ${articles.length} articles`);
      return articles;

    } catch (error) {
      console.error('Error during scraping:', error.message);
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  /**
   * Save articles to database
   * @param {Array} articles - Array of articles to save
   * @returns {Promise<Object>} Save result
   */
  async saveArticles(articles) {
    try {
      let savedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const articleData of articles) {
        try {
          // Check if article already exists
          const existingArticle = await Article.findOne({ link: articleData.link });
          
          if (existingArticle) {
            // Update existing article with new data
            existingArticle.score = articleData.score;
            existingArticle.comments = articleData.comments;
            existingArticle.scrapedAt = articleData.scrapedAt;
            existingArticle.isActive = true;
            await existingArticle.save();
            updatedCount++;
          } else {
            // Create new article
            const article = new Article(articleData);
            await article.save();
            savedCount++;
          }
        } catch (error) {
          console.error('Error saving article:', error.message);
          skippedCount++;
        }
      }

      return {
        saved: savedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: articles.length
      };

    } catch (error) {
      console.error('Error saving articles to database:', error.message);
      throw new Error(`Database save failed: ${error.message}`);
    }
  }

  /**
   * Perform complete scraping operation
   * @returns {Promise<Object>} Operation result
   */
  async performScraping() {
    try {
      console.log('Starting complete scraping operation...');
      
      // Scrape articles
      const articles = await this.scrapeArticles();
      
      if (articles.length === 0) {
        return {
          success: false,
          message: 'No articles found during scraping',
          result: { saved: 0, updated: 0, skipped: 0, total: 0 }
        };
      }

      // Save articles to database
      const saveResult = await this.saveArticles(articles);
      
      console.log('Scraping operation completed successfully');
      return {
        success: true,
        message: 'Scraping completed successfully',
        result: saveResult
      };

    } catch (error) {
      console.error('Scraping operation failed:', error.message);
      return {
        success: false,
        message: `Scraping failed: ${error.message}`,
        result: { saved: 0, updated: 0, skipped: 0, total: 0 }
      };
    }
  }

  /**
   * Clean up old articles (optional maintenance)
   * @param {number} daysOld - Number of days old to consider for cleanup
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldArticles(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Article.updateMany(
        { scrapedAt: { $lt: cutoffDate } },
        { isActive: false }
      );

      console.log(`Marked ${result.modifiedCount} old articles as inactive`);
      return {
        success: true,
        message: `Marked ${result.modifiedCount} old articles as inactive`,
        modifiedCount: result.modifiedCount
      };

    } catch (error) {
      console.error('Error during cleanup:', error.message);
      return {
        success: false,
        message: `Cleanup failed: ${error.message}`,
        modifiedCount: 0
      };
    }
  }
}

module.exports = WebScraper;
