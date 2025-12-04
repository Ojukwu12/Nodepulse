/**
 * Pino logger config for NodePulse
 */

const pino = require('pino');

const logger = pino({
  name: 'NodePulse',
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
