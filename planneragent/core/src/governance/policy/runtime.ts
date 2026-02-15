// core/src/governance/policy/runtime.ts
// ======================================================
// PlannerAgent — Governance Runtime Registry
// Status: CANONICAL · IMMUTABLE · READ-ONLY AFTER BOOT
//
// Responsibility:
// - Hold frozen governance policy bundle
// - Expose safe read-only access
// - Enforce "no access before bootstrap"
// ======================================================

import type { PolicyBundle } from "./types";

// ------------------------------------------------------------------
// Internal frozen registry (write-once)
// ------------------------------------------------------------------

let frozenRegistry: PolicyBundle | null = null;

// ------------------------------------------------------------------
// Freeze runtime registry (called ONLY by bootstrap)
// ------------------------------------------------------------------

export function freezePolicyRegistry(bundle: PolicyBundle): void {
  if (frozenRegistry) {
    // Idempotent by design — never re-freeze or mutate
    return;
  }

  frozenRegistry = deepFreeze(bundle);
}

// ------------------------------------------------------------------
// Safe accessor — throws if bootstrap not executed
// ------------------------------------------------------------------

export function getPolicyRegistry(): PolicyBundle {
  if (!frozenRegistry) {
    throw new Error("[GOVERNANCE] Registry not bootstrapped");
  }
  return frozenRegistry;
}

// ------------------------------------------------------------------
// Snapshot for audit / diagnostics (NO raw policies mutation)
// ------------------------------------------------------------------

export function getPolicySnapshot() {
  const registry = getPolicyRegistry();

  return {
    ok: true as const,
    policy_hash: registry.hash,
    loaded_at: registry.loaded_at,
    policies: Object.keys(registry.policies),
  };
}

// ------------------------------------------------------------------
// Utility — deep freeze object tree
// ------------------------------------------------------------------

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const value of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(value);
    }
  }
  return obj;
}