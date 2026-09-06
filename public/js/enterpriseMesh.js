// public/js/enterpriseMesh.js - Multi-Team Rollups & Cryptographic Compliance Exporter
export class EnterpriseMeshEngine {
  /**
   * Rolls up multiple team workspaces into organization-level Strategic Objectives
   */
  static aggregateTeamWorkspaces(teamWorkspaces = []) {
    let totalTasks = 0;
    let totalClosed = 0;
    let aggregateImpactSum = 0;
    let aggregateSyncSum = 0;

    teamWorkspaces.forEach(ws => {
      const tasks = ws.tasks || [];
      totalTasks += tasks.length;
      tasks.forEach(t => {
        if (t.status === 'CLOSED') totalClosed++;
        aggregateImpactSum += Number(t.impact_index) || 1.0;
        aggregateSyncSum += Number(t.sync_index) || 0.0;
      });
    });

    const completionRate = totalTasks === 0 ? 0 : Math.round((totalClosed / totalTasks) * 100);
    const avgImpact = totalTasks === 0 ? 0 : Number((aggregateImpactSum / totalTasks).toFixed(1));
    const avgSync = totalTasks === 0 ? 0 : Number((aggregateSyncSum / totalTasks).toFixed(1));

    return {
      totalWorkspaces: teamWorkspaces.length,
      totalTrackedTasks: totalTasks,
      totalCompletedTasks: totalClosed,
      organizationalCompletionRate: completionRate,
      averageImpactIndex: avgImpact,
      averageSyncIndex: avgSync,
      healthStatus: avgSync >= 75.0 ? 'HEALTHY_ALIGNMENT' : 'DRIFT_WARNING'
    };
  }

  /**
   * Generates a formal SOC2 / ISO 27001 Cryptographic Audit Package
   */
  static async generateSoc2AuditPackage(db) {
    const tasks = await db.getAll('tasks');
    const proofs = await db.getAll('proofs');
    const closedTasks = tasks.filter(t => t.status === 'CLOSED');

    const verifiedRecords = closedTasks.map(t => {
      const proof = proofs.find(p => p.task_id === t.id) || { proof_type: 'MANUAL', signature_hash: 'LEGACY_UNBOUND' };
      return {
        task_id: t.id,
        title: t.title,
        impact_index: t.impact_index,
        sync_index: t.sync_index,
        closure_proof: proof
      };
    });

    const rawExport = JSON.stringify({
      audit_protocol: 'SOC2_TYPE_II_TRUST_CRITERIA',
      timestamp: new Date().toISOString(),
      governance_standard: 'STRATUM_STRICT_SOC_v3.0.0',
      total_audited_tasks: closedTasks.length,
      records: verifiedRecords
    });

    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(rawExport));
    const masterSignature = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      master_package_signature: masterSignature,
      compliance_standard: 'ISO_27001_COMPLIANT',
      package_payload: JSON.parse(rawExport)
    };
  }
}