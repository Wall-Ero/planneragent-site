/**
 * Governance Policy Validator
 * Status: CANONICAL v1
 *
 * Responsibility:
 * - Validate bundle structure
 * - Enforce invariants
 * - Reject unsafe governance states
 */

import type { PolicyBundle } from "./registry";

export type PolicyValidationResult = {
  ok: true;
} | {
  ok: false;
  reason: string;
};

export function validatePolicyBundle(
  bundle: PolicyBundle
): PolicyValidationResult {
  if (!bundle) {
    return { ok: false, reason: "Bundle is undefined" };
  }

  if (!Array.isArray(bundle.policies)) {
    return { ok: false, reason: "Policies must be an array" };
  }

  if (bundle.policies.length === 0) {
    return { ok: false, reason: "No policies loaded" };
  }

  if (!bundle.hash || typeof bundle.hash !== "string") {
    return { ok: false, reason: "Missing policy hash" };
  }

  return { ok: true };
}