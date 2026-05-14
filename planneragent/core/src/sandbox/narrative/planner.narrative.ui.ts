// core/src/sandbox/narrative/planner.narrative.ui.ts
// ============================================================
// PlannerAgent — Narrative UI Semantic Layer
// Canonical Snapshot · Source of Truth · Chat WIP
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Transforms planner narrative cognition into
// deterministic cockpit behavior semantics.
//
// This layer DOES NOT:
// - render UI
// - generate frontend components
// - control styling systems
// - create animations
//
// This layer DOES:
// - determine cockpit semantic mode
// - determine visual pressure semantics
// - determine interaction posture
// - determine focus zones
// - determine operational urgency behavior
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// UI must emerge from operational reality,
// not from frontend preferences.
//
// Reality
// → cognition
// → narrative
// → UI semantics
//
// NOT:
//
// frontend state
// → guessed UX behavior
//
// ============================================================

import type {
  PlannerNarrativeState,
  ExecutionPosture,
  OperationalCondition,
} from "./plannerNarrative";

// ============================================================
// UI SEMANTIC TYPES
// ============================================================

export type CockpitTone =
  | "CALM"
  | "FOCUSED"
  | "ELEVATED"
  | "CRITICAL";

export type VisualPressure =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type FocusZone =
  | "PLAN"
  | "REALITY"
  | "EXECUTION"
  | "GOVERNANCE"
  | "RECONCILIATION";

export type ChatPriority =
  | "NORMAL"
  | "IMPORTANT"
  | "URGENT";

export type InteractionPolicy =
  | "NORMAL"
  | "REDUCE_NOISE"
  | "LOCK_EXECUTION"
  | "GUIDED_RECOVERY";

export interface PlannerNarrativeUiState {

  // ----------------------------------------------------------
  // Cockpit semantic state
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
  // Semantic runtime flags
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

  if (
    state.governanceState !== "NORMAL"
  ) {
    return "GOVERNANCE";
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