// core/src/security/snapshot.verification.ts
// ============================================================
// PlannerAgent — Snapshot Verification
// Enterprise Constitutional Runtime Gate
// ============================================================
//
// RULE
// ------------------------------------------------------------
// No valid signed snapshot.
// No cognition.
// No governance emergence.
// No execution.
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

export type SnapshotVerificationStatus =
  | "VALID"
  | "MISSING_SECRET"
  | "MISSING_SIGNATURE"
  | "INVALID_SIGNATURE_FORMAT"
  | "INVALID_SIGNATURE"
  | "TENANT_VIOLATION"
  | "COMPANY_MISMATCH"
  | "EXPIRED"
  | "MALFORMED";

export interface SnapshotVerificationResult {
  valid: boolean;
  status: SnapshotVerificationStatus;
  integrityVerified: boolean;
  sovereigntyVerified: boolean;
  tenantBoundaryVerified: boolean;
  expired: boolean;
  severity: "NONE" | "LOW" | "HIGH" | "CRITICAL";
  reason: string;
  summary: string[];
}

export interface SnapshotVerificationRequest {
  snapshot: SignedSnapshotV1;
  secret?: string;
  sourceTenant: string;
  targetTenant: string;
  expectedCompanyId?: string;
  maxSnapshotAgeMs?: number;
  now?: number;
}

export async function verifyRuntimeSnapshot(
  request: SnapshotVerificationRequest
): Promise<SnapshotVerificationResult> {

  const snapshot: any =
    request.snapshot;

    console.log("SNAPSHOT_VERIFIER_REACHED", {
  signature: snapshot?.signature,
  signatureType: typeof snapshot?.signature,
  signatureLength:
    typeof snapshot?.signature === "string"
      ? snapshot.signature.length
      : null,
  regexPass:
    typeof snapshot?.signature === "string"
      ? /^[a-f0-9]{64}$/i.test(snapshot.signature)
      : false,
});

  if (!snapshot || typeof snapshot !== "object") {
    return fail(
      "MALFORMED",
      "Snapshot payload malformed.",
      "CRITICAL",
      ["snapshot_malformed"]
    );
  }

  if (!request.secret) {
    return fail(
      "MISSING_SECRET",
      "Snapshot verification secret missing.",
      "CRITICAL",
      ["snapshot_secret_missing", "runtime_integrity_not_verifiable"]
    );
  }

  if (!snapshot.signature || typeof snapshot.signature !== "string") {
    return fail(
      "MISSING_SIGNATURE",
      "Snapshot signature missing.",
      "CRITICAL",
      ["snapshot_signature_missing", "runtime_integrity_failed"]
    );
  }

  if (!/^[a-f0-9]{64}$/i.test(snapshot.signature)) {
    return fail(
      "INVALID_SIGNATURE_FORMAT",
      "Snapshot signature is not a valid HMAC-SHA256 hex digest.",
      "CRITICAL",
      ["snapshot_signature_invalid_format", "runtime_integrity_failed"]
    );
  }

  if (!snapshot.issued_at || typeof snapshot.issued_at !== "string") {
    return fail(
      "MALFORMED",
      "Snapshot issued_at missing.",
      "CRITICAL",
      ["snapshot_issued_at_missing"]
    );
  }

  if (!snapshot.company_id || typeof snapshot.company_id !== "string") {
    return fail(
      "MALFORMED",
      "Snapshot company_id missing.",
      "CRITICAL",
      ["snapshot_company_id_missing"]
    );
  }

  if (
    request.expectedCompanyId &&
    snapshot.company_id !== request.expectedCompanyId
  ) {
    return fail(
      "COMPANY_MISMATCH",
      "Snapshot company_id does not match runtime request company_id.",
      "CRITICAL",
      [
        "snapshot_company_mismatch",
        "authority_reality_mismatch",
      ]
    );
  }

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

  const tenantBoundary =
    evaluateTenantBoundary({
      sourceTenant: request.sourceTenant,
      targetTenant: request.targetTenant,
      domain: "SNAPSHOT",
    });

  if (!tenantBoundary.allowed) {
    return fail(
      "TENANT_VIOLATION",
      tenantBoundary.reason,
      "CRITICAL",
      [
        "snapshot_sovereignty_violation",
        ...tenantBoundary.summary,
      ]
    );
  }

  const now =
    request.now ?? Date.now();

  const maxAge =
    request.maxSnapshotAgeMs ?? 1000 * 60 * 10;

  const issuedAt =
    new Date(snapshot.issued_at).getTime();

  if (!Number.isFinite(issuedAt)) {
    return fail(
      "MALFORMED",
      "Snapshot issued_at is invalid.",
      "CRITICAL",
      ["snapshot_issued_at_invalid"]
    );
  }

  if (now - issuedAt > maxAge) {
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

  return {
    valid: true,
    status: "VALID",
    integrityVerified: true,
    sovereigntyVerified: true,
    tenantBoundaryVerified: true,
    expired: false,
    severity: "NONE",
    reason: "Runtime snapshot verified successfully.",
    summary: [
      "snapshot_verified",
      "runtime_integrity_verified",
      "tenant_boundary_verified",
      "operational_sovereignty_preserved",
    ],
  };
}

function fail(
  status: SnapshotVerificationStatus,
  reason: string,
  severity: "LOW" | "HIGH" | "CRITICAL",
  summary: string[]
): SnapshotVerificationResult {

  return {
    valid: false,
    status,
    integrityVerified: false,
    sovereigntyVerified: false,
    tenantBoundaryVerified: false,
    expired: status === "EXPIRED",
    severity,
    reason,
    summary,
  };
}

export async function assertVerifiedRuntimeSnapshot(
  request: SnapshotVerificationRequest
): Promise<void> {

  const result =
    await verifyRuntimeSnapshot(request);

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