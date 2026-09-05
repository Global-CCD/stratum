// public/js/vectorMath.js - Guarded Vector Math with Polarity Protection
export class VectorMath {
  static EPSILON = 1e-9; // Guard against division-by-zero floating point drift

  /**
   * Safe Cosine Similarity with Epsilon Clamp
   */
  static cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0.0;
    }

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
      const a = Number(vecA[i]) || 0.0;
      const b = Number(vecB[i]) || 0.0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    
    // Strict Epsilon Guard: Prevents NaN / Infinity on zero-magnitude inputs
    if (denominator < this.EPSILON || !isFinite(denominator)) {
      return 0.0;
    }

    const similarity = dotProduct / denominator;
    return Math.min(1.0, Math.max(-1.0, Number(similarity.toFixed(6))));
  }

  /**
   * Normalizes raw cosine similarity to 0-100% scale
   */
  static normalizeSyncIndex(rawSim) {
    const sim = Number(rawSim) || 0.0;
    const SIM_MIN = 0.35;
    const SIM_MAX = 0.85;

    if (sim <= SIM_MIN) return 0.0;
    if (sim >= SIM_MAX) return 100.0;

    const normalized = ((sim - SIM_MIN) / (SIM_MAX - SIM_MIN)) * 100;
    return Math.min(100.0, Math.max(0.0, Math.round(normalized * 10) / 10));
  }

  /**
   * Negation & Polarity Pre-Filter
   */
  static detectNegationPolarity(childText, parentText) {
    const negativeKeywords = ['not', "don't", 'never', 'avoid', 'deprecate', 'remove', 'stop', 'eliminate'];
    const words = (childText || '').toLowerCase().split(/\s+/);
    const hasNegation = words.some(w => negativeKeywords.includes(w));
    return { hasNegation, penaltyFactor: hasNegation ? 0.3 : 1.0 };
  }
}