// core/src/governance/policy/registry.ts
/**
 * PlannerAgent — Governance Dataset Loader
 * Status: CANONICAL · DETERMINISTIC
 */

import type { PolicyBundle } from "./types";

export async function loadPolicyDatasets(): Promise<PolicyBundle> {
  // PRE-SRL: filesystem / bundle statico
  return {
    version: 1,
    hash: "dev-hod-policy-hash",
    loaded_at: new Date().toISOString(),
    policies: {
      hod: {
        enabled: true,
        mode: "MANUAL_ONLY",
      },
    },
  };
}