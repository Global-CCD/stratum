// public/js/app.js - Stratum Core Reactive Bootstrap & View Router
import { db } from './db.js';
import { ScoringEngine } from './scoring.js';
import { StrictSocValidator } from './validator.js';
import { VectorMath } from './vectorMath.js';
import { ProofGatekeeper } from './proofGate.js';
import { QaAuditRunner } from './qaAudit.js';

class App {
  constructor() {
    this.currentView = 'matrix';
    this.init();
  }

  async init() {
    try {
      await db.init();
      await this.seedBaselineIfEmpty();
      this.bindEvents();
      await this.render();
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }

  async seedBaselineIfEmpty() {
    const visions = await db.getAll('visions');
    if (visions.length === 0) {
      const v = await db.put('visions', {
        title: 'Enterprise Operational Excellence',
        narrative: 'Automate repetitive workflows and eliminate unvalidated busywork.'
      });
      const h = await db.put('horizons', {
        vision_id: v.id,
        tier: 'H1_QUARTER',
        start_date: '2025-01-01',
        end_date: '2025-03-31'
      });
      const obj = await db.put('objectives', {
        horizon_id: h.id,
        title: 'Reduce Enterprise Onboarding Time by 50%'
      });
      const prj = await db.put('projects', {
        objective_id: obj.id,
        title: 'SSO & Identity Automation',
        scope_boundary: 'SAML 2.0 and Okta integration'
      });
      await db.put('tasks', {
        project_id: prj.id,
        title: 'Build Okta SAML 2.0 Auth Flow',
        impact_index: 9.0,
        sync_index: 95.0,
        status: 'ACTIVE'
      });
      await db.put('tasks', {
        project_id: prj.id,
        title: 'Legacy PDF Manual Generator (Scope Creep)',
        impact_index: 3.0,
        sync_index: 35.0,
        status: 'BLOCKED'
      });
    }
  }

  bindEvents() {
    // 1. Navigation Tabs (Strictly target .nav-tabs buttons only)
    document.querySelectorAll('.nav-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const targetView = targetBtn.getAttribute('data-view');

        if (!targetView) return;

        document.querySelectorAll('.nav-tabs .tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });

        targetBtn.classList.add('active');
        targetBtn.setAttribute('aria-selected', 'true');
        
        this.currentView = targetView;
        this.render();
      });
    });

    // 2. Modal Cancel Button
    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.getElementById('proof-modal').classList.add('hidden');
      });
    }

    // 3. Proof-of-Outcome Form Submit
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

    // Defensive fallback
    const activeView = this.currentView || 'matrix';

    switch (activeView) {
      case 'matrix':
        await this.renderMatrixView(main);
        break;
      case 'hierarchy':
        await this.renderHierarchyView(main);
        break;
      case 'ingest':
        await this.renderIngestView(main);
        break;
      case 'epistemic':
        await this.renderEpistemicView(main);
        break;
      case 'qa':
        await this.renderQaView(main);
        break;
      default:
        await this.renderMatrixView(main);
        break;
    }
  }

  // --- 1. 2x2 Matrix View ---
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
          ${isBlocked ? '<span class="blocked-badge">BLOCKED (<50% Sync)</span>' : ''}
        </div>
        ${t.status !== 'CLOSED' && !isBlocked ? `<button class="btn-primary close-task-btn" data-id="${t.id}" style="font-size:0.75rem; padding:0.25rem 0.6rem; margin-top:0.4rem;">Mark Done</button>` : ''}
        ${t.status === 'CLOSED' ? '<span style="color:var(--q1); font-size:0.75rem; font-weight:bold;">✅ Verified &amp; Closed</span>' : ''}
      </div>
    `;
  }

  // --- 2. 5-Layer Hierarchy View ---
  async renderHierarchyView(container) {
    const visions = await db.getAll('visions');
    const horizons = await db.getAll('horizons');
    const objectives = await db.getAll('objectives');
    const projects = await db.getAll('projects');
    const tasks = await db.getAll('tasks');

    container.innerHTML = `
      <div class="panel">
        <h3>5-Layer Strict SoC Relational Tree</h3>
        <p style="color:var(--text-muted); margin-bottom:1rem; font-size:0.9rem;">
          Enforces unidirectional non-skipping parent-child relationships (Task &rarr; Project &rarr; Objective &rarr; Horizon &rarr; Vision).
        </p>
        <div style="font-family:monospace; font-size:0.9rem; line-height:1.8;">
          ${visions.map(v => `
            <div>🏛️ <strong>[L2 Vision]</strong> ${v.title}</div>
            ${horizons.filter(h => h.vision_id === v.id).map(h => `
              <div style="margin-left:1.5rem;">📅 <strong>[L2 Horizon]</strong> ${h.tier} (${h.start_date} &rarr; ${h.end_date})</div>
              ${objectives.filter(o => o.horizon_id === h.id).map(o => `
                <div style="margin-left:3rem;">🎯 <strong>[L3 Objective]</strong> ${o.title}</div>
                ${projects.filter(p => p.objective_id === o.id).map(p => `
                  <div style="margin-left:4.5rem;">📁 <strong>[L3 Project]</strong> ${p.title} (Boundary: ${p.scope_boundary || 'None'})</div>
                  ${tasks.filter(t => t.project_id === p.id).map(t => `
                    <div style="margin-left:6rem;">⚡ <strong>[L4 Task]</strong> ${t.title} [Sync: ${t.sync_index}% | Impact: ${t.impact_index} | Rank: ${ScoringEngine.calculatePriorityRank(t.impact_index, t.sync_index)}]</div>
                  `).join('')}
                `).join('')}
              `).join('')}
            `).join('')}
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- 3. Quick Ingest (L5 Substrate) View ---
  async renderIngestView(container) {
    const freeNotes = await db.getAll('free_notes');
    container.innerHTML = `
      <div class="panel">
        <h3>Layer 5: Substrate Quick Ingest</h3>
        <p style="color:var(--text-muted); margin-bottom:1rem; font-size:0.85rem;">Capture raw notes, bookmarks, or upload evidence artifacts directly into IndexedDB.</p>
        
        <form id="free-note-form" style="margin-bottom:1.5rem;">
          <label>Capture Fleeting Thought / Scratchpad:
            <textarea id="free-note-input" required rows="2" placeholder="Paste thoughts, links, or notes to triage later..."></textarea>
          </label>
          <button type="submit" class="btn-primary">Capture to Substrate</button>
        </form>

        <h4>Unprocessed Inbox (${freeNotes.length})</h4>
        <div style="margin-top:0.5rem;">
          ${freeNotes.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">Inbox is clear.</p>' : ''}
          ${freeNotes.map(n => `
            <div class="task-card" style="margin-bottom:0.5rem;">
              <div style="font-size:0.85rem;">${n.raw_payload}</div>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.3rem;">Captured: ${new Date(n.updatedAt).toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const form = document.getElementById('free-note-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('free-note-input');
        await db.put('free_notes', { raw_payload: input.value });
        input.value = '';
        this.render();
      });
    }
  }

  // --- 4. Epistemic Governance (L1) View ---
  async renderEpistemicView(container) {
    const problems = await db.getAll('problems');
    container.innerHTML = `
      <div class="panel">
        <h3>Layer 1: Epistemic Governance Engine</h3>
        <p style="color:var(--text-muted); margin-bottom:1rem; font-size:0.85rem;">Frame problems before committing tools. Tests against tool-first cognitive bias.</p>

        <form id="problem-form" style="margin-bottom:1.5rem;">
          <label>Falsifiable Problem Statement (The "What" &amp; "Why"):
            <textarea id="problem-input" required rows="2" placeholder="State the gap in reality without mentioning any software tools or scripts..."></textarea>
          </label>
          <button type="submit" class="btn-primary">Register Problem</button>
        </form>

        <h4>Registered Epistemic Baselines (${problems.length})</h4>
        <div style="margin-top:0.5rem;">
          ${problems.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No problem baselines registered yet.</p>' : ''}
          ${problems.map(p => `
            <div class="task-card">
              <div style="font-size:0.85rem;"><strong>Problem:</strong> ${p.falsifiable_gap}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const form = document.getElementById('problem-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('problem-input');
        const smell = ProofGatekeeper.detectToolFirstAntiPattern(input.value);
        if (smell.flagged) {
          alert('⚠️ ' + smell.warning);
        }
        await db.put('problems', { falsifiable_gap: input.value });
        input.value = '';
        this.render();
      });
    }
  }

  // --- 5. Automated QA Audit View ---
  async renderQaView(container) {
    container.innerHTML = `<div class="panel"><h3>Running Automated QA Audit...</h3></div>`;
    const report = await QaAuditRunner.runFullAudit(db);
    container.innerHTML = `
      <div class="panel">
        <h2>System QA Audit Scorecard: ${report.totalScore} / 100</h2>
        <p style="margin: 0.5rem 0 1rem 0; color: ${report.totalScore === 100 ? 'var(--q1)' : 'var(--q2)'}; font-weight:bold;">
          ${report.totalScore === 100 ? 'GRADE A: Production Ready for v1.0.0 GA' : 'GRADE B / F: Action Required'}
        </p>
        <div style="background:var(--bg-primary); padding:1rem; border-radius:6px; font-family:monospace; font-size:0.85rem; line-height:1.6;">
          ${report.details.map(d => `<div style="margin-bottom:0.4rem;">${d}</div>`).join('')}
        </div>
      </div>
    `;
  }
}

// Bootstrap Application
new App();
