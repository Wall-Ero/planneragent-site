// core/src/governance/oag/organizational.authority.link.ts
// ======================================================
// Organizational Authority Link
// Canonical Source of Truth
// ======================================================

export type OrganizationalAuthorityLinkType =
  | "SPONSORSHIP"
  | "REPORTING_LINE"
  | "DELEGATION"
  | "BUDGET_AUTHORITY"
  | "AI_GOVERNANCE"
  | "EXECUTION_SCOPE"
  | "TEAM_VALIDATION";

export type OrganizationalAuthorityValidationState =
  | "DECLARED"
  | "PARTIALLY_VALIDATED"
  | "VALIDATED"
  | "REVOKED"
  | "CONFLICTED";

export interface OrganizationalAuthorityLink {

  link_id: string;

  tenant_id: string;

  company_id: string;

  from_actor_id: string;

  to_actor_id: string;

  link_type: OrganizationalAuthorityLinkType;

  authority_scope: string[];

  delegated_execution: boolean;

  delegated_budget: boolean;

  validation_state:
    OrganizationalAuthorityValidationState;

  reciprocal_confirmation: boolean;

  authority_confidence: number;

  validated_by?: string;

  created_at: string;

  updated_at: string;

  metadata?: Record<string, unknown>;
}

export function buildAuthorityLinkId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function createOrganizationalAuthorityLink(
  input: {

    tenant_id: string;

    company_id: string;

    from_actor_id: string;

    to_actor_id: string;

    link_type: OrganizationalAuthorityLinkType;

    authority_scope: string[];

    delegated_execution?: boolean;

    delegated_budget?: boolean;

    validation_state?:
      OrganizationalAuthorityValidationState;

    reciprocal_confirmation?: boolean;

    authority_confidence?: number;

    validated_by?: string;

    metadata?: Record<string, unknown>;
  }
): OrganizationalAuthorityLink {

  const now =
    new Date().toISOString();

  return {

    link_id:
      buildAuthorityLinkId(),

    tenant_id:
      input.tenant_id,

    company_id:
      input.company_id,

    from_actor_id:
      input.from_actor_id,

    to_actor_id:
      input.to_actor_id,

    link_type:
      input.link_type,

    authority_scope:
      input.authority_scope,

    delegated_execution:
      input.delegated_execution ?? false,

    delegated_budget:
      input.delegated_budget ?? false,

    validation_state:
      input.validation_state ?? "DECLARED",

    reciprocal_confirmation:
      input.reciprocal_confirmation ?? false,

    authority_confidence:
      input.authority_confidence ?? 0.2,

    validated_by:
      input.validated_by,

    created_at: now,

    updated_at: now,

    metadata:
      input.metadata ?? {}
  };
}
