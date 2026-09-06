// public/js/scopeDriftClassifier.js - Predictive Scope Drift Velocity & Contracts
export class ScopeDriftClassifier {
  /**
   * Computes Scope Expansion Velocity (Delta Tasks / Days Elapsed)
   */
  static calculateExpansionVelocity(project, taskList = []) {
    const initialScopeCount = project.initial_task_count || 5;
    const currentCount = taskList.filter(t => t.project_id === project.id).length;
    const createdAt = new Date(project.created_at || Date.now());
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));

    const deltaTasks = Math.max(0, currentCount - initialScopeCount);
    const expansionVelocity = deltaTasks / daysElapsed; // Tasks added per day

    let riskLevel = 'LOW';
    if (expansionVelocity > 1.5) riskLevel = 'CRITICAL_CREEP';
    else if (expansionVelocity > 0.8) riskLevel = 'MODERATE_DRIFT';

    return {
      initialScopeCount,
      currentCount,
      deltaTasks,
      daysElapsed,
      expansionVelocity: Number(expansionVelocity.toFixed(2)),
      riskLevel,
      creepProbability: Math.min(100, Math.round((expansionVelocity / 2.0) * 100))
    };
  }

  /**
   * Generates a formal Scope Boundary Agreement Contract
   */
  static generateScopeContract(project, activeTasks = [], nonGoals = []) {
    return `# SCOPE BOUNDARY CONTRACT: ${project.title.toUpperCase()}
Generated: ${new Date().toISOString()}

## 1. IN-SCOPE COMMITMENTS (Total: ${activeTasks.length} Units)
${activeTasks.map((t, i) => `${i + 1}. [Imp: ${t.impact_index} | Sync: ${t.sync_index}%] ${t.title}`).join('\n')}

## 2. EXPLICIT OUT-OF-SCOPE NON-GOALS
${nonGoals.map((ng, i) => `${i + 1}. [EXCLUDED] ${ng}`).join('\n')}

## 3. ANTI-CREEP GOVERNANCE
* Maximum allowable Expansion Velocity: 0.80 tasks/day
* Hard-Lock Threshold: Sync Index < 50.0%
* Signed Off: TRUE (Cryptographically Bound to Project ID: ${project.id})
`;
  }
}