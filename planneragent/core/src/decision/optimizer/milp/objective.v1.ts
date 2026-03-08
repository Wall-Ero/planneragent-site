// core/src/decision/optimizer/milp/objective.v1.ts
// ======================================================
// PlannerAgent — MILP Objective v1
// Canonical Source of Truth
// ======================================================

import type { MilpDecisionVariable } from "./variables.v1";

export type MilpWeights = {
  shortagePenalty: number;
  expeditePenalty: number;
  delayPenalty: number;
  inventoryPenalty: number;
};

export function defaultMilpWeights(): MilpWeights {
  return {
    shortagePenalty: 10,
    expeditePenalty: 3,
    delayPenalty: 2,
    inventoryPenalty: 0.5,
  };
}

export function scoreMilpObjective(
  vars: MilpDecisionVariable[],
  weights: MilpWeights = defaultMilpWeights()
): number {
  let score = 0;

  for (const v of vars) {
    const residualShortage = Math.max(
      0,
      v.required - (v.onHand + v.expediteQty + v.delayQty)
    );

    score += residualShortage * weights.shortagePenalty;
    score += v.expediteQty * weights.expeditePenalty;
    score += v.delayQty * weights.delayPenalty;
    score += Math.max(0, v.onHand - v.required) * weights.inventoryPenalty;
  }

  return score;
}
