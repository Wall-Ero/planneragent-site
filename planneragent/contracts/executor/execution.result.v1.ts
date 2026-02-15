// planneragent/contracts/executor/execution.result.v1.ts
// ======================================================
// Execution Result v1 — CANONICAL SOURCE OF TRUTH
// ======================================================

export type ExecutionMode = "ADVISE" | "EXECUTE";
export type ExecutionPhase = "PREVIEW" | "RUN" | "BLOCKED";

export type ExecutionResultV1 =
  | {
      ok: true;
      audit_ref: string;

      mode: ExecutionMode;
      execution: ExecutionPhase;

      governance: {
        allowed: boolean;
        reason?: string;
      };

      executed_at?: string;
      output?: Record<string, unknown>;
    }
  | {
      ok: false;
      reason: string;
    };