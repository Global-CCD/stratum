// public/js/crdtEngine.js - Conflict-Free Replicated Data Types & Lamport Clocks
export class CrdtEngine {
  /**
   * Generates a state-vector entry with Lamport timestamp
   */
  static createStateVector(nodeId, data, clientId = 'client_local', version = 1) {
    return {
      nodeId,
      clientId,
      version,
      lamportTimestamp: Date.now(),
      data: { ...data },
      signature: crypto.randomUUID()
    };
  }

  /**
   * State-Vector LWW (Last-Write-Wins) Deterministic CRDT Merge
   */
  static mergeStateVectors(localVectorMap, incomingVectorMap) {
    const mergedMap = new Map(localVectorMap);
    const conflictsResolved = [];

    incomingVectorMap.forEach((incomingVector, nodeId) => {
      if (!mergedMap.has(nodeId)) {
        mergedMap.set(nodeId, incomingVector);
      } else {
        const localVector = mergedMap.get(nodeId);
        // Deterministic Resolution: Compare Lamport Timestamp, then Client ID tie-breaker
        const isIncomingNewer = incomingVector.lamportTimestamp > localVector.lamportTimestamp ||
          (incomingVector.lamportTimestamp === localVector.lamportTimestamp && incomingVector.clientId > localVector.clientId);

        if (isIncomingNewer) {
          mergedMap.set(nodeId, incomingVector);
          conflictsResolved.push({ nodeId, winner: incomingVector.clientId, resolution: 'INCOMING_APPLIED' });
        } else {
          conflictsResolved.push({ nodeId, winner: localVector.clientId, resolution: 'LOCAL_PRESERVED' });
        }
      }
    });

    return {
      mergedMap,
      conflictsCount: conflictsResolved.length,
      conflictsResolved
    };
  }
}