// core/src/security/encryption.policy.ts
// ============================================================
// PlannerAgent — Encryption Policy Engine
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Resolve runtime encryption obligations for operational,
// cognitive, governance and constitutional domains.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Encryption policy protects operational sovereignty.
//
// Encryption is not generic infrastructure.
// It is runtime constitutional protection.
//
// DOES NOT:
// - perform cryptography
// - manage secrets
// - persist keys
//
// DOES:
// - resolve runtime obligations
// - enforce encryption requirements
// - enforce sovereignty restrictions
// - validate operational handling rules
//
// ============================================================

import type {
  EncryptionDomain,
  EncryptionDomainPolicy,
  SovereigntyClass,
  DataClassification,
} from "./encryption.domains";

import {
  getEncryptionDomainPolicy,
} from "./encryption.domains";

// ============================================================
// ENCRYPTION OPERATION
// ============================================================

export type EncryptionOperation =
  | "READ"
  | "WRITE"
  | "TRANSFER"
  | "CACHE"
  | "EXPORT"
  | "LLM_ACCESS"
  | "RECOVERY";

// ============================================================
// POLICY REQUEST
// ============================================================

export interface EncryptionPolicyRequest {

  domain: EncryptionDomain;

  operation: EncryptionOperation;

  tenant_id: string;

  region?: string;

  llm_requested?: boolean;

  export_requested?: boolean;

  cache_requested?: boolean;

  recovery_requested?: boolean;
}

// ============================================================
// POLICY RESULT
// ============================================================

export interface EncryptionPolicyResult {

  allowed: boolean;

  encryptionRequired: boolean;

  immutableRequired: boolean;

  keyRotationRequired: boolean;

  tenantIsolationRequired: boolean;

  humanApprovalRequired: boolean;

  sovereignty:
    SovereigntyClass;

  classification:
    DataClassification;

  severity:
    "LOW"
    | "HIGH"
    | "CRITICAL";

  reason: string;

  summary: string[];
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function resolveEncryptionPolicy(
  request: EncryptionPolicyRequest
): EncryptionPolicyResult {

  const policy =
    getEncryptionDomainPolicy(
      request.domain
    );

  // ----------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------

  if (
    request.operation === "EXPORT"
  ) {

    if (!policy.export_allowed) {

      return deny(
        policy,
        "Domain export forbidden by sovereignty policy.",
        [
          "export_blocked",
          "operational_sovereignty_protected",
        ]
      );

    }

  }

  // ----------------------------------------------------------
  // CACHE
  // ----------------------------------------------------------

  if (
    request.operation === "CACHE"
  ) {

    if (!policy.cache_allowed) {

      return deny(
        policy,
        "Caching forbidden for protected operational domain.",
        [
          "cache_blocked",
          "protected_runtime_domain",
        ]
      );

    }

  }

  // ----------------------------------------------------------
  // LLM ACCESS
  // ----------------------------------------------------------

  if (
    request.operation === "LLM_ACCESS"
  ) {

    if (!policy.llm_access_allowed) {

      return deny(
        policy,
        "LLM access forbidden for protected sovereignty domain.",
        [
          "llm_access_blocked",
          "cognitive_sovereignty_protected",
        ]
      );

    }

  }

  // ----------------------------------------------------------
  // RECOVERY
  // ----------------------------------------------------------

  if (
    request.operation === "RECOVERY"
  ) {

    return allow(
      policy,
      "Recovery governed by constitutional recovery policy.",
      [
        "recovery_operation",
        "human_governance_required",
      ],
      true
    );

  }

  // ----------------------------------------------------------
  // DEFAULT ALLOW
  // ----------------------------------------------------------

  return allow(
    policy,
    "Operation allowed under encryption sovereignty policy.",
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
  policy: EncryptionDomainPolicy,
  reason: string,
  extraSummary: string[] = [],
  forceHumanApproval = false
): EncryptionPolicyResult {

  return {

    allowed: true,

    encryptionRequired:
      policy.encrypt_at_rest ||
      policy.encrypt_in_transit,

    immutableRequired:
      policy.immutable_required,

    keyRotationRequired:
      policy.key_rotation_required,

    tenantIsolationRequired:
      policy.tenant_isolated,

    humanApprovalRequired:
      forceHumanApproval ||
      policy.human_recovery_approval_required,

    sovereignty:
      policy.sovereignty,

    classification:
      policy.classification,

    severity:
      resolveSeverity(policy),

    reason,

    summary: [
      ...policy.summary,
      ...extraSummary,
    ],
  };

}

// ============================================================
// DENY
// ============================================================

function deny(
  policy: EncryptionDomainPolicy,
  reason: string,
  extraSummary: string[] = []
): EncryptionPolicyResult {

  return {

    allowed: false,

    encryptionRequired:
      true,

    immutableRequired:
      policy.immutable_required,

    keyRotationRequired:
      policy.key_rotation_required,

    tenantIsolationRequired:
      true,

    humanApprovalRequired:
      true,

    sovereignty:
      policy.sovereignty,

    classification:
      policy.classification,

    severity:
      resolveSeverity(policy),

    reason,

    summary: [
      ...policy.summary,
      ...extraSummary,
      "operation_denied",
    ],
  };

}

// ============================================================
// SEVERITY
// ============================================================

function resolveSeverity(
  policy: EncryptionDomainPolicy
):
  "LOW"
  | "HIGH"
  | "CRITICAL" {

  switch (
    policy.classification
  ) {

    case "CONSTITUTIONAL":
      return "CRITICAL";

    case "CRITICAL":
      return "HIGH";

    default:
      return "LOW";
  }

}

// ============================================================
// ASSERTIONS
// ============================================================

export function assertEncryptionPolicy(
  request: EncryptionPolicyRequest
): void {

  const result =
    resolveEncryptionPolicy(
      request
    );

  if (!result.allowed) {

    throw new Error(
      [
        "ENCRYPTION_POLICY_VIOLATION",
        result.reason,
        `severity:${result.severity}`,
      ].join(" | ")
    );

  }

}

// ============================================================
// HELPERS
// ============================================================

export function domainRequiresImmutableLedger(
  domain: EncryptionDomain
): boolean {

  return getEncryptionDomainPolicy(domain)
    .immutable_required === true;

}

export function domainAllowsLlmAccess(
  domain: EncryptionDomain
): boolean {

  return getEncryptionDomainPolicy(domain)
    .llm_access_allowed === true;

}

export function domainRequiresHumanRecoveryApproval(
  domain: EncryptionDomain
): boolean {

  return getEncryptionDomainPolicy(domain)
    .human_recovery_approval_required === true;

}