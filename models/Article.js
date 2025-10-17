const mongoose = require('mongoose');

// Article schema for storing scraped news data
const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  score: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  author: {
    type: String,
    default: 'Unknown'
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
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
articleSchema.index({ scrapedAt: -1 });
articleSchema.index({ title: 'text', author: 'text' }); // Text search index
articleSchema.index({ isActive: 1, scrapedAt: -1 });

// Static method to get recent articles
articleSchema.statics.getRecentArticles = function(limit = 50) {
  return this.find({ isActive: true })
    .sort({ scrapedAt: -1 })
    .limit(limit);
};

// Static method to search articles
articleSchema.statics.searchArticles = function(query, limit = 20) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .sort({ scrapedAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Article', articleSchema);
