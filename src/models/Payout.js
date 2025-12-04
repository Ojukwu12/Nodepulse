/**
 * Payout model - stores on-chain payout events and linked jobs
 */

const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  payoutId: { type: String, index: true },
  recipient: { type: String, lowercase: true, index: true },
  amount: { type: String },
  blockNumber: Number,
  txHash: { type: String, unique: true },
  timestamp: Date,
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  processedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Payout', PayoutSchema);
