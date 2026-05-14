// core/src/sandbox/narrative/planner.narrative.policy.ts
// ============================================================
// PlannerAgent — Narrative Policy Layer
// Canonical Snapshot · Source of Truth · Chat WIP
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Governs deterministic operational narration.
//
// This layer DOES NOT:
// - generate prose
// - render UI
// - optimize operations
// - decide execution
//
// This layer DOES:
// - validate narrative consistency
// - enforce semantic runtime coherence
// - apply degradation semantics
// - apply severity escalation
// - suppress operational noise
// - determine narrative escalation eligibility
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// PlannerAgent narrative is:
//
// deterministic
// governance-aware
// operational
// runtime-consistent
//
// NOT:
//
// assistant-like
// conversational
// motivational
// generic AI narration
//
// ============================================================

import type {
  PlannerNarrativeState,
} from "./plannerNarrative";

export interface NarrativePolicyResult {

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  valid: boolean;

  violations: string[];

  // ----------------------------------------------------------
  // Severity semantics
  // ----------------------------------------------------------

  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  // ----------------------------------------------------------
  // Runtime degradation
  // ----------------------------------------------------------

  degraded: boolean;

  degradationReason?: string;

  // ----------------------------------------------------------
  // Noise suppression
  // ----------------------------------------------------------

  compactMode: boolean;

  suppressRecommendations: boolean;

  // ----------------------------------------------------------
  // Authority evolution semantics
  // ----------------------------------------------------------

  escalationEligible: boolean;

  escalationReason?: string;
}

// ============================================================
// VALIDATION
// ============================================================

function validateNarrativeConsistency(
  state: PlannerNarrativeState
): string[] {

  const violations: string[] = [];

  // ----------------------------------------------------------
  // Invalid execution posture
  // ----------------------------------------------------------

  if (
    state.executionAllowed === false
    && state.executionPosture === "EXECUTE"
  ) {
    violations.push(
      "execution_posture_without_authority"
    );
  }

  // ----------------------------------------------------------
  // Invalid operational condition
  // ----------------------------------------------------------

  if (
    state.operationalCondition === "STABLE"
    && state.pressureLevel === "HIGH"
  ) {
    violations.push(
      "stable_condition_with_high_pressure"
    );
  }

  // ----------------------------------------------------------
  // Invalid recovery semantics
  // ----------------------------------------------------------

  if (
    state.recoveryPossible
    && state.reconciliationStatus === "NOT_REQUIRED"
  ) {
    violations.push(
      "recovery_without_reconciliation"
    );
  }

  return violations;
}

// ============================================================
// SEVERITY
// ============================================================

function resolveNarrativeSeverity(
  state: PlannerNarrativeState
): NarrativePolicyResult["severity"] {

  if (
    state.operationalCondition === "CRITICAL"
  ) {
    return "CRITICAL";
  }

  if (
    state.pressureLevel === "HIGH"
  ) {
    return "HIGH";
  }

  if (
    state.operationalCondition === "UNSTABLE"
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

// ============================================================
// DEGRADATION
// ============================================================

function applyNarrativeDegradation(
  state: PlannerNarrativeState
): {
  degraded: boolean;
  degradationReason?: string;
} {

  if (
    state.executionAllowed === false
    && state.executionPosture === "OBSERVE"
  ) {
    return {
      degraded: true,
      degradationReason:
        "observation_only_runtime"
    };
  }

  return {
    degraded: false
  };
}

// ============================================================
// NOISE POLICY
// ============================================================

function resolveNoisePolicy(
  state: PlannerNarrativeState
): {
  compactMode: boolean;
  suppressRecommendations: boolean;
} {

  // ----------------------------------------------------------
  // Critical containment
  // ----------------------------------------------------------

  if (
    state.operationalCondition === "CRITICAL"
  ) {
    return {
      compactMode: true,
      suppressRecommendations: true
    };
  }

  // ----------------------------------------------------------
  // High pressure
  // ----------------------------------------------------------

  if (
    state.pressureLevel === "HIGH"
  ) {
    return {
      compactMode: true,
      suppressRecommendations: false
    };
  }

  return {
    compactMode: false,
    suppressRecommendations: false
  };
}

// ============================================================
// ESCALATION ELIGIBILITY
// ============================================================

function resolveEscalationEligibility(
  state: PlannerNarrativeState
): {
  escalationEligible: boolean;
  escalationReason?: string;
} {

  // ----------------------------------------------------------
  // VISION → JUNIOR
  // ----------------------------------------------------------

  if (
    state.authorityLevel === "VISION"
    && state.reconciliationStatus === "FULL"
    && state.executionAllowed === false
  ) {
    return {
      escalationEligible: true,
      escalationReason:
        "repeated_governable_corrections_detected"
    };
  }

  // ----------------------------------------------------------
  // JUNIOR → SENIOR
  // ----------------------------------------------------------

  if (
    state.authorityLevel === "JUNIOR"
    && state.executionActive
    && state.pressureLevel === "HIGH"
  ) {
    return {
      escalationEligible: true,
      escalationReason:
        "approval_dependency_detected"
    };
  }

  return {
    escalationEligible: false
  };
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function applyPlannerNarrativePolicy(
  state: PlannerNarrativeState
): NarrativePolicyResult {

  const violations =
    validateNarrativeConsistency(state);

  const severity =
    resolveNarrativeSeverity(state);

  const degradation =
    applyNarrativeDegradation(state);

  const noisePolicy =
    resolveNoisePolicy(state);

  const escalation =
    resolveEscalationEligibility(state);

  return {

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    valid:
      violations.length === 0,

    violations,

    // --------------------------------------------------------
    // Severity
    // --------------------------------------------------------

    severity,

    // --------------------------------------------------------
    // Degradation
    // --------------------------------------------------------

    degraded:
      degradation.degraded,

    degradationReason:
      degradation.degradationReason,

    // --------------------------------------------------------
    // Noise
    // --------------------------------------------------------

    compactMode:
      noisePolicy.compactMode,

    suppressRecommendations:
      noisePolicy.suppressRecommendations,

    // --------------------------------------------------------
    // Escalation
    // --------------------------------------------------------

    escalationEligible:
      escalation.escalationEligible,

    escalationReason:
      escalation.escalationReason,
  };
}