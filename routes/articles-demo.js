const express = require('express');
const router = express.Router();

// Demo data for testing without MongoDB
const demoArticles = [
  {
    _id: '1',
    title: 'React 18: The Complete Guide to Concurrent Features',
    link: 'https://example.com/react-18-guide',
    score: 245,
    comments: 89,
    author: 'ReactTeam',
    scrapedAt: new Date(),
    publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
    isActive: true
  },
  {
    _id: '2',
    title: 'Building Scalable Node.js Applications with Express',
    link: 'https://example.com/nodejs-scalable',
    score: 189,
    comments: 67,
    author: 'NodeJSExpert',
    scrapedAt: new Date(),
    publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
    isActive: true
  },
  {
    _id: '3',
    title: 'MongoDB Atlas: Cloud Database Best Practices',
    link: 'https://example.com/mongodb-atlas',
    score: 156,
    comments: 43,
    author: 'MongoDBUser',
    scrapedAt: new Date(),
    publishedAt: new Date(Date.now() - 10800000), // 3 hours ago
    isActive: true
  },
  {
    _id: '4',
    title: 'Web Scraping with Puppeteer: A Complete Tutorial',
    link: 'https://example.com/puppeteer-tutorial',
    score: 134,
    comments: 28,
    author: 'WebScraper',
    scrapedAt: new Date(),
    publishedAt: new Date(Date.now() - 14400000), // 4 hours ago
    isActive: true
  },
  {
    _id: '5',
    title: 'Material-UI: Building Beautiful React Interfaces',
    link: 'https://example.com/material-ui-guide',
    score: 98,
    comments: 35,
    author: 'UIDesigner',
    scrapedAt: new Date(),
    publishedAt: new Date(Date.now() - 18000000), // 5 hours ago
    isActive: true
  }
];

/**
 * GET /api/articles
 * Fetch all articles with pagination and optional search
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'scrapedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Filter articles based on search
    let filteredArticles = demoArticles;
    if (search) {
      filteredArticles = demoArticles.filter(article => 
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.author.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort articles
    filteredArticles.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 1 ? aVal - bVal : bVal - aVal;
    });

    // Calculate pagination
    const total = filteredArticles.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const articles = filteredArticles.slice(skip, skip + limit);

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
    const articles = demoArticles.slice(0, limit);

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
    const articles = [...demoArticles]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

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
    const totalArticles = demoArticles.length;
    const todayArticles = demoArticles.length; // All demo articles are "today"
    const lastScrape = demoArticles[0]?.scrapedAt;
    const avgScore = Math.round(demoArticles.reduce((sum, article) => sum + article.score, 0) / demoArticles.length);

    res.json({
      success: true,
      data: {
        totalArticles,
        todayArticles,
        lastScrape,
        averageScore: avgScore
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
 * Trigger manual scraping (demo mode)
 */
router.post('/scrape', async (req, res) => {
  try {
    console.log('Demo scraping triggered');
    
    res.json({
      success: true,
      message: 'Demo scraping completed successfully',
      data: {
        saved: 0,
        updated: 0,
        skipped: 0,
        total: 0,
        note: 'This is demo mode - no actual scraping performed'
      }
    });

  } catch (error) {
    console.error('Error during demo scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Demo scraping failed',
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
    const article = demoArticles.find(a => a._id === req.params.id);
    
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
    const articleIndex = demoArticles.findIndex(a => a._id === req.params.id);
    
    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    demoArticles[articleIndex].isActive = false;

    res.json({
      success: true,
      message: 'Article deleted successfully',
      data: demoArticles[articleIndex]
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
