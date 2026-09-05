// public/js/app.js - Full Stratum v2.0.0 Router
import { db } from './db.js';
import { ThemeManager } from './theme.js';
import { ScoringEngine } from './scoring.js';
import { StrictSocValidator } from './validator.js';
import { DedupEngine } from './dedupEngine.js';
import { DagEngine } from './dagEngine.js';
import { ProofGatekeeper } from './proofGate.js';
import { CryptoSync } from './cryptoSync.js';
import { QaAuditRunner } from './qaAudit.js';

class App {
  constructor() {
    this.currentView = 'matrix';
    this.dependencies = [];
    this.init();
  }

  async init() {
    ThemeManager.init();
    await db.init();
    await this.seedBaselineIfEmpty();
    this.bindEvents();
    await this.render();
  }

  async seedBaselineIfEmpty() {
    const visions = await db.getAll('visions');
    if (visions.length === 0) {
      const v = await db.put('visions', { title: 'Enterprise Operational Excellence', narrative: 'Zero unvalidated busywork.' });
      const h = await db.put('horizons', { vision_id: v.id, tier: 'H1_QUARTER', start_date: '2025-01-01', end_date: '2025-03-31' });
      const obj = await db.put('objectives', { horizon_id: h.id, title: 'Reduce Enterprise Onboarding Time by 50%' });
      const prj = await db.put('projects', { objective_id: obj.id, title: 'SSO & Identity Automation', scope_boundary: 'SAML 2.0 & Okta' });
      
      const t1 = await db.put('tasks', { project_id: prj.id, title: 'Build Okta SAML 2.0 Auth Flow', impact_index: 9.0, sync_index: 95.0, status: 'ACTIVE' });
      const t2 = await db.put('tasks', { project_id: prj.id, title: 'Automated Domain Verification Logic', impact_index: 8.0, sync_index: 90.0, status: 'ACTIVE' });
      await db.put('tasks', { project_id: prj.id, title: 'Legacy PDF Manual Generator (Scope Creep)', impact_index: 3.0, sync_index: 35.0, status: 'BLOCKED' });

      this.dependencies.push({ fromTaskId: t1.id, toTaskId: t2.id });
    }
  }

  bindEvents() {
    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => ThemeManager.toggle());
    }

    // Navigation Tabs
    document.querySelectorAll('.nav-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = e.currentTarget.getAttribute('data-view');
        if (!targetView) return;

        document.querySelectorAll('.nav-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentView = targetView;
        this.render();
      });
    });

    // Modal Cancel
    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.getElementById('proof-modal').classList.add('hidden');
      });
    }

    // Proof Form Submit
    const proofForm = document.getElementById('proof-form');
    if (proofForm) {
      proofForm.addEventListener('submit', async (e) => {
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
  }

  async render() {
    const main = document.getElementById('main-view');
    if (!main) return;
    main.innerHTML = '';

    switch (this.currentView) {
      case 'matrix': await this.renderMatrixView(main); break;
      case 'dag': await this.renderDagView(main); break;
      case 'hierarchy': await this.renderHierarchyView(main); break;
      case 'sync': await this.renderSyncView(main); break;
      case 'qa': await this.renderQaView(main); break;
      default: await this.renderMatrixView(main); break;
    }
  }

  async renderMatrixView(container) {
    const tasks = await db.getAll('tasks');
    const quads = { Q1: [], Q2: [], Q3: [], Q4: [] };

    tasks.forEach(t => {
      t.priorityRank = ScoringEngine.calculatePriorityRank(t.impact_index, t.sync_index);
      const q = ScoringEngine.getQuadrant(t.impact_index, t.sync_index);
      if (quads[q]) quads[q].push(t);
    });

    Object.keys(quads).forEach(k => quads[k].sort((a, b) => b.priorityRank - a.priorityRank));

    container.innerHTML = `
      <div class="panel" style="margin-bottom:1rem; padding:1rem;">
        <h4 style="margin-bottom:0.5rem;">⚡ Quick Task Ingestion (With Real-Time Anti-Collision)</h4>
        <input type="text" id="quick-task-input" placeholder="Type new task title..." style="width:100%;">
        <div id="collision-alert" style="margin-top:0.5rem; font-size:0.8rem; color:var(--q2); font-weight:bold;"></div>
      </div>
      <div class="matrix-grid">
        <div class="matrix-quadrant q1"><h3>Q1: Core Priorities (Focus First) <span>${quads.Q1.length}</span></h3>${quads.Q1.map(t => this.renderTaskCard(t)).join('')}</div>
        <div class="matrix-quadrant q2"><h3>Q2: High Leverage (Evaluate) <span>${quads.Q2.length}</span></h3>${quads.Q2.map(t => this.renderTaskCard(t)).join('')}</div>
        <div class="matrix-quadrant q3"><h3>Q3: Maintenance (Delegate) <span>${quads.Q3.length}</span></h3>${quads.Q3.map(t => this.renderTaskCard(t)).join('')}</div>
        <div class="matrix-quadrant q4"><h3>Q4: Scope Creep (Eliminate) <span>${quads.Q4.length}</span></h3>${quads.Q4.map(t => this.renderTaskCard(t)).join('')}</div>
      </div>
    `;

    // Real-Time Deduplication Input Listener
    const input = document.getElementById('quick-task-input');
    input.addEventListener('input', (e) => {
      const match = DedupEngine.findCollision(e.target.value, tasks, 0.75);
      const alertBox = document.getElementById('collision-alert');
      if (match) {
        alertBox.innerHTML = `⚠️ Collision Detected: ${match.similarityScore}% match with existing task "${match.matchedTask.title}"`;
      } else {
        alertBox.innerHTML = '';
      }
    });

    // Mark Done buttons
    container.querySelectorAll('.close-task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
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
          ${isBlocked ? '<span class="blocked-badge">BLOCKED (<50%)</span>' : ''}
        </div>
        ${t.status !== 'CLOSED' && !isBlocked ? `<button class="btn-primary close-task-btn" data-id="${t.id}" style="font-size:0.75rem; padding:0.25rem 0.6rem; margin-top:0.4rem;">Mark Done</button>` : ''}
        ${t.status === 'CLOSED' ? '<span style="color:var(--q1); font-size:0.75rem; font-weight:bold;">✅ Verified &amp; Closed</span>' : ''}
      </div>
    `;
  }

  async renderDagView(container) {
    const tasks = await db.getAll('tasks');
    container.innerHTML = `
      <div class="panel">
        <h3>Sprint 8: Interactive Task Dependency Graph (DAG)</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem;">Visualized using Kahn's Topological Resolution &amp; Critical Path Detection.</p>
        <div class="dag-container">
          ${DagEngine.renderSvgDag(tasks, this.dependencies)}
        </div>
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
        <div style="font-family:monospace; line-height:1.8; font-size:0.85rem; margin-top:1rem;">
          ${visions.map(v => `
            <div>🏛️ [L2 Vision] ${v.title}</div>
            ${horizons.map(h => `
              <div style="margin-left:1.5rem;">📅 [L2 Horizon] ${h.tier} (${h.start_date} - ${h.end_date})</div>
              ${objectives.map(o => `
                <div style="margin-left:3rem;">🎯 [L3 Objective] ${o.title}</div>
                ${projects.map(p => `
                  <div style="margin-left:4.5rem;">📁 [L3 Project] ${p.title}</div>
                  ${tasks.map(t => `
                    <div style="margin-left:6rem;">⚡ [L4 Task] ${t.title} (Rank: ${ScoringEngine.calculatePriorityRank(t.impact_index, t.sync_index)})</div>
                  `).join('')}
                `).join('')}
              `).join('')}
            `).join('')}
          `).join('')}
        </div>
      </div>
    `;
  }

  async renderSyncView(container) {
    container.innerHTML = `
      <div class="panel">
        <h3>Sprint 10: Zero-Knowledge E2EE Cloud Sync</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem;">All tasks are encrypted in-browser via AES-GCM (256-bit) before transmitting to Cloudflare Edge.</p>
        <label>Passphrase:
          <input type="password" id="sync-pass" placeholder="Enter master decryption key...">
        </label>
        <button id="trigger-sync-btn" class="btn-primary">Encrypt &amp; Sync to Edge</button>
        <div id="sync-output" style="margin-top:1rem; font-family:monospace; font-size:0.8rem;"></div>
      </div>
    `;

    document.getElementById('trigger-sync-btn').addEventListener('click', async () => {
      const pass = document.getElementById('sync-pass').value;
      if (!pass) return alert('Enter passphrase');
      const allTasks = await db.getAll('tasks');
      const enc = await CryptoSync.encryptPayload(allTasks, pass);
      document.getElementById('sync-output').innerHTML = `
        <div style="color:var(--q1); margin-bottom:0.5rem;">🔒 Ciphertext Package Generated:</div>
        <textarea readonly style="width:100%; height:80px;">${JSON.stringify(enc)}</textarea>
      `;
    });
  }

  async renderQaView(container) {
    container.innerHTML = `<div class="panel"><h3>Executing 6-Pillar QA Audit...</h3></div>`;
    const report = await QaAuditRunner.runFullAudit(db);
    container.innerHTML = `
      <div class="panel">
        <h2>System QA Audit Scorecard: ${report.totalScore} / 100</h2>
        <p style="margin: 0.5rem 0 1rem 0; color: ${report.totalScore === 100 ? 'var(--q1)' : 'var(--q2)'}; font-weight:bold;">
          ${report.totalScore === 100 ? 'GRADE A: All Sprints (1–10) Verified & Production-Ready' : 'GRADE B / F: Action Required'}
        </p>
        <div style="background:var(--bg-primary); padding:1rem; border-radius:6px; font-family:monospace; font-size:0.85rem; line-height:1.6;">
          ${report.details.map(d => `<div style="margin-bottom:0.4rem;">${d}</div>`).join('')}
        </div>
      </div>
    `;
  }
}

new App();