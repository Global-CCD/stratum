// public/js/validator.js - Layer Boundary Enforcement
export class StrictSocValidator {
  /**
   * Enforce Strict SoC: Prevents layer-skipping insertions.
   */
  static async validateParentLink(db, childLayer, childEntity) {
    switch (childLayer) {
      case 'horizons':
        if (!childEntity.vision_id) throw new Error('Horizon (L2) must link to Vision (L2).');
        const vision = await db.get('visions', childEntity.vision_id);
        if (!vision) throw new Error('Referenced Vision (L2) does not exist.');
        break;

      case 'objectives':
        if (!childEntity.horizon_id) throw new Error('Objective (L3) must link to Horizon (L2).');
        const horizon = await db.get('horizons', childEntity.horizon_id);
        if (!horizon) throw new Error('Referenced Horizon (L2) does not exist.');
        break;

      case 'projects':
        if (!childEntity.objective_id) throw new Error('Project (L3) must link to Objective (L3).');
        const obj = await db.get('objectives', childEntity.objective_id);
        if (!obj) throw new Error('Referenced Objective (L3) does not exist.');
        break;

      case 'tasks':
        if (!childEntity.project_id) throw new Error('Task (L4) must link to Project (L3). Zero layer-jumping permitted.');
        if (childEntity.objective_id || childEntity.horizon_id) {
          throw new Error('Strict SoC Violation: Task cannot directly reference Objective or Horizon.');
        }
        const proj = await db.get('projects', childEntity.project_id);
        if (!proj) throw new Error('Referenced Project (L3) does not exist.');
        break;
    }
    return true;
  }
}