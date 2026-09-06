// public/js/dagEngine.js - Topological Sorting, Cycle Blocker & Urgency Burn
import { ScoringEngine } from './scoring.js';

export class DagEngine {
  /**
   * Kahn's Algorithm for Topological Sort & Cycle Detection
   */
  static resolveDependencies(tasks = [], dependencies = []) {
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

    return { orderedTaskIds: ordered, hasCycle: ordered.length !== tasks.length };
  }

  /**
   * Computes Urgency Burn countdown based on target deadline
   */
  static calculateUrgencyBurn(targetDateStr, totalDaysAllocated = 14) {
    if (!targetDateStr) {
      return { daysRemaining: 14, urgencyScore: 1.0, isBurning: false };
    }

    const now = new Date();
    const target = new Date(targetDateStr);
    
    if (isNaN(target.getTime())) {
      return { daysRemaining: 14, urgencyScore: 1.0, isBurning: false };
    }

    const diffMs = target - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const urgencyScore = Math.min(10.0, Math.max(1.0, 10.0 - (daysRemaining / totalDaysAllocated) * 10.0));

    return {
      daysRemaining,
      urgencyScore: Math.round(urgencyScore * 10) / 10,
      isBurning: daysRemaining <= 3
    };
  }

  /**
   * Renders interactive SVG representation of the Task DAG
   */
  static renderSvgDag(tasks = [], dependencies = []) {
    if (!tasks || tasks.length === 0) {
      return '<p style="padding:1rem; color:var(--text-muted);">No active tasks in DAG.</p>';
    }

    let svgHtml = `<svg class="dag-svg" viewBox="0 0 900 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dag-edge)"/>
        </marker>
      </defs>`;

    const nodePositions = new Map();
    tasks.forEach((t, i) => {
      const x = 60 + (i % 4) * 210;
      const y = 60 + Math.floor(i / 4) * 130;
      nodePositions.set(t.id, { x, y });
    });

    // Draw dependency lines
    dependencies.forEach(dep => {
      const from = nodePositions.get(dep.fromTaskId);
      const to = nodePositions.get(dep.toTaskId);
      if (from && to) {
        svgHtml += `<line x1="${from.x + 160}" y1="${from.y + 25}" x2="${to.x}" y2="${to.y + 25}" stroke="var(--dag-edge)" stroke-width="2" marker-end="url(#arrow)" />`;
      }
    });

    // Draw task nodes
    tasks.forEach(t => {
      const pos = nodePositions.get(t.id);
      const isCritical = Number(t.impact_index) >= 8.0;
      const rank = ScoringEngine.calculatePriorityRank(t.impact_index, t.sync_index);
      svgHtml += `
        <g class="dag-node" transform="translate(${pos.x}, ${pos.y})" data-task-id="${t.id}" style="cursor:pointer;">
          <rect width="160" height="50" rx="6" fill="var(--dag-node)" stroke="${isCritical ? 'var(--dag-critical)' : 'var(--border)'}" stroke-width="${isCritical ? '2' : '1'}"/>
          <text x="10" y="22" font-size="11" font-weight="bold" fill="var(--text-primary)">${(t.title || '').substring(0, 20)}...</text>
          <text x="10" y="38" font-size="9" fill="var(--accent)">Priority Rank: ${rank}</text>
        </g>
      `;
    });

    svgHtml += `</svg>`;
    return svgHtml;
  }
}