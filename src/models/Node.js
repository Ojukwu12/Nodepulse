/**
 * Node model representing a compute node (registered manually or by sidecar)
 */

const mongoose = require('mongoose');

const GPUSchema = new mongoose.Schema({
  index: Number,
  model: String,
  vramGB: Number
}, { _id: false });

const NodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true },
  walletAddress: { type: String, lowercase: true, index: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  hardware: {
    cpu: { model: String, cores: Number },
    memoryGB: Number,
    gpus: [GPUSchema]
  },
  software: { os: String, sidecarVersion: String },
  sidecar: { lastSeenAt: Date, ip: String },
  status: { type: String, enum: ['online', 'offline', 'unknown', 'degraded'], default: 'unknown' },
  lastMetricsAt: Date,
  totalUptimeSeconds: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Node', NodeSchema);
