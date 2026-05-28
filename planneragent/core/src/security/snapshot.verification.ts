// core/src/security/snapshot.verification.ts
// ============================================================
// PlannerAgent — Snapshot Verification
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Verify runtime sovereignty integrity for signed snapshots.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Core execution must never trust unsigned authority reality.
//
// DOES NOT:
// - issue authority
// - generate cognition
// - execute workflows
//
// DOES:
// - verify snapshot signatures
// - verify runtime integrity
// - verify tenant sovereignty
// - verify constitutional validity
//
// ============================================================

import type {
  SignedSnapshotV1,
} from "../sandbox/contracts.v2";

import {
  verifySnapshotV1,
} from "../governance/snapshot/snapshot";

import {
  evaluateTenantBoundary,
} from "./tenant.boundary";

// ============================================================
// VERIFICATION STATUS
// ============================================================

export type SnapshotVerificationStatus =
  | "VALID"
  | "INVALID_SIGNATURE"
  | "TENANT_VIOLATION"
  | "EXPIRED"
  | "MALFORMED";

// ============================================================
// RESULT
// ============================================================

export interface SnapshotVerificationResult {

  valid: boolean;

  status:
    SnapshotVerificationStatus;

  integrityVerified: boolean;

  sovereigntyVerified: boolean;

  tenantBoundaryVerified: boolean;

  expired: boolean;

  severity:
    "NONE"
    | "LOW"
    | "HIGH"
    | "CRITICAL";

  reason: string;

  summary: string[];
}

// ============================================================
// REQUEST
// ============================================================

export interface SnapshotVerificationRequest {

  snapshot:
    SignedSnapshotV1;

  secret: string;

  sourceTenant: string;

  targetTenant: string;

  maxSnapshotAgeMs?: number;

  now?: number;
}

// ============================================================
// MAIN ENGINE
// ============================================================

export async function verifyRuntimeSnapshot(
  request: SnapshotVerificationRequest
): Promise<SnapshotVerificationResult> {

  // ----------------------------------------------------------
  // BASIC STRUCTURE
  // ----------------------------------------------------------

  if (
    !request.snapshot ||
    typeof request.snapshot !== "object"
  ) {

    return fail(
      "MALFORMED",
      "Snapshot payload malformed.",
      "CRITICAL",
      [
        "snapshot_malformed",
      ]
    );

  }

  // ----------------------------------------------------------
  // SIGNATURE
  // ----------------------------------------------------------

  const verified =
    await verifySnapshotV1(
      request.secret,
      request.snapshot
    );

  if (!verified) {

    return fail(
      "INVALID_SIGNATURE",
      "Snapshot signature verification failed.",
      "CRITICAL",
      [
        "snapshot_signature_invalid",
        "runtime_integrity_failed",
      ]
    );

  }

  // ----------------------------------------------------------
  // TENANT BOUNDARY
  // ----------------------------------------------------------

  const tenantBoundary =
    evaluateTenantBoundary({

      sourceTenant:
        request.sourceTenant,

      targetTenant:
        request.targetTenant,

      domain:
        "SNAPSHOT",
    });

  if (!tenantBoundary.allowed) {

    return fail(
      "TENANT_VIOLATION",
      tenantBoundary.reason,
      "CRITICAL",
      [
        "snapshot_sovereignty_violation",
      ]
    );

  }

  // ----------------------------------------------------------
  // EXPIRATION
  // ----------------------------------------------------------

  const now =
    request.now ??
    Date.now();

  const maxAge =
    request.maxSnapshotAgeMs ??
    (1000 * 60 * 10);

  const issuedAt =
    new Date(
      request.snapshot.issued_at
    ).getTime();

  if (
    Number.isFinite(issuedAt)
  ) {

    const age =
      now - issuedAt;

    if (age > maxAge) {

      return fail(
        "EXPIRED",
        "Snapshot exceeded runtime validity window.",
        "HIGH",
        [
          "snapshot_expired",
          "runtime_window_exceeded",
        ]
      );

    }

  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return {

    valid: true,

    status: "VALID",

    integrityVerified: true,

    sovereigntyVerified: true,

    tenantBoundaryVerified: true,

    expired: false,

    severity: "NONE",

    reason:
      "Runtime snapshot verified successfully.",

    summary: [
      "snapshot_verified",
      "runtime_integrity_verified",
      "tenant_boundary_verified",
      "operational_sovereignty_preserved",
    ],
  };

}

// ============================================================
// FAILURE
// ============================================================

function fail(
  status: SnapshotVerificationStatus,
  reason: string,
  severity:
    "LOW"
    | "HIGH"
    | "CRITICAL",
  summary: string[]
): SnapshotVerificationResult {

  return {

    valid: false,

    status,

    integrityVerified: false,

    sovereigntyVerified: false,

    tenantBoundaryVerified: false,

    expired:
      status === "EXPIRED",

    severity,

    reason,

    summary,
  };

}

// ============================================================
// ASSERTION
// ============================================================

export async function assertVerifiedRuntimeSnapshot(
  request: SnapshotVerificationRequest
): Promise<void> {

  const result =
    await verifyRuntimeSnapshot(
      request
    );

  if (!result.valid) {

    throw new Error(
      [
        "SNAPSHOT_VERIFICATION_FAILED",
        result.status,
        result.reason,
      ].join(" | ")
    );

  }

}