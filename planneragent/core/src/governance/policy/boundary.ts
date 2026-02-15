// core/src/governance/policy/boundary.ts
/**
 * PlannerAgent — Governance Boundary Assertion
 * Status: CANONICAL · DETERMINISTIC · SIDE-EFFECT FREE
 *
 * Responsibility:
 * - Enforce governance boundary before ANY action
 * - Block execution when authority is missing
 * - Allow execution ONLY via explicit Human Override Doctrine (HOD)
 *
 * Rules:
 * - No authority → hard block
 * - HOD must be enabled in policy registry
 * - Override must be explicit (never implicit)
 */

import { getPolicyRegistry } from "./runtime";

export type GovernanceBoundaryInput = {
  hasAuthority: boolean;
  humanOverride?: boolean;
};

export type GovernanceBoundaryResult =
  | { ok: true }
  | { ok: false; reason: string };

export function assertGovernanceBoundary(
  input: GovernanceBoundaryInput
): GovernanceBoundaryResult {
  const registry = getPolicyRegistry();

  // 1. Authority always wins
  if (input.hasAuthority) {
    return { ok: true };
  }

  // 2. No authority → check Human Override Doctrine
  const hodEnabled = Boolean(registry.policies.hod?.enabled);

  if (!hodEnabled) {
    return {
      ok: false,
      reason: "GOVERNANCE_BOUNDARY: authority required",
    };
  }

  // 3. HOD enabled, but override must be explicit
  if (!input.humanOverride) {
    return {
      ok: false,
      reason: "HOD_ENABLED_BUT_NO_EXPLICIT_OVERRIDE",
    };
  }

  // 4. Explicit human override → allowed
  return { ok: true };
}