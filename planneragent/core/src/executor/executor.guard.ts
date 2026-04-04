// PATH: core/src/executor/executor.guard.ts

import type { ExecutionIntent } from "../execution/execution.contracts.v1";

export function assertExecutorAuthority(intent: ExecutionIntent): void {
  if (!intent.capability_id) {
    throw new Error("MISSING_CAPABILITY_ID");
  }
}

export function assertExecutorScope(intent: ExecutionIntent): void {
  if (!intent.payload) {
    throw new Error("MISSING_PAYLOAD");
  }
}