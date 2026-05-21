// core/src/sandbox/narrative/planner.narrative.runtime.ts
// ============================================================
// PlannerAgent — Narrative Runtime Layer V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Transform semantic operational cognition into
// constitutional operational runtime narration.
//
// This layer DOES NOT:
// - optimize
// - rank actions
// - generate AI text
// - activate authority
// - execute workflows
// - invent operational state
//
// It DOES:
// - interpret semantic runtime state
// - structure operational narration
// - expose runtime governance language
// - expose cockpit-ready narrative state
// - expose SCM-readable operational interpretation
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Narrative is not generated.
//
// Narrative emerges deterministically from:
//
// reality
// → governance posture
// → operational condition
// → execution posture
// → constitutional pressure
//
// ============================================================

import type {
  PlannerNarrativeState,
  ExecutionPosture,
  OperationalCondition,
  ReconciliationStatus,
  ExecutionOutcome,
} from "./plannerNarrative";

// ============================================================
// COCKPIT TONE
// ============================================================

export type CockpitTone =
  | "CALM"
  | "ATTENTIVE"
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
  | "OBSERVATION"
  | "EXECUTION"
  | "RECONCILIATION"
  | "GOVERNANCE"
  | "STABILIZATION";

// ============================================================
// INTERACTION POLICY
// ============================================================

export type InteractionPolicy =
  | "PASSIVE"
  | "GUIDED"
  | "GUIDED_RECOVERY"
  | "ESCALATED_ATTENTION";

// ============================================================
// RUNTIME NARRATIVE
// ============================================================

export interface PlannerRuntimeNarrative {

  // ----------------------------------------------------------
  // Narrative
  // ----------------------------------------------------------

  headline: string;

  operationalSummary: string;

  plannerStatement: string;

  urgencyStatement: string;

  executionStatement: string;

  governanceStatement?: string;

  stabilizationStatement?: string;

  // ----------------------------------------------------------
  // Runtime UI
  // ----------------------------------------------------------

  cockpitTone:
    CockpitTone;

  visualPressure:
    VisualPressure;

  focusZone:
    FocusZone;

  interactionPolicy:
    InteractionPolicy;

  // ----------------------------------------------------------
  // Runtime visibility
  // ----------------------------------------------------------

  executionHighlight: boolean;

  stabilizationMode: boolean;

  recoveryVisible: boolean;

  governanceVisible: boolean;

  anomalyVisible: boolean;

  // ----------------------------------------------------------
  // Semantic runtime
  // ----------------------------------------------------------

  constitutionalRuntime: true;

  generatedByLlm: false;
}

// ============================================================
// MAIN RUNTIME
// ============================================================

export function buildPlannerRuntimeNarrative(
  state: PlannerNarrativeState
): PlannerRuntimeNarrative {

  const headline =
    buildHeadline(state);

  const operationalSummary =
    buildOperationalSummary(state);

  const plannerStatement =
    buildPlannerStatement(state);

  const urgencyStatement =
    buildUrgencyStatement(state);

  const executionStatement =
    buildExecutionStatement(state);

  const governanceStatement =
    buildGovernanceStatement(state);

  const stabilizationStatement =
    buildStabilizationStatement(state);

  const cockpitTone =
    resolveCockpitTone(state);

  const visualPressure =
    resolveVisualPressure(state);

  const focusZone =
    resolveFocusZone(state);

  const interactionPolicy =
    resolveInteractionPolicy(state);

  return {

    headline,

    operationalSummary,

    plannerStatement,

    urgencyStatement,

    executionStatement,

    governanceStatement,

    stabilizationStatement,

    cockpitTone,

    visualPressure,

    focusZone,

    interactionPolicy,

    executionHighlight:
      state.executionActive,

    stabilizationMode:
      state.stabilizationRequired,

    recoveryVisible:
      state.recoveryPossible,

    governanceVisible:
      state.governanceState !==
      "NONE",

    anomalyVisible:
      state.anomalyDetected,

    constitutionalRuntime:
      true,

    generatedByLlm:
      false,
  };
}

// ============================================================
// HEADLINE
// ============================================================

function buildHeadline(
  state: PlannerNarrativeState
): string {

  switch (
    state.operationalCondition
  ) {

    case "CRITICAL":
      return "Operational reality is unstable.";

    case "UNSTABLE":
      return "Operational divergence is increasing.";

    case "SHIFTING":
      return "Operational conditions are shifting.";

    default:
      return "Operational reality remains stable.";
  }
}

// ============================================================
// OPERATIONAL SUMMARY
// ============================================================

function buildOperationalSummary(
  state: PlannerNarrativeState
): string {

  if (
    state.anomalyDetected &&
    state.reconciliationStatus === "FULL"
  ) {

    return (
      "Inventory reconciliation detected blocking mismatches between ERP state and reconstructed operational reality. " +
      "Corrective execution remains capable of fully restoring alignment."
    );
  }

  if (
    state.anomalyDetected &&
    state.reconciliationStatus === "PARTIAL"
  ) {

    return (
      "Operational inconsistencies remain partially unresolved. " +
      "Recovery may require additional reconciliation activity."
    );
  }

  if (
    !state.realityAligned
  ) {

    return (
      "Operational reality is diverging from planned execution state."
    );
  }

  return (
    "Operational execution remains aligned with observed reality."
  );
}

// ============================================================
// PLANNER STATEMENT
// ============================================================

function buildPlannerStatement(
  state: PlannerNarrativeState
): string {

  switch (
    state.executionPosture
  ) {

    case "CONTAIN":

      return (
        "Containment posture is active to prevent further operational divergence."
      );

    case "STABILIZE":

      return (
        "Operational stabilization posture is active."
      );

    case "EXECUTE":

      return (
        "Governed operational execution is active."
      );

    case "ADVISE":

      return (
        "PlannerAgent is currently operating in advisory posture."
      );

    default:

      return (
        "PlannerAgent is currently observing operational reality."
      );
  }
}

// ============================================================
// URGENCY
// ============================================================

function buildUrgencyStatement(
  state: PlannerNarrativeState
): string {

  switch (
    state.pressureLevel
  ) {

    case "HIGH":

      return (
        "Decision pressure is increasing. Operational recovery windows may narrow over time."
      );

    case "MEDIUM":

      return (
        "Operational pressure is elevated and should continue to be monitored."
      );

    default:

      return (
        "Operational pressure currently remains controlled."
      );
  }
}

// ============================================================
// EXECUTION
// ============================================================

function buildExecutionStatement(
  state: PlannerNarrativeState
): string {

  switch (
    state.executionOutcome
  ) {

    case "SUCCESS":

      return (
        "Corrective execution completed successfully."
      );

    case "PARTIAL":

      return (
        "Corrective execution is active but operational stabilization is still ongoing."
      );

    case "FAILED":

      return (
        "Corrective execution did not fully restore operational alignment."
      );

    case "BLOCKED":

      return (
        "Execution remains constrained by governance or operational boundaries."
      );

    default:

      return (
        "No active corrective execution is currently required."
      );
  }
}

// ============================================================
// GOVERNANCE
// ============================================================

function buildGovernanceStatement(
  state: PlannerNarrativeState
): string | undefined {

  if (
    state.authorityLevel === "CHARTER"
  ) {

    return (
      "Constitutional governance review may be required before authority boundaries can evolve further."
    );
  }

  if (
    state.authorityLevel === "SENIOR"
  ) {

    return (
      "Delegated operational stewardship remains active within governed authority boundaries."
    );
  }

  if (
    state.authorityLevel === "JUNIOR"
  ) {

    return (
      "Operational recommendations remain governed through explicit human approval."
    );
  }

  return undefined;
}

// ============================================================
// STABILIZATION
// ============================================================

function buildStabilizationStatement(
  state: PlannerNarrativeState
): string | undefined {

  if (
    !state.stabilizationRequired
  ) {
    return undefined;
  }

  if (
    state.recoveryPossible
  ) {

    return (
      "Operational recovery remains achievable through reconciliation and controlled execution."
    );
  }

  return (
    "Operational stabilization may require additional intervention."
  );
}

// ============================================================
// COCKPIT TONE
// ============================================================

function resolveCockpitTone(
  state: PlannerNarrativeState
): CockpitTone {

  switch (
    state.operationalCondition
  ) {

    case "CRITICAL":
      return "CRITICAL";

    case "UNSTABLE":
      return "ELEVATED";

    case "SHIFTING":
      return "ATTENTIVE";

    default:
      return "CALM";
  }
}

// ============================================================
// VISUAL PRESSURE
// ============================================================

function resolveVisualPressure(
  state: PlannerNarrativeState
): VisualPressure {

  return state.pressureLevel;
}

// ============================================================
// FOCUS ZONE
// ============================================================

function resolveFocusZone(
  state: PlannerNarrativeState
): FocusZone {

  if (
    state.anomalyDetected
  ) {
    return "RECONCILIATION";
  }

  if (
    state.executionActive
  ) {
    return "EXECUTION";
  }

  if (
    state.stabilizationRequired
  ) {
    return "STABILIZATION";
  }

  return "OBSERVATION";
}

// ============================================================
// INTERACTION POLICY
// ============================================================

function resolveInteractionPolicy(
  state: PlannerNarrativeState
): InteractionPolicy {

  if (
    state.operationalCondition === "CRITICAL"
  ) {
    return "GUIDED_RECOVERY";
  }

  if (
    state.pressureLevel === "HIGH"
  ) {
    return "ESCALATED_ATTENTION";
  }

  if (
    state.pressureLevel === "MEDIUM"
  ) {
    return "GUIDED";
  }

  return "PASSIVE";
}
