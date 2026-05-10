// core/src/memory/intelligence.trace.runtime.ts
// =====================================================
// PlannerAgent — Runtime Intelligence Participation
// Canonical Source of Truth
// =====================================================

import {
  createIntelligenceParticipationTrace,
  type IntelligenceParticipationRecord,
  type IntelligenceParticipationRole,
  type IntelligenceProviderType,
  type IntelligencePolicyScope
} from "./intelligence.trace";

export interface RuntimeIntelligenceTraceInput {

  tenant_id: string;
  company_id: string;
  context_id: string;

  authority_layer: string;

  operational_scope: string;

  provider: IntelligenceProviderType;

  model?: string;

  role: IntelligenceParticipationRole;

  policy_scope: IntelligencePolicyScope;

  execution_scope?: string;

  execution_contribution?:
    | "NONE"
    | "INDIRECT"
    | "DIRECT"
    | "BLOCKED";

  metadata?: Record<string, unknown>;
}

export function createRuntimeIntelligenceTrace(
  input: RuntimeIntelligenceTraceInput
): IntelligenceParticipationRecord {

  return createIntelligenceParticipationTrace({

    tenant_id:
      input.tenant_id,

    company_id:
      input.company_id,

    context_id:
      input.context_id,

    authority_layer:
      input.authority_layer,

    operational_scope:
      input.operational_scope,

    provider:
      input.provider,

    model:
      input.model,

    role:
      input.role,

    policy_scope:
      input.policy_scope,

    execution_scope:
      input.execution_scope,

    execution_contribution:
      input.execution_contribution ?? "NONE",

    metadata: {
      runtime_managed: true,

      ...input.metadata
    }
  });
}