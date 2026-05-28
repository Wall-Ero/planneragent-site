// core/src/security/tenant.boundary.ts
// ============================================================
// PlannerAgent — Tenant Sovereignty Boundary
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Enforce tenant sovereignty boundaries across cognition,
// governance, memory and operational execution.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// No operational cognition may cross tenant boundaries.
//
// Tenant isolation is not only a storage concern.
// It is an operational sovereignty concern.
//
// DOES NOT:
// - encrypt payloads
// - manage keys
// - execute recovery
//
// DOES:
// - validate tenant ownership
// - validate cross-tenant access
// - validate sovereignty boundaries
// - classify tenant violations
//
// ============================================================

import type {
  EncryptionDomain,
} from "./encryption.domains";

import {
  getEncryptionDomainPolicy,
} from "./encryption.domains";

// ============================================================
// TENANT ACCESS MODE
// ============================================================

export type TenantAccessMode =
  | "LOCAL"
  | "CROSS_TENANT"
  | "SYSTEM_INTERNAL";

// ============================================================
// TENANT BOUNDARY RESULT
// ============================================================

export interface TenantBoundaryResult {

  allowed: boolean;

  violation: boolean;

  severity:
    "NONE"
    | "LOW"
    | "HIGH"
    | "CRITICAL";

  reason: string;

  sourceTenant: string;

  targetTenant: string;

  domain: EncryptionDomain;

  accessMode: TenantAccessMode;

  summary: string[];
}

// ============================================================
// TENANT ACCESS REQUEST
// ============================================================

export interface TenantBoundaryRequest {

  sourceTenant: string;

  targetTenant: string;

  domain: EncryptionDomain;

  accessMode?: TenantAccessMode;

  systemInternal?: boolean;
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function evaluateTenantBoundary(
  request: TenantBoundaryRequest
): TenantBoundaryResult {

  const accessMode =
    resolveAccessMode(request);

  const policy =
    getEncryptionDomainPolicy(
      request.domain
    );

  // ----------------------------------------------------------
  // SAME TENANT
  // ----------------------------------------------------------

  if (
    request.sourceTenant ===
    request.targetTenant
  ) {

    return {

      allowed: true,

      violation: false,

      severity: "NONE",

      reason:
        "Tenant-local access permitted.",

      sourceTenant:
        request.sourceTenant,

      targetTenant:
        request.targetTenant,

      domain:
        request.domain,

      accessMode,

      summary: [
        "tenant_local_access",
        `domain:${request.domain}`,
      ],
    };

  }

  // ----------------------------------------------------------
  // SYSTEM INTERNAL
  // ----------------------------------------------------------

  if (
    accessMode === "SYSTEM_INTERNAL"
  ) {

    return {

      allowed: true,

      violation: false,

      severity: "LOW",

      reason:
        "System-internal governed access permitted.",

      sourceTenant:
        request.sourceTenant,

      targetTenant:
        request.targetTenant,

      domain:
        request.domain,

      accessMode,

      summary: [
        "system_internal_access",
        `domain:${request.domain}`,
      ],
    };

  }

  // ----------------------------------------------------------
  // CROSS TENANT BLOCK
  // ----------------------------------------------------------

  if (
    policy.cross_tenant_forbidden
  ) {

    return {

      allowed: false,

      violation: true,

      severity:
        resolveViolationSeverity(
          request.domain
        ),

      reason:
        "Cross-tenant operational sovereignty violation.",

      sourceTenant:
        request.sourceTenant,

      targetTenant:
        request.targetTenant,

      domain:
        request.domain,

      accessMode,

      summary: [
        "cross_tenant_violation",
        "operational_sovereignty_violation",
        `domain:${request.domain}`,
      ],
    };

  }

  // ----------------------------------------------------------
  // CROSS TENANT ALLOWED
  // ----------------------------------------------------------

  return {

    allowed: true,

    violation: false,

    severity: "LOW",

    reason:
      "Cross-tenant access allowed by policy.",

    sourceTenant:
      request.sourceTenant,

    targetTenant:
      request.targetTenant,

    domain:
      request.domain,

    accessMode,

    summary: [
      "cross_tenant_allowed",
      `domain:${request.domain}`,
    ],
  };

}

// ============================================================
// ACCESS MODE
// ============================================================

function resolveAccessMode(
  request: TenantBoundaryRequest
): TenantAccessMode {

  if (
    request.systemInternal
  ) {
    return "SYSTEM_INTERNAL";
  }

  if (
    request.sourceTenant !==
    request.targetTenant
  ) {
    return "CROSS_TENANT";
  }

  return "LOCAL";

}

// ============================================================
// SEVERITY
// ============================================================

function resolveViolationSeverity(
  domain: EncryptionDomain
):
  "LOW"
  | "HIGH"
  | "CRITICAL" {

  switch (domain) {

    case "CHARTER":
    case "OAG":
    case "GOVERNANCE":
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
// ASSERTIONS
// ============================================================

export function assertTenantBoundary(
  request: TenantBoundaryRequest
): void {

  const result =
    evaluateTenantBoundary(
      request
    );

  if (!result.allowed) {

    throw new Error(
      [
        "TENANT_BOUNDARY_VIOLATION",
        result.reason,
        `domain:${result.domain}`,
        `severity:${result.severity}`,
      ].join(" | ")
    );

  }

}

// ============================================================
// HELPERS
// ============================================================

export function sameTenant(
  a?: string,
  b?: string
): boolean {

  if (!a || !b) {
    return false;
  }

  return a === b;

}

export function isCrossTenant(
  a?: string,
  b?: string
): boolean {

  return !sameTenant(a, b);

}