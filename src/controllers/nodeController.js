/**
 * Node controller - node registration and metrics ingestion
 */

const Node = require('../models/Node');
const NodeStats = require('../models/NodeStats');
const { AppError, ValidationError } = require('../utils/errors');
const logger = require('../config/logger');

async function createNode(req, res) {
  const { nodeId, walletAddress, name, hardware } = req.body || {};
  if (!nodeId || !walletAddress) throw new ValidationError('nodeId and walletAddress are required');

  // Create node and link to authenticated user
  const node = new Node({ nodeId, walletAddress: walletAddress.toLowerCase(), ownerUserId: req.user._id, name, hardware });
  await node.save();
  res.json({ success: true, node });
}

async function listNodes(req, res) {
  const nodes = await Node.find({ ownerUserId: req.user._id }).limit(200);
  res.json({ success: true, nodes });
}

async function getNode(req, res) {
  const { nodeId } = req.params;
  const node = await Node.findOne({ nodeId });
  if (!node) throw new AppError('Node not found', 404);
  res.json({ success: true, node });
}

async function ingestMetrics(req, res) {
  // Metrics ingestion endpoint used by sidecar
  // Accepts batched or single metric payloads
  const { nodeId } = req.params;
  const payload = req.body;
  if (!payload) throw new ValidationError('No metrics payload');

  // Find node by nodeId
  const node = await Node.findOne({ nodeId });
  if (!node) {
    logger.warn({ nodeId }, 'NodePulse: metrics for unknown node');
    // Optionally create a placeholder node or reject; here we'll reject
    throw new AppError('Unknown nodeId; register node first', 404);
  }

  // Normalize payloads: support array of metrics or single object
  const metrics = Array.isArray(payload) ? payload : [payload];
  const docs = metrics.map(m => ({ nodeId: node._id, timestamp: m.timestamp ? new Date(m.timestamp) : new Date(), cpu: m.cpu, memory: m.memory, gpus: m.gpus, uptimeSeconds: m.uptimeSeconds }));

  await NodeStats.insertMany(docs, { ordered: false }).catch(err => logger.warn({ err }, 'NodePulse: partial insert error'));

  // Update node last seen
  node.lastMetricsAt = new Date();
  node.status = 'online';
  await node.save();

  res.json({ success: true, inserted: docs.length });
}

module.exports = { createNode, listNodes, getNode, ingestMetrics };
