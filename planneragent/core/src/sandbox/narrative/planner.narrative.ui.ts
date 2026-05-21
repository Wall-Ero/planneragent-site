// core/src/sandbox/narrative/planner.narrative.ui.ts
// ============================================================
// PlannerAgent — Narrative UI Semantic Layer V2
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Transforms operational runtime cognition into
// deterministic constitutional cockpit semantics.
//
// This layer DOES NOT:
// - render frontend UI
// - generate components
// - define styling systems
// - create animations
// - infer frontend behavior
//
// This layer DOES:
// - determine cockpit semantic posture
// - determine governance visibility semantics
// - determine constitutional pressure visibility
// - determine operational focus dominance
// - determine traceability visibility
// - determine runtime interaction posture
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Visual dominance must emerge from:
//
// operational reality
// governance pressure
// reconciliation state
// constitutional runtime posture
//
// NOT:
//
// frontend assumptions
// guessed UX behavior
// arbitrary visualization choices
//
// ============================================================

import type {
  PlannerNarrativeState,
  OperationalCondition,
} from "./plannerNarrative";

// ============================================================
// COCKPIT TONE
// ============================================================

export type CockpitTone =
  | "CALM"
  | "FOCUSED"
  | "ELEVATED"
  | "CRITICAL";

// ============================================================
// VISUAL PRESSURE
// ============================================================

export type VisualPressure =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

// ============================================================
// FOCUS ZONE
// ============================================================

export type FocusZone =
  | "PLAN"
  | "REALITY"
  | "EXECUTION"
  | "RECONCILIATION"
  | "GOVERNANCE"
  | "GOVERNANCE_PRESSURE";

// ============================================================
// CHAT PRIORITY
// ============================================================

export type ChatPriority =
  | "NORMAL"
  | "IMPORTANT"
  | "URGENT";

// ============================================================
// INTERACTION POLICY
// ============================================================

export type InteractionPolicy =
  | "NORMAL"
  | "REDUCE_NOISE"
  | "LOCK_EXECUTION"
  | "GUIDED_RECOVERY";

// ============================================================
// GOVERNANCE VISIBILITY
// ============================================================

export type GovernanceVisibilityMode =
  | "HIDDEN"
  | "PASSIVE"
  | "PRESSURE_VISIBLE"
  | "REVIEW_VISIBLE"
  | "CONSTITUTIONAL_ALERT";

// ============================================================
// TRACE PRIORITY
// ============================================================

export type TracePriority =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

// ============================================================
// UI STATE
// ============================================================

export interface PlannerNarrativeUiState {

  // ----------------------------------------------------------
  // Cockpit semantics
  // ----------------------------------------------------------

  cockpitTone: CockpitTone;

  visualPressure: VisualPressure;

  focusZone: FocusZone;

  // ----------------------------------------------------------
  // Runtime interaction semantics
  // ----------------------------------------------------------

  chatPriority: ChatPriority;

  interactionPolicy: InteractionPolicy;

  // ----------------------------------------------------------
  // Governance visibility
  // ----------------------------------------------------------

  governanceVisibility:
    GovernanceVisibilityMode;

  tracePriority:
    TracePriority;

  // ----------------------------------------------------------
  // Runtime semantic flags
  // ----------------------------------------------------------

  executionHighlight: boolean;

  stabilizationMode: boolean;

  recoveryVisible: boolean;

  governanceVisible: boolean;

  anomalyVisible: boolean;
}

// ============================================================
// COCKPIT TONE
// ============================================================

function resolveCockpitTone(
  condition: OperationalCondition
): CockpitTone {

  switch (condition) {

    case "STABLE":
      return "CALM";

    case "SHIFTING":
      return "FOCUSED";

    case "UNSTABLE":
      return "ELEVATED";

    case "CRITICAL":
      return "CRITICAL";

    default:
      return "FOCUSED";
  }
}

// ============================================================
// FOCUS ZONE
// ============================================================

function resolveFocusZone(
  state: PlannerNarrativeState
): FocusZone {

  if (
    state.governanceState !== "NORMAL"
  ) {
    return "GOVERNANCE_PRESSURE";
  }

  if (
    state.reconciliationStatus === "FULL"
    || state.reconciliationStatus === "PARTIAL"
  ) {
    return "RECONCILIATION";
  }

  if (
    state.executionPosture === "CONTAIN"
  ) {
    return "REALITY";
  }

  if (
    state.executionActive
  ) {
    return "EXECUTION";
  }

  return "PLAN";
}

// ============================================================
// CHAT PRIORITY
// ============================================================

function resolveChatPriority(
  pressure:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
): ChatPriority {

  switch (pressure) {

    case "HIGH":
      return "URGENT";

    case "MEDIUM":
      return "IMPORTANT";

    default:
      return "NORMAL";
  }
}

// ============================================================
// INTERACTION POLICY
// ============================================================

function resolveInteractionPolicy(
  state: PlannerNarrativeState
): InteractionPolicy {

  if (
    state.executionAllowed === false
  ) {
    return "LOCK_EXECUTION";
  }

  if (
    state.stabilizationRequired
  ) {
    return "GUIDED_RECOVERY";
  }

  if (
    state.operationalCondition === "CRITICAL"
  ) {
    return "REDUCE_NOISE";
  }

  return "NORMAL";
}

// ============================================================
// GOVERNANCE VISIBILITY
// ============================================================

function resolveGovernanceVisibility(
  state: PlannerNarrativeState
): GovernanceVisibilityMode {

  if (
    state.governanceState ===
    "CONSTITUTIONAL_REVIEW_REQUIRED"
  ) {
    return "CONSTITUTIONAL_ALERT";
  }

  if (
    state.governanceState !== "NORMAL"
  ) {
    return "REVIEW_VISIBLE";
  }

  if (
    state.anomalyDetected
  ) {
    return "PRESSURE_VISIBLE";
  }

  return "PASSIVE";
}

// ============================================================
// TRACE PRIORITY
// ============================================================

function resolveTracePriority(
  state: PlannerNarrativeState
): TracePriority {

  if (
    state.operationalCondition === "CRITICAL"
  ) {
    return "HIGH";
  }

  if (
    state.pressureLevel === "HIGH"
  ) {
    return "MEDIUM";
  }

  if (
    state.anomalyDetected
  ) {
    return "LOW";
  }

  return "NONE";
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildPlannerNarrativeUiState(
  state: PlannerNarrativeState
): PlannerNarrativeUiState {

  return {

    // --------------------------------------------------------
    // Cockpit semantics
    // --------------------------------------------------------

    cockpitTone:
      resolveCockpitTone(
        state.operationalCondition
      ),

    visualPressure:
      state.pressureLevel,

    focusZone:
      resolveFocusZone(state),

    // --------------------------------------------------------
    // Interaction semantics
    // --------------------------------------------------------

    chatPriority:
      resolveChatPriority(
        state.pressureLevel
      ),

    interactionPolicy:
      resolveInteractionPolicy(state),

    // --------------------------------------------------------
    // Governance semantics
    // --------------------------------------------------------

    governanceVisibility:
      resolveGovernanceVisibility(
        state
      ),

    tracePriority:
      resolveTracePriority(state),

    // --------------------------------------------------------
    // Runtime semantic flags
    // --------------------------------------------------------

    executionHighlight:
      state.executionActive,

    stabilizationMode:
      state.stabilizationRequired,

    recoveryVisible:
      state.recoveryPossible,

    governanceVisible:
      true,

    anomalyVisible:
      state.anomalyDetected,
  };
}