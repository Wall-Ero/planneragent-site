// PATH: core/src/executor/executor.result.ts
// ======================================================
// PlannerAgent — Executor Result
// Canonical Source of Truth
// ======================================================

export type ExecutorResult =
  | {
      ok: true;
      audit_ref: string;
      executed_at: string;

      // 🔥 AGGIUNTO
      details?: Record<string, unknown>;
    }
  | {
      ok: false;
      reason: string;
    };