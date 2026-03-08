// core/src/decision/optimizer/adapters/milp.stub.ts
// ======================================================
// PlannerAgent — Optimizer v1 MILP Adapter (Stub)
// Canonical Source of Truth
// ======================================================

import type { CandidatePlan, OptimizerInput } from "./contracts";

/**
 * v1 does NOT ship with a MILP solver.
 * This stub is the integration point for a future MILP/CP refinement step.
 * It must remain deterministic and budget-aware.
 */
export async function milpRefineStub(
  _input: OptimizerInput,
  bestSoFar: CandidatePlan
): Promise<CandidatePlan> {
  // No-op in v1
  return bestSoFar;
}
