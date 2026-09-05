// public/js/vectorMath.js - In-Browser Cosine Similarity & Normalization
export class VectorMath {
  /**
   * Computes Cosine Similarity between two dense arrays
   */
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0.0;
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0.0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Normalizes raw cosine similarity (~0.35 - 0.85) to a 0-100% Sync Index
   */
  static normalizeSyncIndex(rawSim) {
    const SIM_MIN = 0.35;
    const SIM_MAX = 0.85;
    const normalized = ((rawSim - SIM_MIN) / (SIM_MAX - SIM_MIN)) * 100;
    return Math.min(100.0, Math.max(0.0, Math.round(normalized * 10) / 10));
  }
}