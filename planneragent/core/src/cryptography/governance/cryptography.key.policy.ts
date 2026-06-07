// ============================================================
// PlannerAgent — Key Management Governance Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/cryptography.key.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Key Management Governance
//
// P9C.4.1 — Key Authority Model
//
// PURPOSE
// ------------------------------------------------------------
// Define the canonical key authority model
// for cryptographic governance.
//
// This file defines:
//
// - key governance roles
// - key governance operations
// - separation-of-duty rules
// - residual risk ownership model
// - constitutional key authority principles
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Possession of a key does not create authority.
//
// Ownership of a key does not create authority.
//
// Custody of a key does not create authority.
//
// Cryptographic access does not create
// organizational authority.
//
// Compromise of cryptographic infrastructure
// must not automatically imply compromise
// of organizational authority.
//
// DOES NOT:
//
// - create keys
// - rotate keys
// - revoke keys
// - disable keys
// - enable keys
// - access KMS
// - store secrets
// - perform cryptographic operations
// - generate evidence
// - write ledger records
//
// DOES:
//
// - define key roles
// - define ownership rules
// - define custody rules
// - define approval rules
// - define separation-of-duty rules
// - define residual risk ownership options
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define who may hold, own, custody,
// approve, and govern cryptographic keys.
//
// Nothing else.
//
// ============================================================
// ============================================================
// KEY GOVERNANCE ROLES
// ============================================================

export type KeyGovernanceRole =
  | "KEY_CREATOR"
  | "KEY_OWNER"
  | "KEY_CUSTODIAN"
  | "AUTHORITY_OWNER"
  | "APPROVAL_AUTHORITY";


// ============================================================
// KEY GOVERNANCE OPERATIONS
// ============================================================

export type KeyGovernanceOperation =
  | "CREATE_KEY"
  | "ROTATE_KEY"
  | "REVOKE_KEY"
  | "DISABLE_KEY"
  | "ENABLE_KEY"
  | "ASSIGN_CUSTODY"
  | "TRANSFER_OWNERSHIP";


// ============================================================
// RESIDUAL RISK OWNER
// ============================================================

export type ResidualRiskOwner =
  | "AUTHORITY_OWNER"
  | "APPROVAL_AUTHORITY"
  | "UNASSIGNED";



// ============================================================
// KEY AUTHORITY POLICY
// ============================================================

export interface KeyAuthorityPolicy {

  operation:
    KeyGovernanceOperation;

  requiredRoles:
    KeyGovernanceRole[];

  allowedApprovers:
    KeyGovernanceRole[];

// Independent approval requires an approver
// that is organizationally independent from
// the actor performing the operation.
// Role eligibility alone does not satisfy
// independence requirements.

  independentApprovalRequired:
    boolean;

  residualRiskOwner:
    ResidualRiskOwner;

  governanceEvidenceRequired:
    boolean;

  ledgerRecordRequired:
    boolean;

  cryptographicAuditRequired:
    boolean;

  summary:
    string[];

}


// ============================================================
// CANONICAL KEY AUTHORITY POLICIES
// ============================================================

export const KEY_AUTHORITY_POLICIES:
  Record<
    KeyGovernanceOperation,
    KeyAuthorityPolicy
  > = {

  // ----------------------------------------------------------
  // CREATE KEY
  // ----------------------------------------------------------

  CREATE_KEY: {

    operation:
      "CREATE_KEY",

    requiredRoles: [
      "KEY_CREATOR",
      "KEY_OWNER",
      "AUTHORITY_OWNER",
    ],

    allowedApprovers: [
      "APPROVAL_AUTHORITY",
      "AUTHORITY_OWNER",
    ],

    independentApprovalRequired:
      true,

    residualRiskOwner:
      "AUTHORITY_OWNER",

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "key_creation_governed",
      "creator_does_not_own_authority",
      "approval_required",
    ],

  },

  // ----------------------------------------------------------
  // ROTATE KEY
  // ----------------------------------------------------------

  ROTATE_KEY: {

    operation:
      "ROTATE_KEY",

    requiredRoles: [
      "KEY_OWNER",
      "KEY_CUSTODIAN",
      "AUTHORITY_OWNER",
    ],

    allowedApprovers: [
      "APPROVAL_AUTHORITY",
      "AUTHORITY_OWNER",
    ],

    independentApprovalRequired:
      true,

    residualRiskOwner:
      "AUTHORITY_OWNER",

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "key_rotation_governed",
      "rotation_requires_authority",
      "approval_required",
    ],

  },

  // ----------------------------------------------------------
  // REVOKE KEY
  // ----------------------------------------------------------

  REVOKE_KEY: {

    operation:
      "REVOKE_KEY",

    requiredRoles: [
      "KEY_OWNER",
      "KEY_CUSTODIAN",
      "AUTHORITY_OWNER",
    ],

    allowedApprovers: [
      "APPROVAL_AUTHORITY",
      "AUTHORITY_OWNER",
    ],

    independentApprovalRequired:
      true,

    residualRiskOwner:
      "AUTHORITY_OWNER",

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "key_revocation_governed",
      "revocation_requires_authority",
      "approval_required",
    ],

  },

  // ----------------------------------------------------------
  // DISABLE KEY
  // ----------------------------------------------------------

  DISABLE_KEY: {

    operation:
      "DISABLE_KEY",

    requiredRoles: [
      "KEY_CUSTODIAN",
      "AUTHORITY_OWNER",
    ],

    allowedApprovers: [
      "APPROVAL_AUTHORITY",
      "AUTHORITY_OWNER",
    ],

    independentApprovalRequired:
      true,

    residualRiskOwner:
      "AUTHORITY_OWNER",

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "key_disablement_governed",
      "emergency_disable_requires_authority",
      "approval_required",
    ],

  },

  // ----------------------------------------------------------
  // ENABLE KEY
  // ----------------------------------------------------------

  ENABLE_KEY: {

    operation:
      "ENABLE_KEY",

    requiredRoles: [
      "KEY_OWNER",
      "KEY_CUSTODIAN",
      "AUTHORITY_OWNER",
    ],

    allowedApprovers: [
      "APPROVAL_AUTHORITY",
      "AUTHORITY_OWNER",
    ],

    independentApprovalRequired:
      true,

    residualRiskOwner:
      "AUTHORITY_OWNER",

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "key_enablement_governed",
      "reenablement_requires_authority",
      "approval_required",
    ],

  },

  // ----------------------------------------------------------
  // ASSIGN CUSTODY
  // ----------------------------------------------------------

  ASSIGN_CUSTODY: {

    operation:
      "ASSIGN_CUSTODY",

    requiredRoles: [
      "KEY_OWNER",
      "AUTHORITY_OWNER",
    ],

    allowedApprovers: [
      "APPROVAL_AUTHORITY",
      "AUTHORITY_OWNER",
    ],

    independentApprovalRequired:
      true,

    residualRiskOwner:
      "AUTHORITY_OWNER",

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "key_custody_assignment_governed",
      "custody_does_not_create_authority",
      "approval_required",
    ],

  },

  // ----------------------------------------------------------
  // TRANSFER OWNERSHIP
  // ----------------------------------------------------------

  TRANSFER_OWNERSHIP: {

    operation:
      "TRANSFER_OWNERSHIP",

    requiredRoles: [
      "KEY_OWNER",
      "AUTHORITY_OWNER",
    ],

    allowedApprovers: [
      "APPROVAL_AUTHORITY",
      "AUTHORITY_OWNER",
    ],

    independentApprovalRequired:
      true,

    residualRiskOwner:
      "AUTHORITY_OWNER",

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    summary: [
      "key_ownership_transfer_governed",
      "ownership_transfer_requires_authority",
      "approval_required",
    ],

  },

};


// ============================================================
// POLICY RESOLUTION
// ============================================================

export function getKeyAuthorityPolicy(
  operation: KeyGovernanceOperation
): KeyAuthorityPolicy {

  return KEY_AUTHORITY_POLICIES[
    operation
  ];

}


// ============================================================
// CONSTITUTIONAL SEPARATION RULES
// ============================================================

export type KeyAuthoritySeparationRule =
  | "KEY_CREATOR_NOT_KEY_OWNER"
  | "KEY_OWNER_NOT_KEY_CUSTODIAN"
  | "KEY_CUSTODIAN_NOT_APPROVAL_AUTHORITY"
  | "APPROVAL_AUTHORITY_INDEPENDENT_FROM_KEY_CUSTODY"
  | "NO_SINGLE_CRYPTOGRAPHIC_ACTOR_OWNS_FULL_AUTHORITY_CHAIN";

export const KEY_AUTHORITY_SEPARATION_RULES:
  KeyAuthoritySeparationRule[] = [

  "KEY_CREATOR_NOT_KEY_OWNER",

  "KEY_OWNER_NOT_KEY_CUSTODIAN",

  "KEY_CUSTODIAN_NOT_APPROVAL_AUTHORITY",

  "APPROVAL_AUTHORITY_INDEPENDENT_FROM_KEY_CUSTODY",

  "NO_SINGLE_CRYPTOGRAPHIC_ACTOR_OWNS_FULL_AUTHORITY_CHAIN",

];


// ============================================================
// ROADMAP NOTE
// ============================================================
//
// P9C.4.2 — Key Lifecycle Policy
//
// Re-evaluate residual risk ownership for:
//
// - TRANSFER_OWNERSHIP
//
// During ownership transfer,
// ownership itself is in transition.
//
// Approval Authority may become the temporary
// residual risk owner for this operation.
//
// ============================================================


// ============================================================
// PLANNERAGENT KEY GOVERNANCE PRINCIPLES
// ============================================================
//
// Key possession does not create authority.
//
// Key ownership does not create authority.
//
// Key custody does not create authority.
//
// Cryptographic access does not create
// organizational authority.
//
// Approval authority must remain independent
// from key custody.
//
// No single cryptographic actor may
// independently create,
// control,
// approve,
// and exercise cryptographic authority.
//
// Compromise of cryptographic infrastructure
// must not automatically imply compromise
// of organizational authority.
//
// ============================================================


// ============================================================
// DISCIPLINARY OBSERVATION
// ============================================================
//
// Authority ownership and cryptographic ownership
// are modeled as separate concerns.
//
// This distinction is canonical.
//
// No additional runtime,
// ledger,
// service,
// or software domain
// is introduced by this model.
//
// ============================================================