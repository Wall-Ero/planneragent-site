/**
 * PlannerAgent — Governance Bootstrap
 * Status: CANONICAL · DETERMINISTIC · SIDE-EFFECT CONTROLLED
 *
 * Responsibility:
 * - Load governance datasets
 * - Validate schema + hash
 * - Freeze runtime policy registry
 * - Expose audit snapshot
 *
 * This is the ONLY legal entry point to activate Core governance.
 */

import { loadPolicyDatasets } from "../registry";
import { validatePolicyBundle } from "../validator";
import { freezePolicyRegistry, getPolicySnapshot } from "../runtime";

export type GovernanceBootstrapResult = {
  ok: true;
  policy_hash: string;
  loaded_at: string;
  policies: string[];
};

let bootstrapped = false;

export async function bootstrapGovernance(): Promise<GovernanceBootstrapResult> {
  if (bootstrapped) {
    // Idempotent by design — no re-init, no mutation
    return getPolicySnapshot();
  }

  // 1. Load raw datasets (filesystem, KV, or bundle)
  const bundle = await loadPolicyDatasets();

  // 2. Validate structure, schema, and invariants
  const validation = validatePolicyBundle(bundle);
  if (!validation.ok) {
    throw new Error(
      `[GOVERNANCE_BOOTSTRAP_FAILED] ${validation.reason || "Invalid policy bundle"}`
    );
  }

  // 3. Freeze into runtime registry (read-only from now on)
  freezePolicyRegistry(bundle);

  bootstrapped = true;

  // 4. Return audit snapshot (never raw policies)
  return getPolicySnapshot();
}