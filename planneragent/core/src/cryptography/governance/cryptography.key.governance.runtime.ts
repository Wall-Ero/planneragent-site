// ============================================================
// PlannerAgent — Key Governance Runtime
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// cryptography.key.governance.runtime.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Key Management Governance
//
// P9C.4.3 — Key Governance Runtime
//
// PURPOSE
// ------------------------------------------------------------
// Evaluate cryptographic key operations
// against authority policy and lifecycle policy.
//
// Determine whether a requested key operation
// may legitimately proceed.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// A key operation may be technically possible,
// organizationally requested,
// and cryptographically feasible,
//
// yet still be governance-denied.
//
// Governance determines legitimacy.
//
// Runtime determines eligibility.
//
// Cryptography executes mechanics.
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
// - access Vault
// - manage key material
// - perform cryptographic operations
// - generate evidence
// - write ledger records
//
// DOES:
//
// - evaluate key operation requests
// - resolve authority policy
// - resolve lifecycle policy
// - validate authority
// - validate lifecycle state
// - validate approval requirements
// - determine governance legitimacy
// - fail closed
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Transform key operation requests into
// governance decisions.
//
// Nothing else.
//
// ============================================================

import {
getKeyAuthorityPolicy,
} from "./cryptography.key.policy";

import {
getKeyLifecyclePolicy,
} from "./cryptography.key.lifecycle.policy";

import type {
KeyGovernanceOperation,
KeyGovernanceRole,
} from "./cryptography.key.policy";

import type {
KeyLifecycleStatus,
} from "./cryptography.key.lifecycle.policy";

// ============================================================
// DECISION STATUS
// ============================================================

export type KeyGovernanceDecisionStatus =
| "ALLOWED"
| "DENIED"
| "APPROVAL_REQUIRED";

// ============================================================
// DENIAL REASON
// ============================================================

export type KeyGovernanceDenialReason =
| "AUTHORITY_INVALID"
| "LIFECYCLE_INVALID"
| "APPROVAL_MISSING"
| "POLICY_NOT_FOUND"
| "FAIL_CLOSED";

// ============================================================
// REQUEST
// ============================================================

export interface KeyGovernanceRequest {

operation:
KeyGovernanceOperation;

authorityRole:
KeyGovernanceRole;

lifecycleStatus:
KeyLifecycleStatus;

approvalProvided:
boolean;

}

// ============================================================
// DECISION
// ============================================================

export interface KeyGovernanceDecision {

status:
KeyGovernanceDecisionStatus;

operation:
KeyGovernanceOperation;

authorityValidated:
boolean;

lifecycleValidated:
boolean;

approvalValidated:
boolean;

governanceEvidenceRequired:
boolean;

ledgerRecordRequired:
boolean;

cryptographicAuditRequired:
boolean;

denialReason?:
KeyGovernanceDenialReason;

reason:
string;

summary:
string[];

}

// ============================================================
// RUNTIME NOTE
// ============================================================
//
// P9C.4.3 Runtime v1
//
// Current version evaluates
// single-role authority participation.
//
// requiredRoles are temporarily interpreted as:
//
// "roles eligible to request
// the operation"
//
// and not yet as:
//
// "all roles required to
// authorize the operation"
//
// Multi-party authority validation,
// approval chains,
// and authority aggregation
// are deferred to future versions.
//
// This runtime evaluates
// governance eligibility only.
//
// ============================================================

// ============================================================
// MAIN
// ============================================================

export function evaluateKeyGovernanceRequest(
request: KeyGovernanceRequest
): KeyGovernanceDecision {

try {

const authorityPolicy =
  getKeyAuthorityPolicy(
    request.operation
  );

const lifecyclePolicy =
  getKeyLifecyclePolicy(
    request.operation
  );

// --------------------------------------------------------
// FAIL CLOSED
// --------------------------------------------------------

if (
  !authorityPolicy ||
  !lifecyclePolicy
) {

  return {

    status:
      "DENIED",

    operation:
      request.operation,

    authorityValidated:
      false,

    lifecycleValidated:
      false,

    approvalValidated:
      false,

    governanceEvidenceRequired:
      true,

    ledgerRecordRequired:
      true,

    cryptographicAuditRequired:
      true,

    denialReason:
      "POLICY_NOT_FOUND",

    reason:
      "Required governance policy not found.",

    summary: [
      "fail_closed",
      "policy_not_found",
    ],

  };

}

// --------------------------------------------------------
// AUTHORITY VALIDATION
// --------------------------------------------------------

const authorityValidated =
  authorityPolicy.requiredRoles.includes(
    request.authorityRole
  );

if (
  !authorityValidated
) {

  return {

    status:
      "DENIED",

    operation:
      request.operation,

    authorityValidated:
      false,

    lifecycleValidated:
      false,

    approvalValidated:
      false,

    governanceEvidenceRequired:
      authorityPolicy
        .governanceEvidenceRequired,

    ledgerRecordRequired:
      authorityPolicy
        .ledgerRecordRequired,

    cryptographicAuditRequired:
      authorityPolicy
        .cryptographicAuditRequired,

    denialReason:
      "AUTHORITY_INVALID",

    reason:
      "Authority requirements not satisfied.",

    summary: [
      ...authorityPolicy.summary,
      "authority_invalid",
    ],

  };

}

// --------------------------------------------------------
// LIFECYCLE VALIDATION
// --------------------------------------------------------

const lifecycleValidated =
  lifecyclePolicy.allowedStatuses.length === 0
    ? true
    : lifecyclePolicy.allowedStatuses.includes(
        request.lifecycleStatus
      );

if (
  !lifecycleValidated
) {

  return {

    status:
      "DENIED",

    operation:
      request.operation,

    authorityValidated:
      true,

    lifecycleValidated:
      false,

    approvalValidated:
      false,

    governanceEvidenceRequired:
      lifecyclePolicy
        .governanceEvidenceRequired,

    ledgerRecordRequired:
      lifecyclePolicy
        .ledgerRecordRequired,

    cryptographicAuditRequired:
      lifecyclePolicy
        .cryptographicAuditRequired,

    denialReason:
      "LIFECYCLE_INVALID",

    reason:
      "Lifecycle state does not permit operation.",

    summary: [
      ...lifecyclePolicy.summary,
      "lifecycle_invalid",
    ],

  };

}

// --------------------------------------------------------
// APPROVAL VALIDATION
// --------------------------------------------------------

if (
  lifecyclePolicy.humanApprovalRequired &&
  !request.approvalProvided
) {

  return {

    status:
      "APPROVAL_REQUIRED",

    operation:
      request.operation,

    authorityValidated:
      true,

    lifecycleValidated:
      true,

    approvalValidated:
      false,

    governanceEvidenceRequired:
      lifecyclePolicy
        .governanceEvidenceRequired,

    ledgerRecordRequired:
      lifecyclePolicy
        .ledgerRecordRequired,

    cryptographicAuditRequired:
      lifecyclePolicy
        .cryptographicAuditRequired,

    reason:
      "Approval required before operation.",

    summary: [
      ...lifecyclePolicy.summary,
      "approval_required",
    ],

  };

}

// --------------------------------------------------------
// ALLOWED
// --------------------------------------------------------

return {

  status:
    "ALLOWED",

  operation:
    request.operation,

  authorityValidated:
    true,

  lifecycleValidated:
    true,

  approvalValidated:
    true,

  governanceEvidenceRequired:
    lifecyclePolicy
      .governanceEvidenceRequired,

  ledgerRecordRequired:
    lifecyclePolicy
      .ledgerRecordRequired,

  cryptographicAuditRequired:
    lifecyclePolicy
      .cryptographicAuditRequired,

  reason:
    "Operation permitted under governance policy.",

  summary: [
    ...authorityPolicy.summary,
    ...lifecyclePolicy.summary,
    "operation_allowed",
  ],

};

} catch {

return {

  status:
    "DENIED",

  operation:
    request.operation,

  authorityValidated:
    false,

  lifecycleValidated:
    false,

  approvalValidated:
    false,

  governanceEvidenceRequired:
    true,

  ledgerRecordRequired:
    true,

  cryptographicAuditRequired:
    true,

  denialReason:
    "FAIL_CLOSED",

  reason:
    "Runtime failed closed.",

  summary: [
    "fail_closed",
  ],

};

}

}

// ============================================================
// PLANNERAGENT GOVERNANCE PRINCIPLE
// ============================================================
//
// A key operation may be technically possible,
// organizationally requested,
// and cryptographically feasible,
//
// yet still be governance-denied.
//
// Governance determines legitimacy.
//
// Runtime determines eligibility.
//
// Cryptography executes mechanics.
//
// ============================================================