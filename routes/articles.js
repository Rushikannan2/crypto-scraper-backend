const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const WebScraper = require('../services/scraper');

// Initialize scraper instance
const scraper = new WebScraper();

/**
 * GET /api/articles
 * Fetch all active articles with pagination and optional search
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'scrapedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const articles = await Article.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude version field

    // Get total count for pagination
    const total = await Article.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: articles,
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
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
});

/**
 * GET /api/articles/recent
 * Fetch recent articles (last 24 hours)
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const hours = parseInt(req.query.hours) || 24;
    
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const articles = await Article.find({
      isActive: true,
      scrapedAt: { $gte: cutoffDate }
    })
    .sort({ scrapedAt: -1 })
    .limit(limit)
    .select('-__v');

    res.json({
      success: true,
      data: articles,
      count: articles.length
    });

  } catch (error) {
    console.error('Error fetching recent articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent articles',
      error: error.message
    });
  }
});

/**
 * GET /api/articles/top
 * Fetch top articles by score
 */
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const articles = await Article.find({
      isActive: true,
      scrapedAt: { $gte: cutoffDate },
      score: { $gt: 0 }
    })
    .sort({ score: -1, scrapedAt: -1 })
    .limit(limit)
    .select('-__v');

    res.json({
      success: true,
      data: articles,
      count: articles.length
    });

  } catch (error) {
    console.error('Error fetching top articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top articles',
      error: error.message
    });
  }
});

/**
 * GET /api/articles/stats
 * Get scraping statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments({ isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayArticles = await Article.countDocuments({
      isActive: true,
      scrapedAt: { $gte: today }
    });

    const lastScrape = await Article.findOne({ isActive: true })
      .sort({ scrapedAt: -1 })
      .select('scrapedAt');

    const avgScore = await Article.aggregate([
      { $match: { isActive: true, score: { $gt: 0 } } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalArticles,
        todayArticles,
        lastScrape: lastScrape ? lastScrape.scrapedAt : null,
        averageScore: avgScore.length > 0 ? Math.round(avgScore[0].avgScore) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

/**
 * POST /api/articles/scrape
 * Trigger manual scraping
 */
router.post('/scrape', async (req, res) => {
  try {
    console.log('Manual scraping triggered');
    
    const result = await scraper.performScraping();
    
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
    console.error('Error during manual scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Manual scraping failed',
      error: error.message
    });
  }
});

/**
 * GET /api/articles/:id
 * Get a specific article by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).select('-__v');
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
});

/**
 * DELETE /api/articles/:id
 * Soft delete an article (mark as inactive)
 */
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article deleted successfully',
      data: article
    });

  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message
    });
  }
});

module.exports = router;
