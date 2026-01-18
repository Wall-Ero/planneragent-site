/**
 * Governance Runtime Registry
 * Status: CANONICAL v1
 *
 * Responsibility:
 * - Hold active policy bundle
 * - Enforce immutability after bootstrap
 * - Expose audit snapshot
 */

import type { PolicyBundle } from "./registry";

let frozen = false;
let activeBundle: PolicyBundle | null = null;

export function freezePolicyRegistry(bundle: PolicyBundle): void {
  if (frozen) {
    throw new Error("[GOVERNANCE_RUNTIME] Registry already frozen");
  }

  activeBundle = Object.freeze({ ...bundle });
  frozen = true;
}

export function getPolicySnapshot() {
  if (!activeBundle) {
    throw new Error("[GOVERNANCE_RUNTIME] No active policy bundle");
  }

  return {
    ok: true as const,
    policy_hash: activeBundle.hash,
    loaded_at: activeBundle.loaded_at,
    policies: [...activeBundle.policies],
  };
}

export function isGovernanceActive(): boolean {
  return frozen;
}