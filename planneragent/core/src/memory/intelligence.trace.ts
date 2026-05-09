// core/src/memory/intelligence.trace.ts
// =================================
// PlannerAgent — Intelligence Participation Trace
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
  | "AUTHORITY_RECONSTRUCTION"
  | "MEMORY_CLASSIFICATION"
  | "UNKNOWN";

export type IntelligencePolicyScope =
  | "READ_ONLY"
  | "ADVISORY"
  | "APPROVED_EXECUTION"
  | "DELEGATED_EXECUTION"
  | "GOVERNANCE_ONLY"
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

  policy_scope: IntelligencePolicyScope;

  execution_scope?: string;

  execution_contribution?:
    | "NONE"
    | "INDIRECT"
    | "DIRECT"
    | "BLOCKED";

  participated_at: string;

  metadata?: Record<string, unknown>;
}

export function buildIntelligenceTraceId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function createIntelligenceParticipationTrace(
  input: {
    tenant_id: string;
    company_id: string;
    context_id: string;

    authority_layer: string;

    operational_scope: string;

    provider: IntelligenceProviderType;

    model?: string;

    role: IntelligenceParticipationRole;

    governed?: boolean;

    policy_scope?: IntelligencePolicyScope;

    execution_scope?: string;

    execution_contribution?: "NONE" | "INDIRECT" | "DIRECT" | "BLOCKED";

    metadata?: Record<string, unknown>;
  }
): IntelligenceParticipationRecord {

  return {
    trace_id: buildIntelligenceTraceId(),

    tenant_id: input.tenant_id,
    company_id: input.company_id,
    context_id: input.context_id,

    authority_layer: input.authority_layer,

    operational_scope: input.operational_scope,

    provider: input.provider,

    model: input.model,

    role: input.role,

    governed: input.governed ?? true,

    policy_scope: input.policy_scope ?? "UNKNOWN",

    execution_scope: input.execution_scope,

    execution_contribution:
      input.execution_contribution ?? "NONE",

    participated_at:
      new Date().toISOString(),

    metadata:
      input.metadata ?? {}
  };
}