/**
 * Node service - node related business logic
 */

const Node = require('../models/Node');

async function createNode(data) {
  const node = new Node(data);
  await node.save();
  return node;
}

async function findByNodeId(nodeId) {
  return Node.findOne({ nodeId });
}

async function listByUser(userId) {
  return Node.find({ ownerUserId: userId });
}

module.exports = { createNode, findByNodeId, listByUser };
