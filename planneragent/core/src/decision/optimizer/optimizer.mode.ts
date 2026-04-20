// ======================================================
// PlannerAgent — Optimizer Mode
// Canonical Source of Truth
// ======================================================

export type OptimizerMode =
  | "PLAN_REPAIR"
  | "REALITY_CORRECTION";

export function isPlanRepair(mode: OptimizerMode): boolean {
  return mode === "PLAN_REPAIR";
}

export function isRealityCorrection(mode: OptimizerMode): boolean {
  return mode === "REALITY_CORRECTION";
}