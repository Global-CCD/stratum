// public/js/proofGate.js - Epistemic Heuristics & Proof Gatekeeper
export class ProofGatekeeper {
  /**
   * Tool-First Anti-Pattern Detector (Checks for tool names without metric/intent)
   */
  static detectToolFirstAntiPattern(text) {
    const toolKeywords = ['python', 'script', 'figma', 'react', 'postgres', 'mic', 'scraper', 'css'];
    const metricKeywords = ['dba', 'latency', 'conversion', 'retention', 'revenue', 'compliance', 'ms', '%', 'reduce', 'increase'];

    const lower = text.toLowerCase();
    const hasTool = toolKeywords.some(t => lower.includes(t));
    const hasMetric = metricKeywords.some(m => lower.includes(m));

    if (hasTool && !hasMetric) {
      return {
        flagged: true,
        warning: 'Tool-First Smell: Task specifies implementation tools without measurable criteria.'
      };
    }
    return { flagged: false };
  }

  /**
   * Intercepts Task closure: High Impact (>=7.0) requires verified Proof
   */
  static canCloseTask(task, proofRecord) {
    if (parseFloat(task.impact_index) >= 7.0) {
      if (!proofRecord || !proofRecord.is_validated) {
        return {
          allowed: false,
          requiresModal: true,
          reason: 'High-Impact Task Gate: Requires empirical Proof-of-Outcome artifact.'
        };
      }
    }
    return { allowed: true, requiresModal: false };
  }
}