// core/src/memory/intelligence.trace.ts
// =================================
// PlannerAgent — Intelligence Trace
// Canonical Snapshot · Source of Truth
// =================================

export type IntelligenceProviderType =
  | "OPENAI"
  | "OPENROUTER"
  | "OSS"
  | "INTERNAL_DL"
  | "RULE_ENGINE"
  | "HUMAN"
  | "UNKNOWN";

export type IntelligenceParticipationRole =
  | "OBSERVATION"
  | "CLASSIFICATION"
  | "SIMULATION"
  | "RISK_SCORING"
  | "DECISION_SUPPORT"
  | "EXECUTION_SUPPORT"
  | "SUPPLIER_COMMUNICATION"
  | "OPTIMIZATION"
  | "GOVERNANCE"
  | "ANOMALY_DETECTION"
  | "UNKNOWN";

export interface IntelligenceParticipationRecord {
  trace_id: string;

  tenant_id: string;
  company_id: string;
  context_id: string;

  authority_layer: string;

  operational_scope: string;

  provider: IntelligenceProviderType;

  model?: string;

  role: IntelligenceParticipationRole;

  governed: boolean;

  policy_scope?: string;

  execution_scope?: string;

  participated_at: string;

  metadata?: Record<string, unknown>;
}

export function buildIntelligenceTraceId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}