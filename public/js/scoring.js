// public/js/scoring.js - Mathematical Prioritization & Anti-Creep Logic
export class ScoringEngine {
  /**
   * Computes Priority Rank: (Impact * 0.6) + ((Sync / 10) * 0.4)
   */
  static calculatePriorityRank(impactIndex, syncIndex) {
    const impact = parseFloat(impactIndex) || 1.0;
    const sync = parseFloat(syncIndex) || 0.0;
    const normalizedSync = sync / 10.0;
    const rank = (impact * 0.6) + (normalizedSync * 0.4);
    return Math.round(rank * 100) / 100;
  }

  /**
   * Determine Quadrant based on Impact (1-10) and Sync (0-100%)
   */
  static getQuadrant(impactIndex, syncIndex) {
    const impact = parseFloat(impactIndex);
    const sync = parseFloat(syncIndex);
    if (impact >= 5.0 && sync >= 50.0) return 'Q1'; // Core Priority
    if (impact >= 5.0 && sync < 50.0) return 'Q2';  // High Leverage / Evaluate
    if (impact < 5.0 && sync >= 50.0) return 'Q3';  // Maintenance
    return 'Q4'; // Eliminate
  }

  /**
   * Anti-Creep Safeguard: Items <50% Sync are hard-locked.
   */
  static evaluateExecutionStatus(syncIndex) {
    const sync = parseFloat(syncIndex);
    if (sync < 50.0) {
      return { status: 'BLOCKED', isBlocked: true, reason: 'Anti-Creep Threshold Triggered (Sync < 50%)' };
    }
    return { status: 'ACTIVE', isBlocked: false, reason: 'Aligned' };
  }
}