// public/js/dedupEngine.js - Positional Bi-Gram Hashing (Anti-Anagram)
import { VectorMath } from './vectorMath.js';

export class DedupEngine {
  /**
   * Generates a 64-dimensional Positional Bi-Gram Feature Vector
   * Captures word sequences to eliminate anagram false positives.
   */
  static generatePositionalVector(text, dimensions = 64) {
    const vec = new Array(dimensions).fill(0.0);
    if (!text || typeof text !== 'string') return vec;

    const words = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length === 0) return vec;

    // Single-word fallback
    if (words.length === 1) {
      const hash = this._hashString(words[0]);
      vec[Math.abs(hash) % dimensions] = 1.0;
      return vec;
    }

    // Bi-gram sequential hashing
    for (let i = 0; i < words.length - 1; i++) {
      const biGram = `${words[i]}_${words[i + 1]}`;
      const hash = this._hashString(biGram);
      const index = Math.abs(hash) % dimensions;
      vec[index] += 1.0;
    }

    // Unit normalize vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm < VectorMath.EPSILON) return vec;
    return vec.map(v => v / norm);
  }

  static _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  static findCollision(draftTitle, existingTasks = [], threshold = 0.80) {
    if (!draftTitle || draftTitle.trim().length < 4) return null;
    const draftVec = this.generatePositionalVector(draftTitle);

    for (const task of existingTasks) {
      if (!task.title) continue;
      const taskVec = this.generatePositionalVector(task.title);
      const similarity = VectorMath.cosineSimilarity(draftVec, taskVec);

      if (similarity >= threshold) {
        return {
          collision: true,
          matchedTask: task,
          similarityScore: Math.round(similarity * 100)
        };
      }
    }
    return null;
  }
}