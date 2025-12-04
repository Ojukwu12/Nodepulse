/**
 * NodeStats - time series metrics for nodes
 * This collection stores raw metrics; a rollup process should aggregate them.
 */

const mongoose = require('mongoose');

const GPUMetricSchema = new mongoose.Schema({
  index: Number,
  utilizationPct: Number,
  temperatureC: Number,
  memoryTotalMB: Number,
  memoryUsedMB: Number
}, { _id: false });

const NodeStatsSchema = new mongoose.Schema({
  nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', index: true },
  timestamp: { type: Date, index: true },
  cpu: { usagePct: Number },
  memory: { totalMB: Number, usedMB: Number },
  gpus: [GPUMetricSchema],
  uptimeSeconds: Number
});

// Example TTL: raw metrics retention configurable via index creation in migrations/admin
// NodeStatsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // 30 days

module.exports = mongoose.model('NodeStats', NodeStatsSchema);
