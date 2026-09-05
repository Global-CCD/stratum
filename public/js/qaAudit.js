// public/js/qaAudit.js - Full Sprints 1-10 Automated QA Audit Runner
import { ScoringEngine } from './scoring.js';
import { StrictSocValidator } from './validator.js';
import { VectorMath } from './vectorMath.js';
import { ProofGatekeeper } from './proofGate.js';
import { DedupEngine } from './dedupEngine.js';
import { DagEngine } from './dagEngine.js';
import { ProofVerifier } from './proofVerifier.js';
import { CryptoSync } from './cryptoSync.js';

export class QaAuditRunner {
  static async runFullAudit(db) {
    const report = {
      p1_arch: 0,
      p2_math: 0,
      p3_dedup_ai: 0,
      p4_dag: 0,
      p5_proof: 0,
      p6_e2ee: 0,
      totalScore: 0,
      details: []
    };

    // --- Pillar 1: Architecture & Strict SoC (15 Pts) ---
    let layerThrew = false;
    try {
      await StrictSocValidator.validateParentLink(db, 'tasks', { project_id: null, horizon_id: 'bad-jump' });
    } catch {
      layerThrew = true;
    }
    if (layerThrew) {
      report.p1_arch = 15;
      report.details.push('✅ Pillar 1 PASS: Strict SoC blocked illegal layer-skipping.');
    }

    // --- Pillar 2: Dynamic Math & Anti-Creep (15 Pts) ---
    const rank = ScoringEngine.calculatePriorityRank(8.0, 90.0);
    const antiCreep = ScoringEngine.evaluateExecutionStatus(35.0);
    if (rank === 8.4 && antiCreep.isBlocked) {
      report.p2_math = 15;
      report.details.push('✅ Pillar 2 PASS: Priority Rank (8.40) & Anti-Creep Lock (<50%) validated.');
    }

    // --- Pillar 3: Sprint 7 Deduplication & Vectors (20 Pts) ---
    const collision = DedupEngine.findCollision('Build SAML 2.0 Auth', [
      { id: '1', title: 'Build SAML 2.0 Auth Flow' }
    ], 0.80);
    if (collision && collision.collision) {
      report.p3_dedup_ai = 20;
      report.details.push(`✅ Pillar 3 PASS: Real-time collision detected (${collision.similarityScore}% match).`);
    }

    // --- Pillar 4: Sprint 8 DAG & Cycle Detection (15 Pts) ---
    const cycleTest = DagEngine.resolveDependencies(
      [{ id: 'A' }, { id: 'B' }],
      [{ fromTaskId: 'A', toTaskId: 'B' }, { fromTaskId: 'B', toTaskId: 'A' }] // circular
    );
    if (cycleTest.hasCycle) {
      report.p4_dag = 15;
      report.details.push('✅ Pillar 4 PASS: Kahn\'s algorithm caught circular dependency cycle.');
    }

    // --- Pillar 5: Sprint 9 Telemetry Proof Verification (15 Pts) ---
    const metricPass = ProofVerifier.evaluateMetricProof(
      { metric: 'latency_ms', operator: '<', threshold: 100 },
      { metric: 'latency_ms', value: 64 }
    );
    if (metricPass.verified) {
      report.p5_proof = 15;
      report.details.push('✅ Pillar 5 PASS: Metric telemetry proof verified (64ms < 100ms).');
    }

    // --- Pillar 6: Sprint 10 Zero-Knowledge E2EE Sync (20 Pts) ---
    const secret = { test: 'payload_data_confidential' };
    const pass = 'master_passphrase_stratum';
    const encrypted = await CryptoSync.encryptPayload(secret, pass);
    const decrypted = await CryptoSync.decryptPayload(encrypted, pass);
    if (decrypted.test === secret.test && encrypted.cipherText !== JSON.stringify(secret)) {
      report.p6_e2ee = 20;
      report.details.push('✅ Pillar 6 PASS: AES-256-GCM encryption & decryption roundtrip authenticated.');
    }

    report.totalScore = report.p1_arch + report.p2_math + report.p3_dedup_ai + report.p4_dag + report.p5_proof + report.p6_e2ee;
    return report;
  }
}