// core/src/security/recovery.policy.ts
// ============================================================
// PlannerAgent — Recovery Governance Policy
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Govern recovery operations involving:
//
// - cognition
// - governance
// - execution memory
// - authority state
// - immutable audit history
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Recovery must never silently restore authority.
//
// DOES NOT:
// - restore databases
// - decrypt payloads
// - rotate keys
//
// DOES:
// - classify recovery severity
// - determine human approval requirements
// - determine sovereignty restrictions
// - determine constitutional recovery boundaries
//
// ============================================================

import type {
  EncryptionDomain,
} from "./encryption.domains";

import {
  getEncryptionDomainPolicy,
} from "./encryption.domains";

// ============================================================
// RECOVERY OPERATION
// ============================================================

export type RecoveryOperation =
  | "RESTORE"
  | "REHYDRATE"
  | "REBUILD"
  | "EXPORT_BACKUP"
  | "IMPORT_BACKUP"
  | "ROLLBACK"
  | "KEY_ROTATION";

// ============================================================
// RECOVERY SEVERITY
// ============================================================

export type RecoverySeverity =
  | "LOW"
  | "HIGH"
  | "CRITICAL";

// ============================================================
// RECOVERY REQUEST
// ============================================================

export interface RecoveryPolicyRequest {

  domain:
    EncryptionDomain;

  operation:
    RecoveryOperation;

  tenant_id: string;

  requested_by: string;

  involves_authority_state?: boolean;

  involves_cognition?: boolean;

  involves_execution?: boolean;

  cross_region?: boolean;
}

// ============================================================
// RECOVERY RESULT
// ============================================================

export interface RecoveryPolicyResult {

  allowed: boolean;

  approvalRequired: boolean;

  boardReviewRequired: boolean;

  immutableAuditRequired: boolean;

  tenantIsolationRequired: boolean;

  severity:
    RecoverySeverity;

  reason: string;

  summary: string[];
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function evaluateRecoveryPolicy(
  request: RecoveryPolicyRequest
): RecoveryPolicyResult {

  const policy =
    getEncryptionDomainPolicy(
      request.domain
    );

  const severity =
    resolveSeverity(
      request
    );

  // ----------------------------------------------------------
  // NON EXPORTABLE
  // ----------------------------------------------------------

  if (
    policy.sovereignty ===
      "NON_EXPORTABLE" &&
    request.operation ===
      "EXPORT_BACKUP"
  ) {

    return deny(
      severity,
      "Constitutional domain cannot be exported.",
      [
        "non_exportable_domain",
        "constitutional_sovereignty_protected",
      ]
    );

  }

  // ----------------------------------------------------------
  // CROSS REGION
  // ----------------------------------------------------------

  if (
    request.cross_region &&
    (
      policy.sovereignty ===
        "REGION_LOCKED" ||
      policy.sovereignty ===
        "NON_EXPORTABLE"
    )
  ) {

    return deny(
      severity,
      "Cross-region recovery forbidden by sovereignty policy.",
      [
        "cross_region_recovery_blocked",
      ]
    );

  }

  // ----------------------------------------------------------
  // AUTHORITY STATE
  // ----------------------------------------------------------

  if (
    request.involves_authority_state
  ) {

    return allow(
      "CRITICAL",
      true,
      true,
      "Authority recovery requires explicit governance approval.",
      [
        "authority_state_recovery",
        "human_approval_required",
        "board_review_required",
      ]
    );

  }

  // ----------------------------------------------------------
  // COGNITION
  // ----------------------------------------------------------

  if (
    request.involves_cognition
  ) {

    return allow(
      "HIGH",
      true,
      false,
      "Cognition recovery requires governed approval.",
      [
        "cognition_recovery",
        "operational_experience_restore",
      ]
    );

  }

  // ----------------------------------------------------------
  // EXECUTION
  // ----------------------------------------------------------

  if (
    request.involves_execution
  ) {

    return allow(
      "HIGH",
      true,
      false,
      "Execution recovery requires immutable audit trace.",
      [
        "execution_recovery",
        "audit_required",
      ]
    );

  }

  // ----------------------------------------------------------
  // DEFAULT
  // ----------------------------------------------------------

  return allow(
    severity,
    policy.human_recovery_approval_required,
    false,
    "Recovery operation allowed under sovereignty policy.",
    [
      `domain:${request.domain}`,
      `operation:${request.operation}`,
    ]
  );

}

// ============================================================
// ALLOW
// ============================================================

function allow(
  severity:
    RecoverySeverity,

  approvalRequired: boolean,

  boardReviewRequired: boolean,

  reason: string,

  summary: string[]
): RecoveryPolicyResult {

  return {

    allowed: true,

    approvalRequired,

    boardReviewRequired,

    immutableAuditRequired: true,

    tenantIsolationRequired: true,

    severity,

    reason,

    summary,
  };

}

// ============================================================
// DENY
// ============================================================

function deny(
  severity:
    RecoverySeverity,

  reason: string,

  summary: string[]
): RecoveryPolicyResult {

  return {

    allowed: false,

    approvalRequired: true,

    boardReviewRequired: true,

    immutableAuditRequired: true,

    tenantIsolationRequired: true,

    severity,

    reason,

    summary: [
      ...summary,
      "recovery_denied",
    ],
  };

}

// ============================================================
// SEVERITY
// ============================================================

function resolveSeverity(
  request: RecoveryPolicyRequest
): RecoverySeverity {

  switch (
    request.domain
  ) {

    case "CHARTER":
    case "GOVERNANCE":
    case "OAG":
    case "AUDIT_LEDGER":
      return "CRITICAL";

    case "COGNITION_SYNTHESIS":
    case "DECISION_MEMORY":
    case "EXECUTION_MEMORY":
    case "SNAPSHOT":
      return "HIGH";

    default:
      return "LOW";
  }

}

// ============================================================
// ASSERTION
// ============================================================

export function assertRecoveryPolicy(
  request: RecoveryPolicyRequest
): void {

  const result =
    evaluateRecoveryPolicy(
      request
    );

  if (!result.allowed) {

    throw new Error(
      [
        "RECOVERY_POLICY_VIOLATION",
        result.reason,
        `severity:${result.severity}`,
      ].join(" | ")
    );

  }

}