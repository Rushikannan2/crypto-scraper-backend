const mongoose = require('mongoose');

// Crypto schema for storing cryptocurrency price data
const cryptoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  marketCap: {
    type: Number,
    required: true,
    min: 0
  },
  change24h: {
    type: Number,
    required: true
  },
  volume24h: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for better query performance
cryptoSchema.index({ timestamp: -1 });
cryptoSchema.index({ symbol: 1, timestamp: -1 });
cryptoSchema.index({ rank: 1 });
cryptoSchema.index({ isActive: 1, timestamp: -1 });

// Static method to get latest crypto prices
cryptoSchema.statics.getLatestPrices = function(limit = 50) {
  return this.find({ isActive: true })
    .sort({ rank: 1, timestamp: -1 })
    .limit(limit);
};

// Static method to get crypto by symbol
cryptoSchema.statics.getBySymbol = function(symbol) {
  return this.findOne({ 
    symbol: symbol.toUpperCase(), 
    isActive: true 
  }).sort({ timestamp: -1 });
};

// Static method to get top cryptocurrencies
cryptoSchema.statics.getTopCrypto = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ rank: 1 })
    .limit(limit);
};

// Static method to search cryptocurrencies
cryptoSchema.statics.searchCrypto = function(query, limit = 20) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { symbol: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .sort({ rank: 1 })
  .limit(limit);
};

// Virtual for formatted price
cryptoSchema.virtual('formattedPrice').get(function() {
  return this.price ? `$${this.price.toLocaleString()}` : '$0';
});

// Virtual for formatted market cap
cryptoSchema.virtual('formattedMarketCap').get(function() {
  if (this.marketCap >= 1e12) {
    return `$${(this.marketCap / 1e12).toFixed(2)}T`;
  } else if (this.marketCap >= 1e9) {
    return `$${(this.marketCap / 1e9).toFixed(2)}B`;
  } else if (this.marketCap >= 1e6) {
    return `$${(this.marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${this.marketCap.toLocaleString()}`;
  }
});

// Virtual for change color
cryptoSchema.virtual('changeColor').get(function() {
  return this.change24h >= 0 ? 'green' : 'red';
});

module.exports = mongoose.model('Crypto', cryptoSchema);
