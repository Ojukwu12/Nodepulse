/**
 * ChainState - simple key/value store for chain sync state (e.g., lastProcessedBlock)
 */

const mongoose = require('mongoose');

const ChainStateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('ChainState', ChainStateSchema);
