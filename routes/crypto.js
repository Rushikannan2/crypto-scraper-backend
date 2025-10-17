const express = require('express');
const router = express.Router();
const Crypto = require('../models/Crypto');
const CryptoScraper = require('../services/cryptoScraper');

// Initialize crypto scraper instance
const cryptoScraper = new CryptoScraper();

/**
 * GET /api/crypto
 * Fetch all cryptocurrency data with pagination and optional search
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'rank';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { symbol: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const cryptoData = await Crypto.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude version field

    // Get total count for pagination
    const total = await Crypto.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: cryptoData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching crypto data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crypto data',
      error: error.message
    });
  }
});

/**
 * GET /api/crypto/top
 * Fetch top cryptocurrencies by market cap
 */
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const cryptoData = await Crypto.getTopCrypto(limit);

    res.json({
      success: true,
      data: cryptoData,
      count: cryptoData.length
    });

  } catch (error) {
    console.error('Error fetching top crypto:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top cryptocurrencies',
      error: error.message
    });
  }
});

/**
 * GET /api/crypto/latest
 * Fetch latest cryptocurrency data
 */
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const cryptoData = await Crypto.getLatestPrices(limit);

    res.json({
      success: true,
      data: cryptoData,
      count: cryptoData.length
    });

  } catch (error) {
    console.error('Error fetching latest crypto:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest crypto data',
      error: error.message
    });
  }
});

/**
 * GET /api/crypto/symbol/:symbol
 * Get specific cryptocurrency by symbol
 */
router.get('/symbol/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const crypto = await Crypto.getBySymbol(symbol);
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        message: 'Cryptocurrency not found'
      });
    }

    res.json({
      success: true,
      data: crypto
    });

  } catch (error) {
    console.error('Error fetching crypto by symbol:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cryptocurrency',
      error: error.message
    });
  }
});

/**
 * GET /api/crypto/stats
 * Get cryptocurrency statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await cryptoScraper.getStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching crypto stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

/**
 * POST /api/crypto/scrape
 * Trigger manual crypto data scraping
 */
router.post('/scrape', async (req, res) => {
  try {
    console.log('Manual crypto scraping triggered');
    
    const result = await cryptoScraper.performScraping();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        data: result.result
      });
    }

  } catch (error) {
    console.error('Error during manual crypto scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Manual crypto scraping failed',
      error: error.message
    });
  }
});

/**
 * GET /api/crypto/:id
 * Get a specific cryptocurrency by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const crypto = await Crypto.findById(req.params.id).select('-__v');
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        message: 'Cryptocurrency not found'
      });
    }

    res.json({
      success: true,
      data: crypto
    });

  } catch (error) {
    console.error('Error fetching crypto:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cryptocurrency',
      error: error.message
    });
  }
});

/**
 * DELETE /api/crypto/:id
 * Soft delete a cryptocurrency (mark as inactive)
 */
router.delete('/:id', async (req, res) => {
  try {
    const crypto = await Crypto.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!crypto) {
      return res.status(404).json({
        success: false,
        message: 'Cryptocurrency not found'
      });
    }

    res.json({
      success: true,
      message: 'Cryptocurrency deleted successfully',
      data: crypto
    });

  } catch (error) {
    console.error('Error deleting crypto:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting cryptocurrency',
      error: error.message
    });
  }
});

module.exports = router;
