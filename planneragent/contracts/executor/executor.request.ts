// PATH: contracts/executor/executor.request.ts
// ======================================================
// PlannerAgent — Executor Light Contract
// Status: CANONICAL · SOURCE OF TRUTH
// ======================================================

export type ExecutorScope = {
  domain: string;
  action: string;
};

export type ExecutorRequest = {
  scope: ExecutorScope;
  payload: unknown;

  // HUMAN AUTHORITY
  approver_id: string; // mandatory
  approved_at: string; // ISO timestamp
};