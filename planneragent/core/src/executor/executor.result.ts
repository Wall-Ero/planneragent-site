// PATH: planneragent/contracts/executor/executor.result.ts
// ======================================================
// PlannerAgent — Executor Result Contract
// Status: CANONICAL · SOURCE OF TRUTH
//
// Responsibility:
// - Standard execution outcome
// - Used by Executor Light (P5)
// - Returned by preview/run
// ======================================================

export type ExecutorResult =
  | {
      ok: true;
      audit_ref: string;
      executed_at: string; // ISO-8601
    }
  | {
      ok: false;
      reason: string;
    };