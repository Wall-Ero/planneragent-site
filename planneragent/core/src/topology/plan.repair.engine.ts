// core/src/topology/plan.repair.engine.ts

export type PlanRepairAction = {
  type:
    | "INFER_BOM_FROM_MOVEMENTS"
    | "INFER_BOM_FROM_ORDERS"
    | "REBUILD_FLOW_FROM_HISTORY"
    | "SYNTHETIC_PLAN_BOOTSTRAP";
  confidence: number;
  source: string;
};

export function generatePlanRepairActions(params: {
  topologyConfidence: number;
  hasBom: boolean;
  hasMovements: boolean;
  hasOrders: boolean;
}) {
  const actions: PlanRepairAction[] = [];

  if (!params.hasBom && params.hasMovements) {
    actions.push({
      type: "INFER_BOM_FROM_MOVEMENTS",
      confidence: 0.7,
      source: "behavioral_reconstruction",
    });
  }

  if (!params.hasBom && params.hasOrders) {
    actions.push({
      type: "INFER_BOM_FROM_ORDERS",
      confidence: 0.5,
      source: "order_structure",
    });
  }

  if (params.hasMovements) {
    actions.push({
      type: "REBUILD_FLOW_FROM_HISTORY",
      confidence: 0.8,
      source: "movement_chain",
    });
  }

  if (!params.hasBom && !params.hasMovements && params.hasOrders) {
    actions.push({
      type: "SYNTHETIC_PLAN_BOOTSTRAP",
      confidence: 0.3,
      source: "fallback",
    });
  }

  return actions.sort((a, b) => b.confidence - a.confidence);
}