// core/src/governance/failclosed/governance.failclosed.types.ts
// ============================================================
// PlannerAgent — Governance Fail-Closed Types
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/failclosed/governance.failclosed.types.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Fail-Closed Verification
//
// PURPOSE
// ------------------------------------------------------------
// Define canonical fail-closed verification contracts.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// A denied governance decision must terminate the execution
// path and remain reconstructable through governance evidence.
//
// DOES NOT:
// - evaluate policy
// - enforce policy
// - execute runtime actions
// - persist evidence
// - write immutable records
// - perform cryptography
//
// DOES:
// - define fail-closed verification input
// - define fail-closed verification result
// - classify execution continuation risk
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define whether a denied governance decision failed closed.
// Nothing else.
//
// ============================================================

export type GovernanceFailClosedSource =
  | "SNAPSHOT_VERIFICATION"
  | "TENANT_BOUNDARY"
  | "SOVEREIGNTY_POLICY"
  | "ENCRYPTION_POLICY"
  | "EXECUTION_GUARD"
  | "GENERIC_GOVERNANCE";

export interface GovernanceFailClosedInput {

  source:
    GovernanceFailClosedSource;

  denied: boolean;

  evidenceGenerated: boolean;

  executionContinued: boolean;

  reason: string;
}

export interface GovernanceFailClosedResult {

  failClosed: boolean;

  source:
    GovernanceFailClosedSource;

  denied: boolean;

  evidenceGenerated: boolean;

  executionHalted: boolean;

  violation:
    | "NONE"
    | "DENY_WITHOUT_EVIDENCE"
    | "DENY_WITH_EXECUTION_CONTINUED";

  reason: string;

  summary: string[];
}