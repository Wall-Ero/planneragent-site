// core/src/decision/optimizer/milp/constraints.v1.ts
// ======================================================
// PlannerAgent — MILP Constraints v1
// Canonical Source of Truth
// ======================================================

import type { MilpDecisionVariable } from "./variables.v1";

export type MilpConstraintResult = {
  feasible: boolean;
  violations: string[];
};

export function evaluateMilpConstraints(
  vars: MilpDecisionVariable[]
): MilpConstraintResult {
  const violations: string[] = [];

  for (const v of vars) {
    if (v.required < 0) {
      violations.push(`NEGATIVE_REQUIRED:${v.sku}`);
    }

    if (v.onHand < 0) {
      violations.push(`NEGATIVE_ONHAND:${v.sku}`);
    }

    if (v.expediteQty < 0) {
      violations.push(`NEGATIVE_EXPEDITE:${v.sku}`);
    }

    if (v.delayQty < 0) {
      violations.push(`NEGATIVE_DELAY:${v.sku}`);
    }

    const covered = v.onHand + v.expediteQty + v.delayQty;

    if (covered < 0) {
      violations.push(`NEGATIVE_COVERAGE:${v.sku}`);
    }
  }

  return {
    feasible: violations.length === 0,
    violations,
  };
}