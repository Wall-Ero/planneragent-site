// core/src/security/sovereignty.policy.ts
// ============================================================
// PlannerAgent — Sovereignty Policy Engine
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Govern operational, cognitive and constitutional sovereignty
// across runtime participation.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Operational sovereignty defines:
//
// where cognition may exist,
// where authority may execute,
// where governance may persist.
//
// Security protects systems.
// Sovereignty protects operational legitimacy.
//
// DOES NOT:
// - encrypt payloads
// - execute workflows
// - restore backups
//
// DOES:
// - enforce sovereignty boundaries
// - classify runtime sovereignty
// - govern cognition locality
// - govern authority locality
//
// ============================================================

import type {
  EncryptionDomain,
  SovereigntyClass,
} from "./encryption.domains";

import {
  getEncryptionDomainPolicy,
} from "./encryption.domains";

// ============================================================
// SOVEREIGNTY OPERATION
// ============================================================

export type SovereigntyOperation =
  | "STORE"
  | "TRANSFER"
  | "PROCESS"
  | "EXECUTE"
  | "REPLICATE"
  | "LLM_RUNTIME";

// ============================================================
// RUNTIME LOCALITY
// ============================================================

export type RuntimeLocality =
  | "TENANT_LOCAL"
  | "REGION_LOCAL"
  | "GLOBAL_RUNTIME";

// ============================================================
// REQUEST
// ============================================================

export interface SovereigntyPolicyRequest {

  domain:
    EncryptionDomain;

  operation:
    SovereigntyOperation;

  tenant_id: string;

  source_region: string;

  target_region?: string;

  runtime_locality:
    RuntimeLocality;

  involves_authority?: boolean;

  involves_cognition?: boolean;

  involves_execution?: boolean;
}

// ============================================================
// RESULT
// ============================================================

export interface SovereigntyPolicyResult {

  allowed: boolean;

  sovereignty:
    SovereigntyClass;

  locality:
    RuntimeLocality;

  crossRegionAllowed: boolean;

  cognitionTransferAllowed: boolean;

  authorityTransferAllowed: boolean;

  replicationAllowed: boolean;

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

export function evaluateSovereigntyPolicy(
  request: SovereigntyPolicyRequest
): SovereigntyPolicyResult {

  const policy =
    getEncryptionDomainPolicy(
      request.domain
    );

  // ----------------------------------------------------------
  // NON EXPORTABLE
  // ----------------------------------------------------------

  if (
    policy.sovereignty ===
      "NON_EXPORTABLE" &&
    request.target_region &&
    request.target_region !==
      request.source_region
  ) {

    return deny(
      policy.sovereignty,
      request.runtime_locality,
      "Cross-region sovereignty transfer forbidden.",
      [
        "non_exportable_domain",
        "cross_region_transfer_blocked",
      ]
    );

  }

  // ----------------------------------------------------------
  // REGION LOCKED
  // ----------------------------------------------------------

  if (
    policy.sovereignty ===
      "REGION_LOCKED" &&
    request.target_region &&
    request.target_region !==
      request.source_region
  ) {

    return deny(
      policy.sovereignty,
      request.runtime_locality,
      "Domain restricted to regional sovereignty boundary.",
      [
        "region_locked_domain",
      ]
    );

  }

  // ----------------------------------------------------------
  // AUTHORITY
  // ----------------------------------------------------------

  if (
    request.involves_authority &&
    request.runtime_locality ===
      "GLOBAL_RUNTIME"
  ) {

    return deny(
      policy.sovereignty,
      request.runtime_locality,
      "Authority execution forbidden outside governed locality.",
      [
        "authority_locality_violation",
      ]
    );

  }

  // ----------------------------------------------------------
  // COGNITION
  // ----------------------------------------------------------

  if (
    request.involves_cognition &&
    request.operation ===
      "TRANSFER"
  ) {

    if (
      policy.cross_tenant_forbidden
    ) {

      return deny(
        policy.sovereignty,
        request.runtime_locality,
        "Operational cognition cannot cross sovereignty boundary.",
        [
          "cognitive_sovereignty_protected",
        ]
      );

    }

  }

  // ----------------------------------------------------------
  // REPLICATION
  // ----------------------------------------------------------

  if (
    request.operation ===
      "REPLICATE"
  ) {

    if (
      policy.sovereignty ===
      "NON_EXPORTABLE"
    ) {

      return deny(
        policy.sovereignty,
        request.runtime_locality,
        "Constitutional domain replication forbidden.",
        [
          "replication_blocked",
        ]
      );

    }

  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return allow(
    policy.sovereignty,
    request.runtime_locality,
    "Operation allowed under sovereignty policy.",
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
  sovereignty:
    SovereigntyClass,

  locality:
    RuntimeLocality,

  reason: string,

  summary: string[]
): SovereigntyPolicyResult {

  return {

    allowed: true,

    sovereignty,

    locality,

    crossRegionAllowed: true,

    cognitionTransferAllowed: true,

    authorityTransferAllowed:
      locality !== "GLOBAL_RUNTIME",

    replicationAllowed:
      sovereignty !== "NON_EXPORTABLE",

    severity:
      resolveSeverity(
        sovereignty
      ),

    reason,

    summary,
  };

}

// ============================================================
// DENY
// ============================================================

function deny(
  sovereignty:
    SovereigntyClass,

  locality:
    RuntimeLocality,

  reason: string,

  summary: string[]
): SovereigntyPolicyResult {

  return {

    allowed: false,

    sovereignty,

    locality,

    crossRegionAllowed: false,

    cognitionTransferAllowed: false,

    authorityTransferAllowed: false,

    replicationAllowed: false,

    severity:
      resolveSeverity(
        sovereignty
      ),

    reason,

    summary: [
      ...summary,
      "sovereignty_violation",
    ],
  };

}

// ============================================================
// SEVERITY
// ============================================================

function resolveSeverity(
  sovereignty:
    SovereigntyClass
):
  "LOW"
  | "HIGH"
  | "CRITICAL" {

  switch (
    sovereignty
  ) {

    case "NON_EXPORTABLE":
    case "BOARD_GOVERNED":
      return "CRITICAL";

    case "REGION_LOCKED":
      return "HIGH";

    default:
      return "LOW";
  }

}

// ============================================================
// ASSERTION
// ============================================================

export function assertSovereigntyPolicy(
  request: SovereigntyPolicyRequest
): void {

  const result =
    evaluateSovereigntyPolicy(
      request
    );

  if (!result.allowed) {

    throw new Error(
      [
        "SOVEREIGNTY_POLICY_VIOLATION",
        result.reason,
        `severity:${result.severity}`,
      ].join(" | ")
    );

  }

}