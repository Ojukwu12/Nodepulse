/**
 * NodePulse - server entrypoint
 * Connects to MongoDB, starts Express server, and schedules background jobs.
 */

require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const chainWatcher = require('./jobs/chainWatcher');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Basic env validation
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.MONGO_URI) throw new Error('MONGO_URI required in production');
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET required in production');
      if (!process.env.SIDECAR_KEY_SECRET) throw new Error('SIDECAR_KEY_SECRET required in production');
      // warn if CHAIN_RPC_URL is missing (chain features will be disabled)
      if (!process.env.CHAIN_RPC_URL) {
        logger.warn('CHAIN_RPC_URL not configured; chain features will be disabled in production');
      }
    }

    await connectDB();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'NodePulse: Server listening');
    });

    // Start background jobs
    const watcher = chainWatcher.start();

    // Graceful shutdown
    const shutdown = async (signal) => {
      try {
        logger.info({ signal }, 'NodePulse: Shutting down');
        if (watcher && typeof watcher.stop === 'function') watcher.stop();
        server.close(() => logger.info('NodePulse: HTTP server closed'));
        // Close mongoose connection
        const mongoose = require('mongoose');
        await mongoose.disconnect();
        logger.info('NodePulse: MongoDB disconnected');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'NodePulse: Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error({ err }, 'NodePulse: Failed to start');
    process.exit(1);
  }
}

start();
