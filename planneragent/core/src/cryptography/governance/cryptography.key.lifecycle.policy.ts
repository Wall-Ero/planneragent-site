// ============================================================
// PlannerAgent — Key Lifecycle Policy
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// cryptography.key.lifecycle.policy.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Key Management Governance
//
// P9C.4.2 — Key Lifecycle Policy
//
// PURPOSE
// ------------------------------------------------------------
// Define lifecycle governance requirements
// for cryptographic key operations.
//
// Define:
//
// - when key operations may occur
// - lifecycle transition requirements
// - approval requirements
// - evidence requirements
// - ledger requirements
// - residual risk ownership requirements
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// A key operation may be technically possible
// and still be governance-forbidden.
//
// Lifecycle legitimacy precedes
// cryptographic execution.
//
// Approval precedes operation.
//
// Evidence precedes auditability.
//
// Authority survives lifecycle transitions.
//
// DOES NOT:
//
// - create keys
// - rotate keys
// - revoke keys
// - disable keys
// - enable keys
// - access KMS
// - access HSM
// - store secrets
// - perform cryptographic operations
// - generate evidence
// - write ledger records
//
// DOES:
//
// - define lifecycle legitimacy
// - define lifecycle transitions
// - define lifecycle approval requirements
// - define lifecycle governance requirements
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define when a cryptographic key operation
// may legitimately occur.
//
// Nothing else.
//
// ============================================================

import type {
KeyGovernanceOperation,
ResidualRiskOwner,
} from "./cryptography.key.policy";

// ============================================================
// KEY LIFECYCLE STATUS
// ============================================================

export type KeyLifecycleStatus =
| "ACTIVE"
| "DISABLED"
| "REVOKED"
| "ROTATING"
| "PENDING_TRANSFER";

// ============================================================
// ROADMAP NOTE
// ============================================================
//
// PENDING_TRANSFER
//
// Reserved for:
//
// P9C.4.3 — Key Governance Runtime
//
// Future runtime may introduce
// governed ownership-transfer workflows
// requiring an intermediate lifecycle state.
//
// Not currently used by
// lifecycle policy.
//
// Not currently enforced.
//
// ============================================================

// ============================================================
// KEY LIFECYCLE TRIGGER
// ============================================================

export type KeyLifecycleTrigger =
| "INITIAL_CREATION"
| "SCHEDULED_ROTATION"
| "EMERGENCY_ROTATION"
| "COMPROMISE_RESPONSE"
| "OWNERSHIP_TRANSFER"
| "CUSTODY_TRANSFER"
| "DECOMMISSION";

// ============================================================
// KEY LIFECYCLE POLICY
// ============================================================

export interface KeyLifecyclePolicy {

operation:
KeyGovernanceOperation;

allowedStatuses:
KeyLifecycleStatus[];

allowedTriggers:
KeyLifecycleTrigger[];

humanApprovalRequired:
boolean;

independentApprovalRequired:
boolean;

governanceEvidenceRequired:
boolean;

ledgerRecordRequired:
boolean;

cryptographicAuditRequired:
boolean;

residualRiskOwner:
ResidualRiskOwner;

summary:
string[];

}

// ============================================================
// CANONICAL KEY LIFECYCLE POLICIES
// ============================================================

export const KEY_LIFECYCLE_POLICIES:
Record<
KeyGovernanceOperation,
KeyLifecyclePolicy

> = {

// ----------------------------------------------------------
// CREATE KEY
// ----------------------------------------------------------

CREATE_KEY: {

operation:
  "CREATE_KEY",

allowedStatuses: [],

allowedTriggers: [
  "INITIAL_CREATION",
],

humanApprovalRequired:
  true,

independentApprovalRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

cryptographicAuditRequired:
  true,

residualRiskOwner:
  "AUTHORITY_OWNER",

summary: [
  "initial_creation",
  "approval_required",
],

},

// ----------------------------------------------------------
// ROTATE KEY
// ----------------------------------------------------------

ROTATE_KEY: {

operation:
  "ROTATE_KEY",

allowedStatuses: [
  "ACTIVE",
],

allowedTriggers: [
  "SCHEDULED_ROTATION",
  "EMERGENCY_ROTATION",
  "COMPROMISE_RESPONSE",
],

humanApprovalRequired:
  true,

independentApprovalRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

cryptographicAuditRequired:
  true,

residualRiskOwner:
  "AUTHORITY_OWNER",

summary: [
  "rotation_governed",
  "lifecycle_controlled",
],

},

// ----------------------------------------------------------
// REVOKE KEY
// ----------------------------------------------------------

REVOKE_KEY: {

operation:
  "REVOKE_KEY",

allowedStatuses: [
  "ACTIVE",
  "DISABLED",
  "ROTATING",
],

allowedTriggers: [
  "COMPROMISE_RESPONSE",
  "DECOMMISSION",
],

humanApprovalRequired:
  true,

independentApprovalRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

cryptographicAuditRequired:
  true,

residualRiskOwner:
  "AUTHORITY_OWNER",

summary: [
  "revocation_governed",
  "irreversible_operation",
],

},

// ----------------------------------------------------------
// DISABLE KEY
// ----------------------------------------------------------

DISABLE_KEY: {

operation:
  "DISABLE_KEY",

allowedStatuses: [
  "ACTIVE",
  "ROTATING",
],

allowedTriggers: [
  "COMPROMISE_RESPONSE",
],

humanApprovalRequired:
  true,

independentApprovalRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

cryptographicAuditRequired:
  true,

residualRiskOwner:
  "AUTHORITY_OWNER",

summary: [
  "disablement_governed",
  "temporary_restriction",
],

},

// ----------------------------------------------------------
// ENABLE KEY
// ----------------------------------------------------------

ENABLE_KEY: {

operation:
  "ENABLE_KEY",

allowedStatuses: [
  "DISABLED",
],

allowedTriggers: [
  "COMPROMISE_RESPONSE",
],

humanApprovalRequired:
  true,

independentApprovalRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

cryptographicAuditRequired:
  true,

residualRiskOwner:
  "AUTHORITY_OWNER",

summary: [
  "reenablement_governed",
  "restricted_recovery",
],

},

// ----------------------------------------------------------
// ASSIGN CUSTODY
// ----------------------------------------------------------

ASSIGN_CUSTODY: {

operation:
  "ASSIGN_CUSTODY",

allowedStatuses: [
  "ACTIVE",
  "DISABLED",
],

allowedTriggers: [
  "CUSTODY_TRANSFER",
],

humanApprovalRequired:
  true,

independentApprovalRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

cryptographicAuditRequired:
  true,

residualRiskOwner:
  "AUTHORITY_OWNER",

summary: [
  "custody_transfer",
  "authority_preserved",
],

},

// ----------------------------------------------------------
// TRANSFER OWNERSHIP
// ----------------------------------------------------------

TRANSFER_OWNERSHIP: {

operation:
  "TRANSFER_OWNERSHIP",

allowedStatuses: [
  "ACTIVE",
],

allowedTriggers: [
  "OWNERSHIP_TRANSFER",
],

humanApprovalRequired:
  true,

independentApprovalRequired:
  true,

governanceEvidenceRequired:
  true,

ledgerRecordRequired:
  true,

cryptographicAuditRequired:
  true,

residualRiskOwner:
  "APPROVAL_AUTHORITY",

summary: [
  "ownership_transfer",
  "authority_transition",
],

},

};

// ============================================================
// POLICY RESOLUTION
// ============================================================

export function getKeyLifecyclePolicy(
operation: KeyGovernanceOperation
): KeyLifecyclePolicy {

return KEY_LIFECYCLE_POLICIES[
operation
];

}

// ============================================================
// PLANNERAGENT LIFECYCLE PRINCIPLES
// ============================================================
//
// Lifecycle legitimacy precedes execution.
//
// Approval precedes operation.
//
// Evidence precedes auditability.
//
// Authority survives lifecycle transitions.
//
// A technically possible operation
// may still be governance-forbidden.
//
// ============================================================