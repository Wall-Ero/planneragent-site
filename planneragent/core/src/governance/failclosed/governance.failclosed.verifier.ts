// core/src/governance/failclosed/governance.failclosed.verifier.ts
// ============================================================
// PlannerAgent — Governance Fail-Closed Verifier
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/failclosed/governance.failclosed.verifier.ts
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
// Determine whether governance enforcement paths fail closed.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// PlannerAgent must not downgrade DENY into WARNING,
// LOG, or CONTINUE.
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
// - verify denied governance outcomes
// - verify evidence generation
// - verify execution halt
// - classify fail-open risks
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Verify fail-closed behavior.
// Nothing else.
//
// ============================================================

import type {
  GovernanceFailClosedInput,
  GovernanceFailClosedResult,
} from "./governance.failclosed.types";

export function verifyGovernanceFailClosed(
  input: GovernanceFailClosedInput
): GovernanceFailClosedResult {

  if (!input.denied) {
    return {
      failClosed: true,
      source: input.source,
      denied: false,
      evidenceGenerated: input.evidenceGenerated,
      executionHalted: !input.executionContinued,
      violation: "NONE",
      reason: input.reason,
      summary: [
        "governance_allowed",
        "fail_closed_not_required",
      ],
    };
  }

  if (!input.evidenceGenerated) {
    return {
      failClosed: false,
      source: input.source,
      denied: true,
      evidenceGenerated: false,
      executionHalted: !input.executionContinued,
      violation: "DENY_WITHOUT_EVIDENCE",
      reason: input.reason,
      summary: [
        "governance_denied",
        "evidence_missing",
        "auditability_violation",
      ],
    };
  }

  if (input.executionContinued) {
    return {
      failClosed: false,
      source: input.source,
      denied: true,
      evidenceGenerated: true,
      executionHalted: false,
      violation: "DENY_WITH_EXECUTION_CONTINUED",
      reason: input.reason,
      summary: [
        "governance_denied",
        "execution_continued",
        "fail_open_violation",
      ],
    };
  }

  return {
    failClosed: true,
    source: input.source,
    denied: true,
    evidenceGenerated: true,
    executionHalted: true,
    violation: "NONE",
    reason: input.reason,
    summary: [
      "governance_denied",
      "evidence_generated",
      "execution_halted",
      "fail_closed_verified",
    ],
  };
}