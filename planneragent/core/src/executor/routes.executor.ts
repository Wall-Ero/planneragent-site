// PATH: core/src/executor/routes.executor.ts
// ======================================================
// PlannerAgent — Executor Routes
// Status: CANONICAL · SAFE ENDPOINTS
// ======================================================

import { previewExecution, runExecution } from "./executor.runtime";
import type { ExecutorRequest } from "../../../contracts/executor/executor.request";

export async function handleExecutorPreview(req: ExecutorRequest) {
  return previewExecution(req);
}

export async function handleExecutorRun(req: ExecutorRequest) {
  return runExecution(req);
}
