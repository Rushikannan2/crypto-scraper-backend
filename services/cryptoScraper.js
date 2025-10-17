const axios = require('axios');
const Crypto = require('../models/Crypto');

/**
 * Cryptocurrency scraper service using CoinGecko API
 * Scrapes live cryptocurrency data and stores it in MongoDB
 */
class CryptoScraper {
  constructor() {
    this.apiBaseUrl = 'https://api.coingecko.com/api/v3';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Scrape cryptocurrency data from CoinGecko API
   * @returns {Promise<Array>} Array of cryptocurrency data
   */
  async scrapeCryptoData() {
    try {
      console.log('Starting cryptocurrency data scraping...');
      
      const response = await axios.get(`${this.apiBaseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        timeout: 15000
      });

      const cryptoData = response.data.map(coin => ({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price || 0,
        marketCap: coin.market_cap || 0,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        rank: coin.market_cap_rank || 0,
        image: coin.image || '',
        timestamp: new Date(),
        isActive: true
      }));

      console.log(`Scraped ${cryptoData.length} cryptocurrencies`);
      return cryptoData;

    } catch (error) {
      console.error('Error during crypto scraping:', error.message);
      throw new Error(`Crypto scraping failed: ${error.message}`);
    }
  }

  /**
   * Save cryptocurrency data to database
   * @param {Array} cryptoData - Array of crypto data to save
   * @returns {Promise<Object>} Save result
   */
  async saveCryptoData(cryptoData) {
    try {
      let savedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const crypto of cryptoData) {
        try {
          // Check if crypto already exists (by symbol and recent timestamp)
          const existingCrypto = await Crypto.findOne({ 
            symbol: crypto.symbol,
            timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
          });
          
          if (existingCrypto) {
            // Update existing crypto with new data
            existingCrypto.price = crypto.price;
            existingCrypto.marketCap = crypto.marketCap;
            existingCrypto.change24h = crypto.change24h;
            existingCrypto.volume24h = crypto.volume24h;
            existingCrypto.rank = crypto.rank;
            existingCrypto.timestamp = crypto.timestamp;
            existingCrypto.isActive = true;
            await existingCrypto.save();
            updatedCount++;
          } else {
            // Create new crypto entry
            const newCrypto = new Crypto(crypto);
            await newCrypto.save();
            savedCount++;
          }
        } catch (error) {
          console.error('Error saving crypto:', error.message);
          skippedCount++;
        }
      }

      return {
        saved: savedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: cryptoData.length
      };

    } catch (error) {
      console.error('Error saving crypto data to database:', error.message);
      throw new Error(`Database save failed: ${error.message}`);
    }
  }

  /**
   * Perform complete crypto scraping operation
   * @returns {Promise<Object>} Operation result
   */
  async performScraping() {
    try {
      console.log('Starting complete crypto scraping operation...');
      
      // Scrape crypto data
      const cryptoData = await this.scrapeCryptoData();
      
      if (cryptoData.length === 0) {
        return {
          success: false,
          message: 'No crypto data found during scraping',
          result: { saved: 0, updated: 0, skipped: 0, total: 0 }
        };
      }

      // Save crypto data to database
      const saveResult = await this.saveCryptoData(cryptoData);
      
      console.log('Crypto scraping operation completed successfully');
      return {
        success: true,
        message: 'Crypto scraping completed successfully',
        result: saveResult
      };

    } catch (error) {
      console.error('Crypto scraping operation failed:', error.message);
      return {
        success: false,
        message: `Crypto scraping failed: ${error.message}`,
        result: { saved: 0, updated: 0, skipped: 0, total: 0 }
      };
    }
  }

  /**
   * Get crypto statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    try {
      const totalCrypto = await Crypto.countDocuments({ isActive: true });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCrypto = await Crypto.countDocuments({
        isActive: true,
        timestamp: { $gte: today }
      });

      const lastScrape = await Crypto.findOne({ isActive: true })
        .sort({ timestamp: -1 })
        .select('timestamp');

      const topCrypto = await Crypto.findOne({ isActive: true })
        .sort({ rank: 1 })
        .select('name price');

      return {
        totalCrypto,
        todayCrypto,
        lastScrape: lastScrape ? lastScrape.timestamp : null,
        topCrypto: topCrypto ? { name: topCrypto.name, price: topCrypto.price } : null
      };

    } catch (error) {
      console.error('Error getting crypto stats:', error.message);
      throw new Error(`Stats failed: ${error.message}`);
    }
  }

  /**
   * Clean up old crypto data (optional maintenance)
   * @param {number} hoursOld - Number of hours old to consider for cleanup
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldData(hoursOld = 24) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

      const result = await Crypto.updateMany(
        { timestamp: { $lt: cutoffDate } },
        { isActive: false }
      );

      console.log(`Marked ${result.modifiedCount} old crypto entries as inactive`);
      return {
        success: true,
        message: `Marked ${result.modifiedCount} old crypto entries as inactive`,
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

module.exports = CryptoScraper;
