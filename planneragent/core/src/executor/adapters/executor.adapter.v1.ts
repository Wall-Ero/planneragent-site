// core/src/executor/adapters/executor.adapter.v1.ts
// ======================================================
// Executor Adapter — Interface v1
// Canonical Source of Truth
// ======================================================

import type { ExecutionRequestV1 } from "../../../../contracts/executor/execution.request.v1";

export type AdapterExecuteResult = {
  performed: boolean;
  adapter_id: string;
  warnings: string[];
};

export interface ExecutorAdapterV1 {
  id: string;
  canHandle(actionType: string): boolean;
  execute(req: ExecutionRequestV1): Promise<AdapterExecuteResult>;
}