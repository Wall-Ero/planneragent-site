// core/src/decision/optimizer/milp/variables.v1.ts
// ======================================================
// PlannerAgent — MILP Variables v1
// Canonical Source of Truth
// ======================================================

export type MilpDecisionVariable = {
  sku: string;
  required: number;
  onHand: number;
  shortage: number;
  expediteQty: number;
  delayQty: number;
};

export function buildMilpVariables(input: {
  demand: Array<{ sku: string; required: number }>;
  inventory: Array<{ sku?: string; article?: string; onHand?: number; on_hand?: number; qty?: number }>;
}): MilpDecisionVariable[] {
  return input.demand.map((d) => {
    const inv = input.inventory.find(
      (i) => (i.sku ?? i.article) === d.sku
    );

    const onHand =
      inv?.onHand ??
      inv?.on_hand ??
      inv?.qty ??
      0;

    const shortage = Math.max(0, d.required - onHand);

    return {
      sku: d.sku,
      required: d.required,
      onHand,
      shortage,
      expediteQty: 0,
      delayQty: 0,
    };
  });
}
