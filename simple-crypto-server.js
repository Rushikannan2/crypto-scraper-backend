const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration - Allow all origins
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

// Sample cryptocurrency data
const sampleCryptoData = [
  {
    _id: "1",
    name: "Bitcoin",
    symbol: "BTC",
    price: 43250.50,
    marketCap: 847500000000,
    change24h: 2.45,
    volume24h: 28500000000,
    rank: 1,
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "2",
    name: "Ethereum",
    symbol: "ETH",
    price: 2650.75,
    marketCap: 318000000000,
    change24h: 1.85,
    volume24h: 15200000000,
    rank: 2,
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "3",
    name: "Binance Coin",
    symbol: "BNB",
    price: 315.20,
    marketCap: 47500000000,
    change24h: -0.75,
    volume24h: 1200000000,
    rank: 3,
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "4",
    name: "Solana",
    symbol: "SOL",
    price: 98.45,
    marketCap: 42500000000,
    change24h: 3.25,
    volume24h: 2800000000,
    rank: 4,
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "5",
    name: "Cardano",
    symbol: "ADA",
    price: 0.485,
    marketCap: 17200000000,
    change24h: 1.15,
    volume24h: 450000000,
    rank: 5,
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "6",
    name: "XRP",
    symbol: "XRP",
    price: 0.625,
    marketCap: 34000000000,
    change24h: -1.25,
    volume24h: 1200000000,
    rank: 6,
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "7",
    name: "Dogecoin",
    symbol: "DOGE",
    price: 0.0825,
    marketCap: 11800000000,
    change24h: 4.85,
    volume24h: 850000000,
    rank: 7,
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "8",
    name: "Polygon",
    symbol: "MATIC",
    price: 0.875,
    marketCap: 8200000000,
    change24h: 2.15,
    volume24h: 320000000,
    rank: 8,
    image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "9",
    name: "Chainlink",
    symbol: "LINK",
    price: 14.25,
    marketCap: 7800000000,
    change24h: -0.45,
    volume24h: 280000000,
    rank: 9,
    image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
    timestamp: new Date(),
    isActive: true
  },
  {
    _id: "10",
    name: "Litecoin",
    symbol: "LTC",
    price: 72.85,
    marketCap: 5400000000,
    change24h: 1.75,
    volume24h: 180000000,
    rank: 10,
    image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
    timestamp: new Date(),
    isActive: true
  }
];

// API Routes
app.get('/api/crypto', (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'rank', sortOrder = 'asc' } = req.query;
    
    let filteredData = [...sampleCryptoData];
    
    // Search filter
    if (search) {
      filteredData = filteredData.filter(crypto => 
        crypto.name.toLowerCase().includes(search.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort data
    filteredData.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredData.length / limit),
        totalItems: filteredData.length,
        itemsPerPage: parseInt(limit)
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

app.get('/api/crypto/stats', (req, res) => {
  try {
    const totalCrypto = sampleCryptoData.length;
    const totalMarketCap = sampleCryptoData.reduce((sum, crypto) => sum + crypto.marketCap, 0);
    const avgChange24h = sampleCryptoData.reduce((sum, crypto) => sum + crypto.change24h, 0) / totalCrypto;
    
    res.json({
      success: true,
      data: {
        totalCrypto,
        totalMarketCap,
        avgChange24h: parseFloat(avgChange24h.toFixed(2)),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

app.post('/api/crypto/scrape', (req, res) => {
  try {
    console.log('Demo crypto scraping triggered');
    res.json({
      success: true,
      message: 'Demo crypto scraping completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Error during scraping',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'demo',
    database: 'Demo Mode - No Database Required',
    api: 'Demo Cryptocurrency Data'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cryptocurrency Scraper API Server - Simple Demo',
    version: '1.0.0',
    mode: 'Demo Mode - Sample Data',
    endpoints: {
      health: '/health',
      crypto: '/api/crypto',
      stats: '/api/crypto/stats',
      scrape: 'POST /api/crypto/scrape'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log('🎉 Simple Cryptocurrency Server Started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

module.exports = app;
