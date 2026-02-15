// core/src/governance/policy/types.ts
// ======================================================
// PlannerAgent — Governance Policy Types
// Status: CANONICAL · SOURCE OF TRUTH
//
// This file defines the immutable shape of the governance
// policy bundle once loaded and frozen at runtime.
// ======================================================

/**
 * Single policy payload.
 * Runtime treats this as opaque data.
 */
export type GovernancePolicy = {
  enabled?: boolean;
  [key: string]: unknown;
};

/**
 * Collection of named policies.
 * Example keys: "hod", "boundary", "rate_limit", ...
 */
export type GovernancePolicyMap = Record<string, GovernancePolicy>;

/**
 * Immutable governance bundle loaded at bootstrap time.
 * This is the ONLY object frozen into the runtime registry.
 */
export type PolicyBundle = {
  /**
   * Deterministic hash of the policy bundle
   * (used for audit, replay, verification)
   */
  hash: string;

  /**
   * ISO timestamp of when the bundle was loaded
   */
  loaded_at: string;

  /**
   * Actual governance policies, indexed by name
   */
  policies: GovernancePolicyMap;
};