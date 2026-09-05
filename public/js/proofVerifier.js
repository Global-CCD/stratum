// public/js/proofVerifier.js - Automated Telemetry Matcher & Webhook Validator
export class ProofVerifier {
  /**
   * Validates incoming metric telemetry against task target constraints
   */
  static evaluateMetricProof(taskConstraint, incomingTelemetry) {
    // taskConstraint: { metric: 'latency_ms', operator: '<', threshold: 100 }
    // incomingTelemetry: { metric: 'latency_ms', value: 72 }
    if (taskConstraint.metric !== incomingTelemetry.metric) {
      return { verified: false, reason: 'Metric key mismatch' };
    }

    const val = parseFloat(incomingTelemetry.value);
    const target = parseFloat(taskConstraint.threshold);

    let pass = false;
    switch (taskConstraint.operator) {
      case '<': pass = val < target; break;
      case '<=': pass = val <= target; break;
      case '>': pass = val > target; break;
      case '>=': pass = val >= target; break;
      case '==': pass = val === target; break;
      default: pass = false;
    }

    return {
      verified: pass,
      valueObserved: val,
      thresholdTarget: target,
      reason: pass ? 'Empirical threshold verified' : 'Metric did not meet target condition'
    };
  }
}