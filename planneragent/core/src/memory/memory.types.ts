// core/src/memory/memory.types.ts
// =================================
// PlannerAgent — Memory Types
// Canonical Snapshot · Source of Truth
// =================================

import type {
  MemoryRecordBase
} from "./contracts.memory";

export type DecisionOutcome =
  | "SUCCESS"
  | "PARTIAL"
  | "FAIL";

export type ExecutionMode =
  | "APPROVED"
  | "DELEGATED";

export interface ObservationMemoryRecord
  extends MemoryRecordBase {

  domain: "OBSERVATION";

  signal_history?: unknown[];

  pressure_history?: unknown[];

  topology_drift?: unknown;

  recurring_anomalies?: unknown[];

  reality_drift?: unknown;

  simulation_snapshots?: unknown[];
}

export interface AiGovernanceMemoryRecord
  extends MemoryRecordBase {

  domain: "AI_GOVERNANCE";

  ai_tool?: string;

  human_actor?: string;

  scope?: string;

  intent?: string;

  approved_datasets?: string[];

  export_boundaries?: string[];

  policy_violations?: unknown[];

  human_corrections?: unknown[];

  audit_chain?: unknown[];
}

export interface DecisionMemoryRecord
  extends MemoryRecordBase {

  domain: "DECISION";

  decision_type?: string;

  approval_required?: boolean;

  approved?: boolean;

  approved_by?: string;

  anomaly?: boolean;

  outcome?: DecisionOutcome;

  decision_quality?: "HIGH" | "MEDIUM" | "LOW";

  policy_context?: unknown;

  selected_actions?: string[];
}

export interface ExecutionMemoryRecord
  extends MemoryRecordBase {

  domain: "EXECUTION";

  execution_mode?: ExecutionMode;

  execution_type?: string;

  executed_actions: string[];

  execution_outcome: DecisionOutcome;

  anomaly: boolean;

  capability_ids?: string[];

  providers?: string[];

  recovery_pattern?: unknown;

  exception_handling?: unknown;
}

export interface ImprovementMemoryRecord
  extends MemoryRecordBase {

  domain: "IMPROVEMENT";

  improvement_type?: string;

  roi_delta?: number;

  automation_impact?: number;

  anomaly_reduction?: number;

  pressure_reduction?: number;

  resilience_gain?: number;

  budget_used?: number;

  process_evolution?: unknown;
}

export interface CharterMemoryRecord
  extends MemoryRecordBase {

  domain: "CHARTER";

  constitutional_event?: string;

  authority_violation?: boolean;

  unsafe_delegation_attempt?: boolean;

  scope_escalation?: boolean;

  policy_override_attempt?: boolean;

  autonomy_drift?: boolean;

  enforced_boundary?: string;
}

export type PlannerAgentMemoryRecord =
  | ObservationMemoryRecord
  | AiGovernanceMemoryRecord
  | DecisionMemoryRecord
  | ExecutionMemoryRecord
  | ImprovementMemoryRecord
  | CharterMemoryRecord;