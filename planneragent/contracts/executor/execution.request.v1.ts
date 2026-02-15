// planneragent/contracts/executor/execution.request.v1.ts
// ======================================================
// Execution Request v1 — CANONICAL SOURCE OF TRUTH
// ======================================================

export type ExecutionIntent = "ADVISE" | "EXECUTE";

export type ExecutionScope = {
  domain: string;   // es: "supply_chain"
  action: string;   // es: "replan", "notify_supplier"
};

export type ExecutionApproval = {
  approver_id: string;
  approved_at: string; // ISO
};

export type ExecutionRequestV1 = {
  request_id: string;

  intent: ExecutionIntent;
  scope: ExecutionScope;

  actor_id: string;
  company_id: string;

  payload: Record<string, unknown>;

  // Mandatory for EXECUTE in JUNIOR
  approval?: ExecutionApproval;
};