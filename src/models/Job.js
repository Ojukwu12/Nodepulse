/**
 * Job model - stores on-chain job completion records
 */

const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  jobId: { type: String, index: true },
  jobType: { type: String },
  jobSpec: { type: mongoose.Schema.Types.Mixed },
  nodeWallet: { type: String, lowercase: true, index: true },
  nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node' },
  status: { type: String, enum: ['reported','verified','disputed','paid'], default: 'reported' },
  contribution: { type: mongoose.Schema.Types.Mixed },
  rewardAmount: { type: String },
  txHash: { type: String, index: true },
  blockNumber: { type: Number },
  timestamp: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
