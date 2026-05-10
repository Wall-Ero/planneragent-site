// core/src/memory/intelligence.runtime.collector.ts
// ======================================================
// PlannerAgent — Runtime Intelligence Collector
// Canonical Source of Truth
// ======================================================

import {
  createIntelligenceParticipationTrace,
  type IntelligenceParticipationRecord,
  type IntelligenceParticipationRole,
  type IntelligenceProviderType,
  type IntelligencePolicyScope
} from "./intelligence.trace";

export type RuntimeIntelligenceCollector = {
  traces: IntelligenceParticipationRecord[];

  collect(input: {
    provider: IntelligenceProviderType;

    role: IntelligenceParticipationRole;

    authority_layer: string;

    operational_scope: string;

    company_id: string;

    context_id: string;

    tenant_id?: string;

    model?: string;

    policy_scope?: IntelligencePolicyScope;

    execution_scope?: string;

    execution_contribution?:
      | "NONE"
      | "INDIRECT"
      | "DIRECT"
      | "BLOCKED";

    metadata?: Record<string, unknown>;
  }): void;
};

export function createRuntimeIntelligenceCollector():
RuntimeIntelligenceCollector {

  const traces: IntelligenceParticipationRecord[] = [];

  return {

    traces,

    collect(input) {

      const trace =
        createIntelligenceParticipationTrace({

          tenant_id:
            input.tenant_id ?? "default",

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
            input.policy_scope ?? "READ_ONLY",

          execution_scope:
            input.execution_scope,

          execution_contribution:
            input.execution_contribution ?? "NONE",

          metadata:
            input.metadata ?? {}
        });

      traces.push(trace);
    }
  };
}