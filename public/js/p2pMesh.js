// public/js/p2pMesh.js - Decentralized Gossip Protocol & WebRTC Mesh Simulation
export class P2pMeshEngine {
  constructor(nodeId = crypto.randomUUID().substring(0, 8)) {
    this.localPeerId = nodeId;
    this.connectedPeers = new Map();
    this.gossipHistory = new Set();
  }

  /**
   * Connects a simulated or real WebRTC DataChannel peer
   */
  connectPeer(remotePeerId) {
    if (this.connectedPeers.has(remotePeerId)) return;
    const channel = {
      peerId: remotePeerId,
      status: 'CONNECTED',
      latencyMs: Math.floor(Math.random() * 20 + 5), // 5-25ms local Wi-Fi latency
      send: (msg) => this._simulateTransport(remotePeerId, msg)
    };
    this.connectedPeers.set(remotePeerId, channel);
    return channel;
  }

  _simulateTransport(remotePeerId, message) {
    const serialized = JSON.stringify(message);
    this.gossipHistory.add(message.messageId);
    return { delivered: true, recipient: remotePeerId, bytes: serialized.length };
  }

  /**
   * Broadcasts a state change gossip message to all connected mesh peers
   */
  broadcastGossip(action, payload) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const message = {
      messageId,
      originPeer: this.localPeerId,
      action,
      payload,
      timestamp: Date.now()
    };

    const deliveryReport = [];
    this.connectedPeers.forEach((peer, peerId) => {
      const res = peer.send(message);
      deliveryReport.push(res);
    });

    return {
      messageId,
      peersNotified: deliveryReport.length,
      deliveryReport
    };
  }
}