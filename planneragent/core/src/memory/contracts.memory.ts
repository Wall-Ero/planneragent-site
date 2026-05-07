// core/src/memory/contracts.memory.ts
// =================================
// PlannerAgent — Memory Contracts
// Canonical Snapshot · Source of Truth
// =================================

export type MemoryDomain =
  | "OBSERVATION"
  | "AI_GOVERNANCE"
  | "DECISION"
  | "EXECUTION"
  | "IMPROVEMENT"
  | "CHARTER";

export type MemorySubtype =
  // OBSERVATION
  | "SIGNAL_OBSERVATION"
  | "PRESSURE_EVOLUTION"
  | "TOPOLOGY_DRIFT"
  | "SIMULATION_SNAPSHOT"

  // AI GOVERNANCE
  | "AI_TOOL_USAGE"
  | "AI_POLICY_VIOLATION"
  | "AI_AUDIT_EVENT"

  // DECISION
  | "APPROVED_DECISION"
  | "REJECTED_DECISION"
  | "ANOMALY_DECISION"

  // EXECUTION
  | "DELEGATED_EXECUTION"
  | "APPROVED_EXECUTION"
  | "RECOVERY_EXECUTION"
  | "EXCEPTION_HANDLING"

  // IMPROVEMENT
  | "SYSTEMIC_IMPROVEMENT"
  | "ROI_IMPROVEMENT"

  // CHARTER
  | "AUTHORITY_VIOLATION"
  | "UNSAFE_DELEGATION"
  | "AUTONOMY_DRIFT";

export interface MemoryRecordBase {
  memory_id: string;

  tenant_id: string;
  company_id: string;
  context_id: string;

  domain: MemoryDomain;
  subtype: MemorySubtype;

  created_at: string;
  created_by?: string;

  authority_plan: string;
  authority_intent?: string;

  authority_mode?: string;

  baseline_snapshot_id?: string;

  append_only: true;
}

export interface MemoryWriteRequest {
  tenant_id: string;
  company_id: string;
  context_id: string;

  plan: string;
  intent?: string;

  domain: MemoryDomain;
  subtype: MemorySubtype;

  payload: unknown;
}

export interface MemoryLookupRequest {
  tenant_id: string;
  company_id: string;
  context_id: string;

  domain: MemoryDomain;

  subtypes?: MemorySubtype[];

  limit?: number;
}

export interface MemoryLookupResult<T = unknown> {
  ok: boolean;

  domain: MemoryDomain;

  records: T[];

  total: number;
}

export interface MemoryWritePolicy {
  allowed: boolean;

  reason?: string;

  write_domain?: MemoryDomain;

  allowed_subtypes?: MemorySubtype[];
}

export interface MemoryReadPolicy {
  allowed: boolean;

  readable_domains: MemoryDomain[];

  readable_subtypes?: MemorySubtype[];

  reason?: string;
}

export interface MemoryAccessPolicy {
  write: MemoryWritePolicy;

  read: MemoryReadPolicy;
}