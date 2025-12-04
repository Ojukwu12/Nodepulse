/**
 * Stats controller - expose metrics and dashboard summaries
 */

const Node = require('../models/Node');
const NodeStats = require('../models/NodeStats');

async function getNodeMetrics(req, res) {
  const { nodeId } = req.params;
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 1000 * 60 * 60 * 24);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const node = await Node.findOne({ nodeId });
  if (!node) return res.status(404).json({ success: false, message: 'Node not found' });

  const series = await NodeStats.find({ nodeId: node._id, timestamp: { $gte: from, $lte: to } }).sort({ timestamp: 1 }).limit(10000);

  res.json({ success: true, nodeId, from: from.toISOString(), to: to.toISOString(), series });
}

async function dashboardSummary(req, res) {
  // Simple aggregated summary for the logged-in user
  const userId = req.user._id;
  const nodes = await Node.find({ ownerUserId: userId });
  const nodeIds = nodes.map(n => n._id);

  const recent = await NodeStats.aggregate([
    { $match: { nodeId: { $in: nodeIds }, timestamp: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } } },
    { $group: { _id: '$nodeId', avgCpu: { $avg: '$cpu.usagePct' }, last: { $last: '$timestamp' } } }
  ]);

  res.json({ success: true, summary: { nodesTotal: nodes.length, nodesReporting: recent.length, nodes: nodes, recentMetrics: recent } });
}

module.exports = { getNodeMetrics, dashboardSummary };
