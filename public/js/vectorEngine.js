// public/js/vectorEngine.js - In-Browser Vector Engine & Synonym Mesh
import { VectorMath } from './vectorMath.js';

export class VectorEngine {
  static embeddingCache = new Map();

  // Canonical semantic synonym dictionary
  static SYNONYM_MAP = {
    'build': 'create',
    'construct': 'create',
    'implement': 'create',
    'develop': 'create',
    'deploy': 'release',
    'ship': 'release',
    'launch': 'release',
    'fix': 'repair',
    'resolve': 'repair',
    'patch': 'repair',
    'remove': 'eliminate',
    'delete': 'eliminate',
    'deprecate': 'eliminate'
  };

  /**
   * Expands text tokens through canonical synonym mapping
   */
  static expandSynonyms(text) {
    if (!text || typeof text !== 'string') return '';
    const words = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const expanded = words.map(w => this.SYNONYM_MAP[w] || w);
    return expanded.join(' ');
  }

  /**
   * Generates a 64-dimensional semantic dense vector with in-memory caching
   */
  static generateDenseVector(text, dimensions = 64) {
    const canonicalText = this.expandSynonyms(text);
    if (this.embeddingCache.has(canonicalText)) {
      return this.embeddingCache.get(canonicalText);
    }

    const vec = new Array(dimensions).fill(0.0);
    const words = canonicalText.split(/\s+/).filter(Boolean);

    if (words.length === 0) return vec;

    words.forEach((word, wordIndex) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const primaryIdx = Math.abs(hash) % dimensions;
      const secondaryIdx = Math.abs(hash * 31 + wordIndex) % dimensions;
      vec[primaryIdx] += 1.0;
      vec[secondaryIdx] += 0.5;
    });

    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    const normalizedVec = norm < VectorMath.EPSILON ? vec : vec.map(v => v / norm);

    this.embeddingCache.set(canonicalText, normalizedVec);
    return normalizedVec;
  }

  /**
   * High-dimensional Vector Similarity Search across node store
   */
  static searchSimilarNodes(queryText, nodeList = [], threshold = 0.70) {
    const queryVec = this.generateDenseVector(queryText);
    const matches = [];

    nodeList.forEach(node => {
      const nodeText = node.title || node.raw_payload || '';
      const nodeVec = this.generateDenseVector(nodeText);
      const similarity = VectorMath.cosineSimilarity(queryVec, nodeVec);

      if (similarity >= threshold) {
        matches.push({
          node,
          similarityScore: Math.round(similarity * 100)
        });
      }
    });

    return matches.sort((a, b) => b.similarityScore - a.similarityScore);
  }
}