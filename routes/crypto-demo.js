const express = require('express');
const router = express.Router();

// Demo cryptocurrency data for testing without MongoDB
const demoCryptoData = [
  {
    _id: '1',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 43250.50,
    marketCap: 847500000000,
    change24h: 2.45,
    volume24h: 28500000000,
    rank: 1,
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '2',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2650.75,
    marketCap: 318000000000,
    change24h: -1.25,
    volume24h: 15200000000,
    rank: 2,
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '3',
    name: 'Binance Coin',
    symbol: 'BNB',
    price: 315.80,
    marketCap: 47500000000,
    change24h: 0.85,
    volume24h: 1200000000,
    rank: 3,
    image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '4',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.485,
    marketCap: 17200000000,
    change24h: 3.20,
    volume24h: 850000000,
    rank: 4,
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '5',
    name: 'Solana',
    symbol: 'SOL',
    price: 98.45,
    marketCap: 42000000000,
    change24h: -2.15,
    volume24h: 2100000000,
    rank: 5,
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '6',
    name: 'XRP',
    symbol: 'XRP',
    price: 0.625,
    marketCap: 35000000000,
    change24h: 1.85,
    volume24h: 1800000000,
    rank: 6,
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '7',
    name: 'Polkadot',
    symbol: 'DOT',
    price: 7.25,
    marketCap: 8500000000,
    change24h: -0.95,
    volume24h: 450000000,
    rank: 7,
    image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '8',
    name: 'Dogecoin',
    symbol: 'DOGE',
    price: 0.085,
    marketCap: 12000000000,
    change24h: 5.75,
    volume24h: 950000000,
    rank: 8,
    image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '9',
    name: 'Avalanche',
    symbol: 'AVAX',
    price: 35.20,
    marketCap: 8500000000,
    change24h: 2.10,
    volume24h: 380000000,
    rank: 9,
    image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: '10',
    name: 'Chainlink',
    symbol: 'LINK',
    price: 14.85,
    marketCap: 7500000000,
    change24h: -1.45,
    volume24h: 420000000,
    rank: 10,
    image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    timestamp: new Date(),
    isActive: true
  }
];

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

    // Filter crypto data based on search
    let filteredCrypto = demoCryptoData;
    if (search) {
      filteredCrypto = demoCryptoData.filter(crypto => 
        crypto.name.toLowerCase().includes(search.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort crypto data
    filteredCrypto.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 1 ? aVal - bVal : bVal - aVal;
    });

    // Calculate pagination
    const total = filteredCrypto.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const cryptoData = filteredCrypto.slice(skip, skip + limit);

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
    const cryptoData = demoCryptoData.slice(0, limit);

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
    const cryptoData = demoCryptoData.slice(0, limit);

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
    const crypto = demoCryptoData.find(c => c.symbol === symbol);
    
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
    const totalCrypto = demoCryptoData.length;
    const todayCrypto = demoCryptoData.length; // All demo data is "today"
    const lastScrape = demoCryptoData[0]?.timestamp;
    const topCrypto = demoCryptoData[0]; // Bitcoin

    res.json({
      success: true,
      data: {
        totalCrypto,
        todayCrypto,
        lastScrape,
        topCrypto: {
          name: topCrypto.name,
          price: topCrypto.price
        }
      }
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
 * Trigger manual crypto data scraping (demo mode)
 */
router.post('/scrape', async (req, res) => {
  try {
    console.log('Demo crypto scraping triggered');
    
    res.json({
      success: true,
      message: 'Demo crypto scraping completed successfully',
      data: {
        saved: 0,
        updated: 0,
        skipped: 0,
        total: 0,
        note: 'This is demo mode - no actual scraping performed'
      }
    });

  } catch (error) {
    console.error('Error during demo crypto scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Demo crypto scraping failed',
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
    const crypto = demoCryptoData.find(c => c._id === req.params.id);
    
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
    const cryptoIndex = demoCryptoData.findIndex(c => c._id === req.params.id);
    
    if (cryptoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cryptocurrency not found'
      });
    }

    demoCryptoData[cryptoIndex].isActive = false;

    res.json({
      success: true,
      message: 'Cryptocurrency deleted successfully',
      data: demoCryptoData[cryptoIndex]
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
