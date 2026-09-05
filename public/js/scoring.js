// public/js/scoring.js - Graph-Aware Priority & Downstream Leverage
export class ScoringEngine {
  /**
   * Deterministic Priority Rank Calculation
   */
  static calculatePriorityRank(impactIndex, syncIndex) {
    const impact = Number(impactIndex);
    const sync = Number(syncIndex);

    // Epsilon & NaN Guard
    const safeImpact = (isNaN(impact) || !isFinite(impact)) ? 1.0 : Math.min(10.0, Math.max(1.0, impact));
    const safeSync = (isNaN(sync) || !isFinite(sync)) ? 0.0 : Math.min(100.0, Math.max(0.0, sync));

    const normalizedSync = safeSync / 10.0;
    const rank = (safeImpact * 0.6) + (normalizedSync * 0.4);
    return Math.round(rank * 100) / 100;
  }

  /**
   * Inherited Priority Calculation (Fixes Topological Priority Inversion)
   */
  static calculateEffectiveImpact(task, allTasks = [], dependencies = []) {
    const directImpact = Number(task.impact_index) || 1.0;
    
    // Find all tasks that depend directly on this task completing
    const dependentTaskIds = dependencies
      .filter(dep => dep.fromTaskId === task.id)
      .map(dep => dep.toTaskId);

    if (dependentTaskIds.length === 0) {
      return directImpact;
    }

    const downstreamTasks = allTasks.filter(t => dependentTaskIds.includes(t.id));
    if (downstreamTasks.length === 0) return directImpact;

    const maxDownstreamImpact = Math.max(...downstreamTasks.map(t => Number(t.impact_index) || 1.0));
    
    // Blocker inherits 70% of the downstream critical-path leverage
    const effectiveImpact = Math.max(directImpact, directImpact * 0.3 + maxDownstreamImpact * 0.7);
    return Math.min(10.0, Math.round(effectiveImpact * 10) / 10);
  }

  static getQuadrant(impactIndex, syncIndex) {
    const impact = Number(impactIndex) || 1.0;
    const sync = Number(syncIndex) || 0.0;
    if (impact >= 5.0 && sync >= 50.0) return 'Q1';
    if (impact >= 5.0 && sync < 50.0) return 'Q2';
    if (impact < 5.0 && sync >= 50.0) return 'Q3';
    return 'Q4';
  }

  static evaluateExecutionStatus(syncIndex) {
    const sync = Number(syncIndex) || 0.0;
    if (sync < 50.0) {
      return { status: 'BLOCKED', isBlocked: true, reason: 'Anti-Creep Hard Lock (<50% Sync)' };
    }
    return { status: 'ACTIVE', isBlocked: false, reason: 'Aligned' };
  }
}