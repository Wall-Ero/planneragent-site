// core/src/decision/optimizer/index.ts
// ======================================================
// PlannerAgent Optimizer v1
// Canonical Barrel Export
// Source of Truth
// ======================================================

export { runOptimizerV1 } from "./optimizer";

export type {
  OptimizerInput,
  OptimizerResult,
  CandidatePlan,
  Action
} from "./contracts";