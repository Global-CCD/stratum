// public/js/dagEngine.js - Topological Sorting, Cycle Detection & Critical Path
import { ScoringEngine } from './scoring.js';

export class DagEngine {
  /**
   * Kahn's Algorithm for Topological Sort & Cycle Detection
   */
  static resolveDependencies(tasks, dependencies) {
    // dependencies: [{ fromTaskId: '1', toTaskId: '2' }] -> 1 must complete before 2
    const inDegree = new Map();
    const adjList = new Map();

    tasks.forEach(t => {
      inDegree.set(t.id, 0);
      adjList.set(t.id, []);
    });

    dependencies.forEach(dep => {
      if (adjList.has(dep.fromTaskId) && inDegree.has(dep.toTaskId)) {
        adjList.get(dep.fromTaskId).push(dep.toTaskId);
        inDegree.set(dep.toTaskId, inDegree.get(dep.toTaskId) + 1);
      }
    });

    const queue = [];
    inDegree.forEach((degree, taskId) => {
      if (degree === 0) queue.push(taskId);
    });

    const ordered = [];
    while (queue.length > 0) {
      const current = queue.shift();
      ordered.push(current);

      adjList.get(current).forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      });
    }

    const hasCycle = ordered.length !== tasks.length;
    return { orderedTaskIds: ordered, hasCycle };
  }

  /**
   * Time-Decay Dynamic Priority Calculation
   * Formula: (Impact * 0.5) + ((Sync / 10) * 0.3) + (Urgency * 0.2)
   */
  static calculateDynamicTimeDecay(impact, sync, targetDate, totalDaysAllocated = 30) {
    const now = new Date();
    const target = new Date(targetDate);
    const diffDays = Math.max(0, (target - now) / (1000 * 60 * 60 * 24));
    
    // Urgency increases as days remaining decrease
    const urgency = Math.min(10.0, Math.max(0.0, 10.0 - (diffDays / totalDaysAllocated) * 10.0));
    const baseRank = (parseFloat(impact) * 0.5) + ((parseFloat(sync) / 10.0) * 0.3);
    const dynamicRank = baseRank + (urgency * 0.2);

    return {
      dynamicRank: Math.round(dynamicRank * 100) / 100,
      urgencyScore: Math.round(urgency * 10) / 10,
      isCritical: urgency >= 8.0
    };
  }

  /**
   * Renders interactive SVG representation of the Task DAG
   */
  static renderSvgDag(tasks, dependencies) {
    if (tasks.length === 0) return '<p style="padding:1rem; color:var(--text-muted);">No tasks in DAG.</p>';

    let svgHtml = `<svg class="dag-svg" viewBox="0 0 800 350" xmlns="http://www.w3.org/2000/svg">`;
    const nodePositions = new Map();

    // Compute simple linear layout for SVG visualization
    tasks.forEach((t, i) => {
      const x = 80 + (i % 4) * 180;
      const y = 80 + Math.floor(i / 4) * 120;
      nodePositions.set(t.id, { x, y });
    });

    // Draw dependency connecting lines
    dependencies.forEach(dep => {
      const from = nodePositions.get(dep.fromTaskId);
      const to = nodePositions.get(dep.toTaskId);
      if (from && to) {
        svgHtml += `<line x1="${from.x + 60}" y1="${from.y + 20}" x2="${to.x}" y2="${to.y + 20}" stroke="var(--dag-edge)" stroke-width="2" marker-end="url(#arrow)" />`;
      }
    });

    // Draw task nodes
    tasks.forEach(t => {
      const pos = nodePositions.get(t.id);
      const isCritical = parseFloat(t.impact_index) >= 8.0;
      svgHtml += `
        <g transform="translate(${pos.x}, ${pos.y})">
          <rect width="140" height="45" rx="6" fill="var(--dag-node)" stroke="${isCritical ? 'var(--dag-critical)' : 'var(--border)'}" stroke-width="${isCritical ? '2' : '1'}"/>
          <text x="10" y="20" font-size="11" font-weight="bold" fill="var(--text-primary)">${t.title.substring(0, 18)}...</text>
          <text x="10" y="35" font-size="9" fill="var(--accent)">Rank: ${ScoringEngine.calculatePriorityRank(t.impact_index, t.sync_index)}</text>
        </g>
      `;
    });

    svgHtml += `</svg>`;
    return svgHtml;
  }
}