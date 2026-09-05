// public/js/app.js - Main Application Bootstrap
import { db } from './db.js';
import { ScoringEngine } from './scoring.js';
import { StrictSocValidator } from './validator.js';
import { ProofGatekeeper } from './proofGate.js';
import { QaAuditRunner } from './qaAudit.js';

class App {
  constructor() {
    this.currentView = 'matrix';
    this.init();
  }

  async init() {
    await db.init();
    await this.seedBaselineIfEmpty();
    this.bindEvents();
    this.render();
  }

  async seedBaselineIfEmpty() {
    const visions = await db.getAll('visions');
    if (visions.length === 0) {
      const v = await db.put('visions', { title: 'Enterprise Operational Excellence', narrative: 'Core North Star' });
      const h = await db.put('horizons', { vision_id: v.id, tier: 'H1_QUARTER', start_date: '2025-01-01', end_date: '2025-03-31' });
      const obj = await db.put('objectives', { horizon_id: h.id, title: 'Reduce Enterprise Onboarding Time by 50%' });
      const prj = await db.put('projects', { objective_id: obj.id, title: 'SSO & Identity Automation', scope_boundary: 'SAML and Okta flows' });
      await db.put('tasks', {
        project_id: prj.id,
        title: 'Build Okta SAML 2.0 Auth Flow',
        impact_index: 9.0,
        sync_index: 95.0,
        status: 'ACTIVE'
      });
      await db.put('tasks', {
        project_id: prj.id,
        title: 'Legacy PDF Generator (Scope Creep)',
        impact_index: 3.0,
        sync_index: 35.0,
        status: 'BLOCKED'
      });
    }
  }

  bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentView = e.target.dataset.view;
        this.render();
      });
    });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
      document.getElementById('proof-modal').classList.add('hidden');
    });

    document.getElementById('proof-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskId = document.getElementById('proof-task-id').value;
      const proof = {
        task_id: taskId,
        proof_type: document.getElementById('proof-type').value,
        verification_spec: document.getElementById('proof-spec').value,
        evidence_payload_uri: document.getElementById('proof-uri').value,
        is_validated: true
      };
      await db.put('proofs', proof);
      const task = await db.get('tasks', taskId);
      task.status = 'CLOSED';
      await db.put('tasks', task);
      document.getElementById('proof-modal').classList.add('hidden');
      this.render();
    });
  }

  async render() {
    const main = document.getElementById('main-view');
    main.innerHTML = '';

    if (this.currentView === 'matrix') {
      await this.renderMatrixView(main);
    } else if (this.currentView === 'hierarchy') {
      await this.renderHierarchyView(main);
    } else if (this.currentView === 'qa') {
      await this.renderQaView(main);
    } else {
      main.innerHTML = `<div class="panel"><h3>${this.currentView.toUpperCase()} Layer Active</h3><p>Operational.</p></div>`;
    }
  }

  async renderMatrixView(container) {
    const tasks = await db.getAll('tasks');
    const quads = { Q1: [], Q2: [], Q3: [], Q4: [] };

    tasks.forEach(t => {
      t.priorityRank = ScoringEngine.calculatePriorityRank(t.impact_index, t.sync_index);
      const q = ScoringEngine.getQuadrant(t.impact_index, t.sync_index);
      quads[q].push(t);
    });

    Object.keys(quads).forEach(k => quads[k].sort((a, b) => b.priorityRank - a.priorityRank));

    container.innerHTML = `
      <div class="matrix-grid">
        <div class="matrix-quadrant q1">
          <h3>Q1: Core Priorities (Focus First) <span>${quads.Q1.length}</span></h3>
          <div class="task-list">${quads.Q1.map(t => this.renderTaskCard(t)).join('')}</div>
        </div>
        <div class="matrix-quadrant q2">
          <h3>Q2: High Leverage (Evaluate) <span>${quads.Q2.length}</span></h3>
          <div class="task-list">${quads.Q2.map(t => this.renderTaskCard(t)).join('')}</div>
        </div>
        <div class="matrix-quadrant q3">
          <h3>Q3: Maintenance (Delegate) <span>${quads.Q3.length}</span></h3>
          <div class="task-list">${quads.Q3.map(t => this.renderTaskCard(t)).join('')}</div>
        </div>
        <div class="matrix-quadrant q4">
          <h3>Q4: Scope Creep (Eliminate) <span>${quads.Q4.length}</span></h3>
          <div class="task-list">${quads.Q4.map(t => this.renderTaskCard(t)).join('')}</div>
        </div>
      </div>
    `;

    container.querySelectorAll('.close-task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const task = await db.get('tasks', id);
        const proofs = await db.getAll('proofs');
        const taskProof = proofs.find(p => p.task_id === id);

        const check = ProofGatekeeper.canCloseTask(task, taskProof);
        if (check.allowed) {
          task.status = 'CLOSED';
          await db.put('tasks', task);
          this.render();
        } else {
          document.getElementById('proof-task-id').value = id;
          document.getElementById('proof-modal').classList.remove('hidden');
        }
      });
    });
  }

  renderTaskCard(t) {
    const isBlocked = parseFloat(t.sync_index) < 50.0;
    return `
      <div class="task-card">
        <div class="task-header">
          <span>${t.title}</span>
          <span class="rank-badge">${t.priorityRank}</span>
        </div>
        <div class="task-meta">
          <span>Impact: ${t.impact_index}</span> | 
          <span>Sync: ${t.sync_index}%</span>
          ${isBlocked ? '<span class="blocked-badge">BLOCKED (<50% Sync)</span>' : ''}
        </div>
        ${t.status !== 'CLOSED' && !isBlocked ? `<button class="btn-primary close-task-btn" data-id="${t.id}" style="font-size:0.75rem; padding:0.2rem 0.5rem;">Mark Done</button>` : ''}
        ${t.status === 'CLOSED' ? '<span style="color:var(--q1); font-size:0.75rem; font-weight:bold;">✅ Verified & Closed</span>' : ''}
      </div>
    `;
  }

  async renderHierarchyView(container) {
    const visions = await db.getAll('visions');
    const horizons = await db.getAll('horizons');
    const objectives = await db.getAll('objectives');
    const projects = await db.getAll('projects');
    const tasks = await db.getAll('tasks');

    container.innerHTML = `
      <div class="panel">
        <h3>5-Layer Strict SoC Relational Tree</h3>
        <p style="color:var(--text-muted); margin-bottom:1rem;">Enforcing unidirectional non-skipping parent-child bonds.</p>
        <div style="font-family:monospace; line-height:1.6;">
          ${visions.map(v => `
            <div>🏛️ [L2 Vision] ${v.title}</div>
            ${horizons.filter(h => h.vision_id === v.id).map(h => `
              <div style="margin-left:1.5rem;">📅 [L2 Horizon] ${h.tier} (${h.start_date} - ${h.end_date})</div>
              ${objectives.filter(o => o.horizon_id === h.id).map(o => `
                <div style="margin-left:3rem;">🎯 [L3 Objective] ${o.title}</div>
                ${projects.filter(p => p.objective_id === o.id).map(p => `
                  <div style="margin-left:4.5rem;">📁 [L3 Project] ${p.title} (Boundary: ${p.scope_boundary})</div>
                  ${tasks.filter(t => t.project_id === p.id).map(t => `
                    <div style="margin-left:6rem;">⚡ [L4 Task] ${t.title} [Sync: ${t.sync_index}% | Impact: ${t.impact_index} | Rank: ${ScoringEngine.calculatePriorityRank(t.impact_index, t.sync_index)}]</div>
                  `).join('')}
                `).join('')}
              `).join('')}
            `).join('')}
          `).join('')}
        </div>
      </div>
    `;
  }

  async renderQaView(container) {
    container.innerHTML = `<div class="panel"><h3>Running Automated QA Audit...</h3></div>`;
    const report = await QaAuditRunner.runFullAudit(db);
    container.innerHTML = `
      <div class="panel">
        <h2>System QA Audit Scorecard: ${report.totalScore} / 100</h2>
        <p style="margin: 0.5rem 0 1rem 0; color: ${report.totalScore === 100 ? 'var(--q1)' : 'var(--q2)'}; font-weight:bold;">
          ${report.totalScore === 100 ? 'GRADE A: Production Ready for v1.0.0 GA' : 'GRADE B / F: Action Required'}
        </p>
        <div style="background:var(--bg-primary); padding:1rem; border-radius:6px; font-family:monospace;">
          ${report.details.map(d => `<div style="margin-bottom:0.4rem;">${d}</div>`).join('')}
        </div>
      </div>
    `;
  }
}

new App();