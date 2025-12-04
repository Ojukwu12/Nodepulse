/**
 * Database connection for NodePulse
 */

const mongoose = require('mongoose');
const logger = require('./logger');


/**
 * Connect to MongoDB using environment variable `MONGO_URI`.
 * Do NOT hardcode credentials in code. Provide `MONGO_URI` in `.env`.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI environment variable is required in production');
    }
    // In development, fallback to localhost but still prefer explicit env var.
    logger.warn('MONGO_URI not set; falling back to mongodb://localhost:27017/nodepulse (dev only)');
  }

  const opts = {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  };

  await mongoose.connect(uri || 'mongodb://localhost:27017/nodepulse', opts);
  logger.info({ mongoUri: uri || 'mongodb://localhost:27017/nodepulse' }, 'NodePulse: Connected to MongoDB');
}

module.exports = connectDB;
