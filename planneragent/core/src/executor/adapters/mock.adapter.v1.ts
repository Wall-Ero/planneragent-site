// core/src/executor/adapters/mock.adapter.v1.ts
// ======================================================
// Mock Executor Adapter — v1
// Canonical Source of Truth
//
// NOTE: Used for pre-SRL hardening. Replace with real adapters later.
// ======================================================

import type { ExecutorAdapterV1, AdapterExecuteResult } from "./executor.adapter.v1";
import type { ExecutionRequestV1 } from "../../../../contracts/executor/execution.request.v1";

export class MockExecutorAdapterV1 implements ExecutorAdapterV1 {
  id = "mock-v1";

  canHandle(_actionType: string): boolean {
    return true; // accepts everything for now (scope is enforced by guard)
  }

  async execute(_req: ExecutionRequestV1): Promise<AdapterExecuteResult> {
    // No real side effects: simulate success
    return {
      performed: true,
      adapter_id: this.id,
      warnings: ["MOCK_ADAPTER: no real side effects performed"]
    };
  }
}