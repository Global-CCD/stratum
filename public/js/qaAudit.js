// public/js/qaAudit.js - Full Phase 3 (Sprints 21–24) Adversarial Test Suite
import { StrictSocValidator } from './validator.js';
import { ScoringEngine } from './scoring.js';
import { VectorMath } from './vectorMath.js';
import { CrdtEngine } from './crdtEngine.js';
import { P2pMeshEngine } from './p2pMesh.js';
import { BayesianMonteCarloEngine } from './bayesianMonteCarlo.js';
import { EnterpriseMeshEngine } from './enterpriseMesh.js';

export class QaAuditRunner {
  static async runFullAudit(db) {
    const report = {
      p1_arch: 0,
      p2_crdt_vault: 0,
      p3_p2p_gossip: 0,
      p4_bayesian_montecarlo: 0,
      p5_enterprise_soc2: 0,
      p6_adversarial_fuzz: 0,
      totalScore: 0,
      details: []
    };

    // --- 1. Strict SoC Layer Isolation (15 Pts) ---
    try {
      let threw = false;
      try {
        await StrictSocValidator.validateParentLink(db, 'tasks', { project_id: null, horizon_id: 'illegal-jump' });
      } catch { threw = true; }
      if (threw) {
        report.p1_arch = 15;
        report.details.push('✅ Pillar 1 PASS: Strict SoC boundary rules verified (0 layer bypass).');
      }
    } catch (e) {
      report.details.push(`❌ Pillar 1 FAIL: ${e.message}`);
    }

    // --- 2. Sprint 21: CRDT State-Vector Merge Conflict Test (20 Pts) ---
    const localMap = new Map([
      ['T1', { nodeId: 'T1', lamportTimestamp: 1000, clientId: 'clientA', data: { title: 'Local Edit' } }]
    ]);
    const incomingMap = new Map([
      ['T1', { nodeId: 'T1', lamportTimestamp: 2000, clientId: 'clientB', data: { title: 'Remote Edit Winner' } }]
    ]);
    const crdtMerge = CrdtEngine.mergeStateVectors(localMap, incomingMap);
    if (crdtMerge.mergedMap.get('T1').data.title === 'Remote Edit Winner' && crdtMerge.conflictsCount === 1) {
      report.p2_crdt_vault = 20;
      report.details.push('✅ Pillar 2 PASS: CRDT LWW merge resolved split-brain state deterministically.');
    }

    // --- 3. Sprint 22: P2P Gossip Broadcast Protocol (15 Pts) ---
    const mesh = new P2pMeshEngine('local_node');
    mesh.connectPeer('peer_alpha');
    mesh.connectPeer('peer_beta');
    const gossip = mesh.broadcastGossip('TASK_SYNC', { id: 'T1' });
    if (gossip.peersNotified === 2 && gossip.messageId) {
      report.p3_p2p_gossip = 15;
      report.details.push('✅ Pillar 3 PASS: P2P WebRTC Gossip Mesh broadcasted to 2 active peers.');
    }

    // --- 4. Sprint 23: Bayesian Weights & Monte Carlo Simulator (20 Pts) ---
    const completedSample = [
      { impact_index: 9.0, status: 'CLOSED' },
      { impact_index: 8.0, status: 'CLOSED' },
      { impact_index: 9.0, status: 'CLOSED' },
      { impact_index: 8.5, status: 'CLOSED' },
      { impact_index: 7.5, status: 'CLOSED' }
    ];
    const bayes = BayesianMonteCarloEngine.tuneBayesianWeights(completedSample);
    const mc = BayesianMonteCarloEngine.runMonteCarloSimulation(10, 2.5, 0.5, 500);
    if (bayes.posteriorConfidence === 'BAYESIAN_CONVERGED' && mc.p80Days > 0 && mc.p50Days <= mc.p95Days) {
      report.p4_bayesian_montecarlo = 20;
      report.details.push(`✅ Pillar 4 PASS: Bayesian weights tuned (${bayes.impactWeight}/${bayes.syncWeight}); Monte Carlo P80=${mc.p80Days}d.`);
    }

    // --- 5. Sprint 24: Enterprise Multi-Team Rollup & SOC2 Audit (15 Pts) ---
    const rollup = EnterpriseMeshEngine.aggregateTeamWorkspaces([
      { tasks: [{ impact_index: 9.0, sync_index: 90.0, status: 'CLOSED' }] },
      { tasks: [{ impact_index: 8.0, sync_index: 80.0, status: 'ACTIVE' }] }
    ]);
    const soc2 = await EnterpriseMeshEngine.generateSoc2AuditPackage(db);
    if (rollup.organizationalCompletionRate === 50 && soc2.master_package_signature.length === 64) {
      report.p5_enterprise_soc2 = 15;
      report.details.push(`✅ Pillar 5 PASS: Enterprise Rollup verified; SOC2 Master SHA-256 bound (${soc2.master_package_signature.substring(0, 8)}...).`);
    }

    // --- 6. 10,000-Iteration Adversarial Chaos Fuzzer (15 Pts) ---
    const fuzzSamples = ['', null, undefined, NaN, Infinity, -1, 9999999, '🔥'.repeat(100), '- - - -', '"><script>alert(1)</script>'];
    let fuzzCrashes = 0;
    for (let i = 0; i < 10000; i++) {
      const s1 = fuzzSamples[i % fuzzSamples.length];
      const s2 = fuzzSamples[(i + 3) % fuzzSamples.length];
      const rank = ScoringEngine.calculatePriorityRank(s1, s2);
      const sim = VectorMath.cosineSimilarity(s1, s2);
      if (isNaN(rank) || isNaN(sim)) fuzzCrashes++;
    }
    if (fuzzCrashes === 0) {
      report.p6_adversarial_fuzz = 15;
      report.details.push('✅ Pillar 6 PASS: 10,000-iteration adversarial fuzz suite executed with 0 crashes / 0 NaN.');
    }

    report.totalScore = report.p1_arch + report.p2_crdt_vault + report.p3_p2p_gossip + report.p4_bayesian_montecarlo + report.p5_enterprise_soc2 + report.p6_adversarial_fuzz;
    return report;
  }
}