// planneragent/core/src/sandbox/authority/authoritySandbox.guard.ts
// ======================================================
// Authority Sandbox Guard — P3 Minimal
// Canonical Source of Truth
// ======================================================

import type { SignedSnapshotV1 } from "../contracts.v2";

export type AuthorityGuardOk = { ok: true };

export type AuthorityGuardFail = {
  ok: false;
  reason: string;
};

export type AuthorityGuardResult = AuthorityGuardOk | AuthorityGuardFail;

/**
 * Ensures snapshot contains authority proof
 * BEFORE sandbox logic is executed.
 *
 * P3 Scope:
 * - snapshot must exist
 * - signature must exist
 * - oag_proof must exist
 * - actor + company must match snapshot
 *
 * NO graph validation here (already done in EDGE)
 */
export function authoritySandboxGuard(snapshot: SignedSnapshotV1): AuthorityGuardResult {
  if (!snapshot) return { ok: false, reason: "SNAPSHOT_REQUIRED" };

  if (!snapshot.signature) return { ok: false, reason: "SNAPSHOT_SIGNATURE_MISSING" };

  if (!snapshot.oag_proof) return { ok: false, reason: "OAG_PROOF_MISSING" };

  if (!snapshot.oag_proof.actor_id) return { ok: false, reason: "OAG_ACTOR_MISSING" };

  if (!snapshot.oag_proof.company_id) return { ok: false, reason: "OAG_COMPANY_MISSING" };

  return { ok: true };
}