// public/js/qaAudit.js - Full Adversarial Fuzzing & 6-Pillar Test Suite
import { ScoringEngine } from './scoring.js';
import { StrictSocValidator } from './validator.js';
import { VectorMath } from './vectorMath.js';
import { ProofGatekeeper } from './proofGate.js';
import { DedupEngine } from './dedupEngine.js';
import { DagEngine } from './dagEngine.js';

export class QaAuditRunner {
  static async runFullAudit(db) {
    const report = {
      p1_arch: 0,
      p2_math: 0,
      p3_fuzz: 0,
      p4_dag: 0,
      p5_proof: 0,
      p6_dedup: 0,
      totalScore: 0,
      details: []
    };

    // --- 1. Strict SoC Isolation (15 Pts) ---
    try {
      let threw = false;
      try {
        await StrictSocValidator.validateParentLink(db, 'tasks', { project_id: null, horizon_id: 'bad-jump' });
      } catch {
        threw = true;
      }
      if (threw) {
        report.p1_arch = 15;
        report.details.push('✅ Pillar 1 PASS: Strict SoC blocked layer-skipping foreign keys.');
      }
    } catch (e) {
      report.details.push(`❌ Pillar 1 FAIL: ${e.message}`);
    }

    // --- 2. Inherited Priority Inversion Fix (15 Pts) ---
    const blockerTask = { id: 'T1', impact_index: 2.0 };
    const downstreamTask = { id: 'T2', impact_index: 10.0 };
    const deps = [{ fromTaskId: 'T1', toTaskId: 'T2' }];
    const effectiveImpact = ScoringEngine.calculateEffectiveImpact(blockerTask, [blockerTask, downstreamTask], deps);
    
    if (effectiveImpact >= 7.6) {
      report.p2_math = 15;
      report.details.push(`✅ Pillar 2 PASS: Priority inversion resolved (Blocker boosted: 2.0 ➔ ${effectiveImpact}).`);
    } else {
      report.details.push('❌ Pillar 2 FAIL: Priority inversion unmitigated.');
    }

    // --- 3. 10,000-Iteration Adversarial Fuzz Suite (20 Pts) ---
    const fuzzSamples = [
      '', '   ', null, undefined, NaN, Infinity, -1, 9999999,
      '🔥'.repeat(200), '- - - - - - -', '"><script>alert(1)</script>',
      { corrupt: true }, [1, 2, 'bad']
    ];

    let fuzzFailures = 0;
    for (let i = 0; i < 10000; i++) {
      const sampleA = fuzzSamples[i % fuzzSamples.length];
      const sampleB = fuzzSamples[(i + 3) % fuzzSamples.length];
      
      const rank = ScoringEngine.calculatePriorityRank(sampleA, sampleB);
      if (isNaN(rank) || !isFinite(rank) || rank < 0) fuzzFailures++;

      const sim = VectorMath.cosineSimilarity(sampleA, sampleB);
      if (isNaN(sim) || !isFinite(sim)) fuzzFailures++;
    }

    if (fuzzFailures === 0) {
      report.p3_fuzz = 20;
      report.details.push('✅ Pillar 3 PASS: 10,000-iteration adversarial fuzz suite completed (0 NaN / 0 Crashes).');
    } else {
      report.details.push(`❌ Pillar 3 FAIL: ${fuzzFailures} fuzz iterations crashed.`);
    }

    // --- 4. Topological Cycle Detection (15 Pts) ---
    const cycleRes = DagEngine.resolveDependencies(
      [{ id: 'A' }, { id: 'B' }],
      [{ fromTaskId: 'A', toTaskId: 'B' }, { fromTaskId: 'B', toTaskId: 'A' }]
    );
    if (cycleRes.hasCycle) {
      report.p4_dag = 15;
      report.details.push("✅ Pillar 4 PASS: Kahn's DAG algorithm caught cyclic dependency.");
    }

    // --- 5. Proof-of-Outcome Signature Binding (15 Pts) ---
    const sig = await ProofGatekeeper.generateProofSignature('TASK-101', 'https://telemetry.log/1');
    if (sig && sig.length === 64) {
      report.p5_proof = 15;
      report.details.push(`✅ Pillar 5 PASS: Cryptographic Proof Signature bound (SHA-256: ${sig.substring(0, 8)}...).`);
    }

    // --- 6. Positional N-Gram Anti-Anagram Dedup (20 Pts) ---
    const anagramCollision = DedupEngine.findCollision('Listen', [{ id: '1', title: 'Silent' }], 0.85);
    const trueMatch = DedupEngine.findCollision('Deploy Okta SSO Auth', [{ id: '2', title: 'Deploy Okta SSO Auth' }], 0.85);
    
    if (!anagramCollision && trueMatch) {
      report.p6_dedup = 20;
      report.details.push('✅ Pillar 6 PASS: Anagram false-positives eliminated; true duplicates caught.');
    } else {
      report.details.push('❌ Pillar 6 FAIL: Anagram deduplication false positive detected.');
    }

    report.totalScore = report.p1_arch + report.p2_math + report.p3_fuzz + report.p4_dag + report.p5_proof + report.p6_dedup;
    return report;
  }
}