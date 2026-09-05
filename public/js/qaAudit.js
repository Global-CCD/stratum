// public/js/qaAudit.js - Built-in Automated QA Audit Suite
import { ScoringEngine } from './scoring.js';
import { StrictSocValidator } from './validator.js';
import { VectorMath } from './vectorMath.js';
import { ProofGatekeeper } from './proofGate.js';

export class QaAuditRunner {
  static async runFullAudit(db) {
    const report = {
      p1_arch: 0,
      p2_math: 0,
      p3_perf: 0,
      p4_integrity: 0,
      totalScore: 0,
      details: []
    };

    // --- Pillar 1: Architecture & Strict SoC (25 Pts) ---
    try {
      // Test invalid layer jump: Task directly to Horizon
      let threw = false;
      try {
        await StrictSocValidator.validateParentLink(db, 'tasks', { project_id: null, horizon_id: 'invalid-jump' });
      } catch {
        threw = true;
      }
      if (threw) {
        report.p1_arch += 25;
        report.details.push('✅ Pillar 1 PASS: Strict SoC blocked layer-skipping.');
      } else {
        report.details.push('❌ Pillar 1 FAIL: Strict SoC allowed layer bypass.');
      }
    } catch (e) {
      report.details.push(`❌ Pillar 1 ERROR: ${e.message}`);
    }

    // --- Pillar 2: Math & Scoring Engine (25 Pts) ---
    const rank = ScoringEngine.calculatePriorityRank(8.0, 90.0); // (8 * 0.6) + (9 * 0.4) = 4.8 + 3.6 = 8.4
    const antiCreep = ScoringEngine.evaluateExecutionStatus(35.0);
    if (rank === 8.4 && antiCreep.isBlocked === true) {
      report.p2_math += 25;
      report.details.push('✅ Pillar 2 PASS: Priority formula and Anti-Creep gate deterministic.');
    } else {
      report.details.push('❌ Pillar 2 FAIL: Math calculation error.');
    }

    // --- Pillar 3: Performance & Vector Math (25 Pts) ---
    const start = performance.now();
    const sim = VectorMath.cosineSimilarity([1, 0, 1], [1, 0, 1]);
    const norm = VectorMath.normalizeSyncIndex(0.85); // should be 100
    const duration = performance.now() - start;
    if (sim === 1.0 && norm === 100.0 && duration < 5.0) {
      report.p3_perf += 25;
      report.details.push(`✅ Pillar 3 PASS: Vector math executed in ${duration.toFixed(2)} ms.`);
    } else {
      report.details.push('❌ Pillar 3 FAIL: Vector math performance or logic error.');
    }

    // --- Pillar 4: Epistemic & Proof Gating (25 Pts) ---
    const toolSmell = ProofGatekeeper.detectToolFirstAntiPattern('Write python script for audio');
    const closureBlock = ProofGatekeeper.canCloseTask({ impact_index: 8.5 }, null);
    if (toolSmell.flagged && !closureBlock.allowed) {
      report.p4_integrity += 25;
      report.details.push('✅ Pillar 4 PASS: Tool-first detected & unbacked closure blocked.');
    } else {
      report.details.push('❌ Pillar 4 FAIL: Proof Gatekeeper bypassed.');
    }

    report.totalScore = report.p1_arch + report.p2_math + report.p3_perf + report.p4_integrity;
    return report;
  }
}