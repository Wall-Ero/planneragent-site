// core/src/governance/policy/validator.ts
/**
 * PlannerAgent — Governance Bundle Validator
 * Status: CANONICAL
 */

import type { PolicyBundle } from "./types";

export function validatePolicyBundle(
  bundle: PolicyBundle
): { ok: true } | { ok: false; reason: string } {
  if (bundle.version !== 1) {
    return { ok: false, reason: "Unsupported policy version" };
  }

  if (!bundle.policies?.hod) {
    return { ok: false, reason: "Missing HOD policy" };
  }

  if (typeof bundle.policies.hod.enabled !== "boolean") {
    return { ok: false, reason: "Invalid HOD.enabled" };
  }

  return { ok: true };
}