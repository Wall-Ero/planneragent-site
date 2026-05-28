// core/src/security/encryption.domains.ts
// ============================================================
// PlannerAgent — Encryption Domains
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Define semantic protection domains for operational,
// cognitive, governance and authority data.
//
// Encryption is not only technical.
// In PlannerAgent, encryption protects operational sovereignty.
//
// ============================================================

export type DataClassification =
  | "PUBLIC"
  | "INTERNAL"
  | "SENSITIVE"
  | "CRITICAL"
  | "CONSTITUTIONAL";

export type SovereigntyClass =
  | "TENANT_LOCAL"
  | "REGION_LOCKED"
  | "BOARD_GOVERNED"
  | "NON_EXPORTABLE";

export type EncryptionDomain =
  | "NARRATIVE"
  | "ATTENTION"
  | "DECISION_MEMORY"
  | "EXECUTION_MEMORY"
  | "COGNITION_SYNTHESIS"
  | "GOVERNANCE"
  | "OAG"
  | "CHARTER"
  | "LLM_LEDGER"
  | "SNAPSHOT"
  | "AUDIT_LEDGER";

export interface EncryptionDomainPolicy {

  domain: EncryptionDomain;

  classification: DataClassification;

  sovereignty: SovereigntyClass;

  encrypt_at_rest: boolean;

  encrypt_in_transit: boolean;

  tenant_isolated: boolean;

  cross_tenant_forbidden: boolean;

  llm_access_allowed: boolean;

  cache_allowed: boolean;

  export_allowed: boolean;

  immutable_required: boolean;

  key_rotation_required: boolean;

  human_recovery_approval_required: boolean;

  summary: string[];
}

export const ENCRYPTION_DOMAIN_POLICIES:
Record<EncryptionDomain, EncryptionDomainPolicy> = {

  NARRATIVE: {
    domain: "NARRATIVE",
    classification: "INTERNAL",
    sovereignty: "TENANT_LOCAL",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: true,
    cache_allowed: true,
    export_allowed: true,
    immutable_required: false,
    key_rotation_required: false,
    human_recovery_approval_required: false,
    summary: ["deterministic_runtime_language"],
  },

  ATTENTION: {
    domain: "ATTENTION",
    classification: "SENSITIVE",
    sovereignty: "TENANT_LOCAL",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: false,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["human_directed_focus"],
  },

  DECISION_MEMORY: {
    domain: "DECISION_MEMORY",
    classification: "CRITICAL",
    sovereignty: "TENANT_LOCAL",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["decision_outcome_memory"],
  },

  EXECUTION_MEMORY: {
    domain: "EXECUTION_MEMORY",
    classification: "CRITICAL",
    sovereignty: "TENANT_LOCAL",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["execution_evidence"],
  },

  COGNITION_SYNTHESIS: {
    domain: "COGNITION_SYNTHESIS",
    classification: "CRITICAL",
    sovereignty: "BOARD_GOVERNED",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["governed_operational_experience"],
  },

  GOVERNANCE: {
    domain: "GOVERNANCE",
    classification: "CONSTITUTIONAL",
    sovereignty: "BOARD_GOVERNED",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["authority_and_policy_records"],
  },

  OAG: {
    domain: "OAG",
    classification: "CONSTITUTIONAL",
    sovereignty: "NON_EXPORTABLE",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["organizational_authority_graph"],
  },

  CHARTER: {
    domain: "CHARTER",
    classification: "CONSTITUTIONAL",
    sovereignty: "NON_EXPORTABLE",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["constitutional_boundary"],
  },

  LLM_LEDGER: {
    domain: "LLM_LEDGER",
    classification: "CRITICAL",
    sovereignty: "TENANT_LOCAL",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["ai_participation_trace"],
  },

  SNAPSHOT: {
    domain: "SNAPSHOT",
    classification: "CRITICAL",
    sovereignty: "TENANT_LOCAL",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["signed_runtime_state"],
  },

  AUDIT_LEDGER: {
    domain: "AUDIT_LEDGER",
    classification: "CONSTITUTIONAL",
    sovereignty: "BOARD_GOVERNED",
    encrypt_at_rest: true,
    encrypt_in_transit: true,
    tenant_isolated: true,
    cross_tenant_forbidden: true,
    llm_access_allowed: false,
    cache_allowed: false,
    export_allowed: false,
    immutable_required: true,
    key_rotation_required: true,
    human_recovery_approval_required: true,
    summary: ["immutable_audit_history"],
  },
};

export function getEncryptionDomainPolicy(
  domain: EncryptionDomain
): EncryptionDomainPolicy {

  return ENCRYPTION_DOMAIN_POLICIES[domain];

}

export function assertDomainAllowsLlmAccess(
  domain: EncryptionDomain
): boolean {

  return getEncryptionDomainPolicy(domain)
    .llm_access_allowed === true;

}

export function assertDomainIsTenantIsolated(
  domain: EncryptionDomain
): boolean {

  return getEncryptionDomainPolicy(domain)
    .tenant_isolated === true;

}