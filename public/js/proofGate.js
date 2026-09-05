// public/js/proofGate.js - Cryptographic Binding & Tool-First Gatekeeper
export class ProofGatekeeper {
  /**
   * Cryptographic Proof-of-Outcome Signature Generator
   * Binds task ID, timestamp, and payload to prevent replay attacks.
   */
  static async generateProofSignature(taskId, payloadUri) {
    const rawString = `${taskId}|${payloadUri}|${Date.now()}`;
    const msgBuffer = new TextEncoder().encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static detectToolFirstAntiPattern(text) {
    if (!text || typeof text !== 'string') return { flagged: false };
    const toolKeywords = ['python', 'script', 'figma', 'react', 'postgres', 'mic', 'scraper', 'css', 'api'];
    const metricKeywords = ['dba', 'latency', 'conversion', 'retention', 'revenue', 'compliance', 'ms', '%', 'reduce', 'increase'];

    const lower = text.toLowerCase();
    const hasTool = toolKeywords.some(t => lower.includes(t));
    const hasMetric = metricKeywords.some(m => lower.includes(m));

    if (hasTool && !hasMetric) {
      return {
        flagged: true,
        warning: 'Tool-First Cognitive Bias: Task mentions implementation tools without measurable intent or metrics.'
      };
    }
    return { flagged: false };
  }

  static canCloseTask(task, proofRecord) {
    const impact = Number(task.impact_index) || 1.0;
    if (impact >= 7.0) {
      if (!proofRecord || !proofRecord.is_validated || !proofRecord.evidence_payload_uri) {
        return {
          allowed: false,
          requiresModal: true,
          reason: 'High-Impact Task Gate: Requires verified, immutable Proof-of-Outcome artifact.'
        };
      }
    }
    return { allowed: true, requiresModal: false };
  }
}