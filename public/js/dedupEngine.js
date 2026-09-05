// public/js/dedupEngine.js - Real-Time Duplicate Task Collision Engine
import { VectorMath } from './vectorMath.js';

export class DedupEngine {
  /**
   * Generates a deterministic character-frequency feature vector (32-dimensions)
   */
  static generateFastVector(text) {
    const vec = new Array(32).fill(0);
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (let i = 0; i < clean.length; i++) {
      const idx = clean.charCodeAt(i) % 32;
      vec[idx] += 1;
    }
    // Normalize vector
    const mag = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map(v => v / mag);
  }

  /**
   * Checks incoming draft task against all existing active tasks
   */
  static findCollision(draftTitle, existingTasks, threshold = 0.85) {
    if (!draftTitle || draftTitle.trim().length < 5) return null;
    const draftVec = this.generateFastVector(draftTitle);

    for (const task of existingTasks) {
      const taskVec = this.generateFastVector(task.title);
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