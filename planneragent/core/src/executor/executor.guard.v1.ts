// PATH: core/src/executor/executor.guard.v1.ts
// ======================================================
// Executor Guard — Governance Gate v1 (Aligned)
// ======================================================

import type { ExecutionIntent } from "../execution/execution.contracts.v1";

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export function guardExecutionIntent(
  intent: ExecutionIntent,
  opts: {
    hasAuthority: boolean;
    approver_id?: string;
  }
): GuardResult {

  // --------------------------------------------------
  // AUTHORITY
  // --------------------------------------------------

  if (!opts.hasAuthority) {
    return { ok: false, reason: "NO_AUTHORITY" };
  }

  // --------------------------------------------------
  // MODE GOVERNANCE (SAFE)
  // --------------------------------------------------

  const mode = intent.mode as string;

  if (mode === "VISION") {
    return { ok: false, reason: "VISION_CANNOT_EXECUTE" };
  }

  if (mode === "JUNIOR" && !opts.approver_id) {
    return { ok: false, reason: "APPROVER_REQUIRED" };
  }

  // --------------------------------------------------
  // BASIC SAFETY
  // --------------------------------------------------

  if (!intent.capability_id) {
    return { ok: false, reason: "MISSING_CAPABILITY_ID" };
  }

  if (!intent.payload) {
    return { ok: false, reason: "MISSING_PAYLOAD" };
  }

  return { ok: true };
}