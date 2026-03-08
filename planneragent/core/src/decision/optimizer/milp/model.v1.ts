// core/src/decision/optimizer/milp/model.v1.ts
// ======================================================
// PlannerAgent — MILP Model v1
// Canonical Source of Truth
// ======================================================

import type { MilpDecisionVariable } from "./variables.v1";
import type { MilpWeights } from "./objective.v1";

export type MilpModelV1 = {
  variables: MilpDecisionVariable[];
  weights: MilpWeights;
};

export function buildMilpModelV1(params: {
  variables: MilpDecisionVariable[];
  weights: MilpWeights;
}): MilpModelV1 {
  return {
    variables: params.variables,
    weights: params.weights,
  };
}