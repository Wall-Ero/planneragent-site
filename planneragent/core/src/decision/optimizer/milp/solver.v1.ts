// core/src/decision/optimizer/milp/solver.v1.ts
// ======================================================
// PlannerAgent — MILP Solver v1
// Canonical Source of Truth
//
// v1 is MILP-ready but uses a deterministic internal solver.
// It minimizes:
//   shortage penalty
// + expedite penalty
// + delay penalty
// + inventory penalty
//
// Future versions may swap this internal engine for
// GLPK / CBC / OR-Tools without changing contracts.
// ======================================================

import { buildMilpVariables, type MilpDecisionVariable } from "./variables.v1";
import { evaluateMilpConstraints } from "./constraints.v1";
import { buildMilpModelV1 } from "./model.v1";
import { defaultMilpWeights, scoreMilpObjective, type MilpWeights } from "./objective.v1";

export type MilpSolveAction =
  | {
      action: "EXPEDITE_SUPPLIER";
      sku: string;
      qty: number;
    }
  | {
      action: "DELAY_ORDER";
      sku: string;
      qty: number;
    };

export type MilpSolveResult = {
  feasible: boolean;
  objective: number;
  variables: MilpDecisionVariable[];
  actions: MilpSolveAction[];
  violations: string[];
};

export function solveMilpV1(input: {
  demand: Array<{ sku: string; required: number }>;
  inventory: Array<{ sku?: string; article?: string; onHand?: number; on_hand?: number; qty?: number }>;
  weights?: Partial<MilpWeights>;
}): MilpSolveResult {
  const weights: MilpWeights = {
    ...defaultMilpWeights(),
    ...(input.weights ?? {}),
  };

  const variables = buildMilpVariables({
    demand: input.demand,
    inventory: input.inventory,
  });

  const model = buildMilpModelV1({
    variables,
    weights,
  });

  // ----------------------------------------------------
  // Deterministic internal solve loop
  // Rule:
  // - if shortage exists, try expedite first
  // - if shortage is very large, split between expedite and delay
  // ----------------------------------------------------

  for (const v of model.variables) {
    if (v.shortage <= 0) continue;

    if (v.shortage <= 50) {
      v.expediteQty = v.shortage;
      continue;
    }

    // larger shortage: split deterministically
    const expediteShare = Math.round(v.shortage * 0.7);
    const delayShare = v.shortage - expediteShare;

    v.expediteQty = expediteShare;
    v.delayQty = delayShare;
  }

  const constraintCheck = evaluateMilpConstraints(model.variables);
  const objective = scoreMilpObjective(model.variables, model.weights);

  const actions: MilpSolveAction[] = [];

  for (const v of model.variables) {
    if (v.expediteQty > 0) {
      actions.push({
        action: "EXPEDITE_SUPPLIER",
        sku: v.sku,
        qty: v.expediteQty,
      });
    }

    if (v.delayQty > 0) {
      actions.push({
        action: "DELAY_ORDER",
        sku: v.sku,
        qty: v.delayQty,
      });
    }
  }

  return {
    feasible: constraintCheck.feasible,
    objective,
    variables: model.variables,
    actions,
    violations: constraintCheck.violations,
  };
}