/**
 * Stats service - ingestion and aggregation helpers
 */

const NodeStats = require('../models/NodeStats');

async function insertMetrics(docs) {
  return NodeStats.insertMany(docs);
}

async function queryMetrics(nodeObjectId, from, to, limit = 10000) {
  return NodeStats.find({ nodeId: nodeObjectId, timestamp: { $gte: from, $lte: to } }).sort({ timestamp: 1 }).limit(limit);
}

module.exports = { insertMetrics, queryMetrics };
