// core/src/identity/organizational.authority.drift.ts
// =====================================================
// PlannerAgent — Organizational Authority Drift
// Canonical Source of Truth
// =====================================================

import type {
  OrganizationalAuthorityLink
} from "../governance/oag/organizational.authority.link";

export type AuthorityDriftType =
  | "EXECUTION_SCOPE_MISMATCH"
  | "BUDGET_SCOPE_MISMATCH"
  | "TEAM_ALIGNMENT_MISMATCH"
  | "ERP_SCOPE_MISMATCH"
  | "API_SCOPE_MISMATCH"
  | "SUPERVISOR_MISMATCH"
  | "UNKNOWN";

export interface OrganizationalAuthorityDrift {

  drift_id: string;

  tenant_id: string;
  company_id: string;

  actor_id: string;

  drift_type: AuthorityDriftType;

  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  detected: boolean;

  explanation: string;

  affected_scope?: string[];

  authority_confidence_delta: number;

  created_at: string;

  metadata?: Record<string, unknown>;
}

export interface DriftEvaluationInput {

  link: OrganizationalAuthorityLink;

  runtime: {

    execution_scope?: string[];

    budget_scope?: boolean;

    supervisor_confirmed?: boolean;

    api_scope_match?: boolean;

    erp_scope_match?: boolean;

    team_alignment?: boolean;
  };
}

function buildDriftId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function evaluateAuthorityDrift(
  input: DriftEvaluationInput
): OrganizationalAuthorityDrift[] {

  const drifts: OrganizationalAuthorityDrift[] = [];

  const runtime = input.runtime;

  // ---------------------------------------------------
  // EXECUTION SCOPE
  // ---------------------------------------------------

  if (
    input.link.delegated_execution &&
    runtime.execution_scope &&
    runtime.execution_scope.length > 0
  ) {

    const mismatch =
      runtime.execution_scope.some(
        s => !input.link.authority_scope.includes(s)
      );

    if (mismatch) {

      drifts.push({
        drift_id: buildDriftId(),

        tenant_id: input.link.tenant_id,
        company_id: input.link.company_id,

        actor_id: input.link.to_actor_id,

        drift_type: "EXECUTION_SCOPE_MISMATCH",

        severity: "HIGH",

        detected: true,

        explanation:
          "Runtime execution scope exceeds delegated authority scope.",

        affected_scope: runtime.execution_scope,

        authority_confidence_delta: -0.25,

        created_at: new Date().toISOString(),

        metadata: {}
      });
    }
  }

  // ---------------------------------------------------
  // BUDGET
  // ---------------------------------------------------

  if (
    runtime.budget_scope === true &&
    !input.link.delegated_budget
  ) {

    drifts.push({
      drift_id: buildDriftId(),

      tenant_id: input.link.tenant_id,
      company_id: input.link.company_id,

      actor_id: input.link.to_actor_id,

      drift_type: "BUDGET_SCOPE_MISMATCH",

      severity: "CRITICAL",

      detected: true,

      explanation:
        "Runtime budget authority exceeds delegated budget scope.",

      authority_confidence_delta: -0.35,

      created_at: new Date().toISOString(),

      metadata: {}
    });
  }

  // ---------------------------------------------------
  // SUPERVISOR
  // ---------------------------------------------------

  if (runtime.supervisor_confirmed === false) {

    drifts.push({
      drift_id: buildDriftId(),

      tenant_id: input.link.tenant_id,
      company_id: input.link.company_id,

      actor_id: input.link.to_actor_id,

      drift_type: "SUPERVISOR_MISMATCH",

      severity: "MEDIUM",

      detected: true,

      explanation:
        "Declared supervisor relationship is not operationally confirmed.",

      authority_confidence_delta: -0.15,

      created_at: new Date().toISOString(),

      metadata: {}
    });
  }

  // ---------------------------------------------------
  // ERP SCOPE
  // ---------------------------------------------------

  if (runtime.erp_scope_match === false) {

    drifts.push({
      drift_id: buildDriftId(),

      tenant_id: input.link.tenant_id,
      company_id: input.link.company_id,

      actor_id: input.link.to_actor_id,

      drift_type: "ERP_SCOPE_MISMATCH",

      severity: "HIGH",

      detected: true,

      explanation:
        "ERP access scope does not match authority scope.",

      authority_confidence_delta: -0.2,

      created_at: new Date().toISOString(),

      metadata: {}
    });
  }

  return drifts;
}