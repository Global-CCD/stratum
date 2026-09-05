// public/js/syncChannel.js - Multi-Tab Broadcast Synchronization
export class SyncChannel {
  static CHANNEL_NAME = 'stratum_state_bus';
  static instance = null;

  static init(onStateInvalidated) {
    if (!('BroadcastChannel' in window)) {
      console.warn('[SyncChannel] BroadcastChannel not supported in this browser.');
      return;
    }

    if (!this.instance) {
      this.instance = new BroadcastChannel(this.CHANNEL_NAME);
      this.instance.onmessage = (event) => {
        const { action, payload, originTabId } = event.data;
        console.log(`[SyncChannel] State invalidated by remote tab (${action})`);
        if (typeof onStateInvalidated === 'function') {
          onStateInvalidated(action, payload);
        }
      };
    }
  }

  static broadcast(action, payload = {}) {
    if (this.instance) {
      this.instance.postMessage({
        action,
        payload,
        timestamp: Date.now()
      });
    }
  }
}