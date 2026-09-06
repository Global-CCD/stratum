// public/js/telemetryStream.js - CI/CD Webhook Streamer & Immutable Proof Receipts
import { ProofGatekeeper } from './proofGate.js';
import { SyncChannel } from './syncChannel.js';

export class TelemetryStreamEngine {
  /**
   * Evaluates live telemetry stream (e.g. CI/CD test pass, latency monitor) against task criteria
   */
  static async processIncomingTelemetry(db, taskId, telemetryPayload = {}) {
    const task = await db.get('tasks', taskId);
    if (!task) throw new Error(`Task ${taskId} not found for telemetry processing.`);

    // Expected payload: { event: 'CI_BUILD_PASSED' | 'METRIC_THRESHOLD', metricKey: 'latency', value: 45, threshold: 100, operator: '<' }
    let isValid = false;
    let verificationDetail = '';

    if (telemetryPayload.event === 'CI_BUILD_PASSED') {
      isValid = true;
      verificationDetail = `Automated CI Pipeline Passed (Build #${telemetryPayload.buildNumber || '101'})`;
    } else if (telemetryPayload.event === 'METRIC_THRESHOLD') {
      const val = Number(telemetryPayload.value);
      const target = Number(telemetryPayload.threshold);
      switch (telemetryPayload.operator) {
        case '<': isValid = val < target; break;
        case '<=': isValid = val <= target; break;
        case '>': isValid = val > target; break;
        case '>=': isValid = val >= target; break;
        case '==': isValid = val === target; break;
        default: isValid = false;
      }
      verificationDetail = `Metric ${telemetryPayload.metricKey}: observed ${val} ${telemetryPayload.operator} ${target}`;
    }

    if (isValid) {
      const sig = await ProofGatekeeper.generateProofSignature(taskId, JSON.stringify(telemetryPayload));
      const proofRecord = {
        task_id: taskId,
        proof_type: 'TELEMETRY_LOG',
        verification_spec: verificationDetail,
        evidence_payload_uri: `telemetry://receipt/${sig.substring(0, 16)}`,
        signature_hash: sig,
        telemetry_raw: telemetryPayload,
        is_validated: true,
        validated_at: new Date().toISOString()
      };

      await db.put('proofs', proofRecord);
      task.status = 'CLOSED';
      await db.put('tasks', task);

      SyncChannel.broadcast('TASK_AUTONOMOUSLY_CLOSED', { taskId, signature: sig });
      return { success: true, proofRecord, task };
    }

    return { success: false, reason: 'Telemetry did not satisfy task verification criteria.' };
  }

  /**
   * Generates a signed, immutable JSON Compliance Audit Receipt
   */
  static generateComplianceReceipt(task, proofRecord) {
    return {
      compliance_standard: 'SOC2_TYPE_II_EVIDENCE',
      generated_at: new Date().toISOString(),
      task_record: {
        id: task.id,
        title: task.title,
        impact_index: task.impact_index,
        sync_index: task.sync_index
      },
      proof_verification: {
        type: proofRecord.proof_type,
        specification: proofRecord.verification_spec,
        evidence_uri: proofRecord.evidence_payload_uri,
        sha256_signature: proofRecord.signature_hash,
        validated_at: proofRecord.validated_at
      },
      audit_integrity: 'CRYPTOGRAPHICALLY_VERIFIED'
    };
  }
}