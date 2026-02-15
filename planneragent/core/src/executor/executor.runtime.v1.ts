// core/src/executor/executor.runtime.v1.ts
// ==================================================
// Executor Runtime v1
// Canonical Source of Truth
// ==================================================

import type { ExecutionRequestV1 } from "../../../contracts/executor/execution.request.v1";

export type ExecutionResultV1 =
  | {
      ok: true;
      audit_ref: string;
      executed_at: string;
      output?: Record<string, unknown>;
    }
  | {
      ok: false;
      reason: string;
    };

export function runExecutionV1(
  req: ExecutionRequestV1,
  audit_ref: string
): ExecutionResultV1 {
  try {
    // REAL execution happens elsewhere (connectors / adapters)
    // Runtime only certifies execution boundary

    return {
      ok: true,
      audit_ref,
      executed_at: new Date().toISOString(),
      output: {
        domain: req.scope.domain,
        action: req.scope.action,
        intent: req.intent,
      },
    };
  } catch (err) {
    return {
      ok: false,
      reason: (err as Error).message,
    };
  }
}