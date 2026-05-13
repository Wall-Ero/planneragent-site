// src/sandbox/narrative/plannerNarrative.ts
// ============================================================
// PlannerAgent — Governance Narrative Layer
// Canonical Snapshot · Source of Truth · Chat WIP
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// This layer transforms operational runtime state into
// governance-aware planner cognition.
//
// It DOES NOT:
// - optimize
// - rank scenarios
// - execute actions
// - generate AI narratives
//
// It DOES:
// - interpret governance state
// - classify operational condition
// - determine execution posture
// - structure planner cognition
// - provide deterministic semantic framing
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// PlannerAgent must reason like an operational planner,
// not like an optimizer.
//
// Narrative must emerge from:
//
// reality
// → governance state
// → operational posture
// → execution authority
//
// NOT:
//
// optimizer action
// → text generation
//
// ============================================================

export type ExecutionPosture =
  | "OBSERVE"
  | "ADVISE"
  | "EXECUTE"
  | "CONTAIN"
  | "STABILIZE";

export type OperationalCondition =
  | "ALIGNED"
  | "DRIFTING"
  | "UNSTABLE"
  | "CRITICAL";

export type ReconciliationStatus =
  | "NOT_REQUIRED"
  | "PARTIAL"
  | "FULL";

export type ExecutionOutcome =
  | "NONE"
  | "PARTIAL"
  | "SUCCESS"
  | "FAILED";

export interface PlannerNarrativeState {

  // ----------------------------------------------------------
  // Governance cognition
  // ----------------------------------------------------------

  planningMode: string;

  governanceState: string;

  executionPosture: ExecutionPosture;

  operationalCondition: OperationalCondition;

  // ----------------------------------------------------------
  // Pressure & authority
  // ----------------------------------------------------------

  pressureLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

 authorityLevel:
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

  // ----------------------------------------------------------
  // Runtime state
  // ----------------------------------------------------------

  anomalyDetected: boolean;

  executionAllowed: boolean;

  reconciliationStatus?: ReconciliationStatus;

  executionOutcome?: ExecutionOutcome;

  // ----------------------------------------------------------
  // Semantic operational framing
  // ----------------------------------------------------------

  realityAligned: boolean;

  executionActive: boolean;

  recoveryPossible: boolean;

  stabilizationRequired: boolean;
}

export interface BuildPlannerNarrativeInput {

  planningMode: string;

  pressureLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  authorityLevel:
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

  anomalyDetected: boolean;

  executionAllowed: boolean;

  correctionEffect?:
    | "NONE"
    | "PARTIAL"
    | "FULL";

  executionOutcome?: ExecutionOutcome;

  hasBlockingMismatch?: boolean;

  realityScore?: number;
}

// ============================================================
// GOVERNANCE STATE RESOLUTION
// ============================================================

function resolveGovernanceState(
  input: BuildPlannerNarrativeInput
): string {

  if (
    input.planningMode === "REALITY_CORRECTION"
    && input.hasBlockingMismatch
  ) {
    return "EXECUTION_DRIFT";
  }

  if (
    input.planningMode === "FLOW_STABILIZATION"
  ) {
    return "FLOW_DEGRADATION";
  }

  if (
    input.planningMode === "SUPPLY_RISK_RESPONSE"
  ) {
    return "SUPPLY_RISK_ESCALATION";
  }

  if (
    input.planningMode === "CONTAINMENT"
  ) {
    return "CONTAINMENT_MODE";
  }

  return "OPERATIONAL_OBSERVATION";
}

// ============================================================
// OPERATIONAL CONDITION
// ============================================================

function resolveOperationalCondition(
  input: BuildPlannerNarrativeInput
): OperationalCondition {

  if (
    input.pressureLevel === "HIGH"
    && input.hasBlockingMismatch
  ) {
    return "CRITICAL";
  }

  if (
    input.anomalyDetected
  ) {
    return "DRIFTING";
  }

  if (
    input.realityScore !== undefined
    && input.realityScore < 0.7
  ) {
    return "UNSTABLE";
  }

  return "ALIGNED";
}

// ============================================================
// EXECUTION POSTURE
// ============================================================

function resolveExecutionPosture(
  input: BuildPlannerNarrativeInput
): ExecutionPosture {

  if (
    input.executionAllowed
    && input.pressureLevel === "HIGH"
  ) {
    return "EXECUTE";
  }

  if (
    input.hasBlockingMismatch
  ) {
    return "CONTAIN";
  }

  if (
    input.planningMode === "FLOW_STABILIZATION"
  ) {
    return "STABILIZE";
  }

  if (
    input.executionAllowed
  ) {
    return "ADVISE";
  }

  return "OBSERVE";
}

// ============================================================
// RECONCILIATION STATUS
// ============================================================

function resolveReconciliationStatus(
  correctionEffect?: string
): ReconciliationStatus {

  switch (correctionEffect) {

    case "FULL":
      return "FULL";

    case "PARTIAL":
      return "PARTIAL";

    default:
      return "NOT_REQUIRED";
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildPlannerNarrativeState(
  input: BuildPlannerNarrativeInput
): PlannerNarrativeState {

  const governanceState =
    resolveGovernanceState(input);

  const operationalCondition =
    resolveOperationalCondition(input);

  const executionPosture =
    resolveExecutionPosture(input);

  const reconciliationStatus =
    resolveReconciliationStatus(
      input.correctionEffect
    );

  const realityAligned =
    !input.hasBlockingMismatch;

  const executionActive =
    input.executionAllowed;

  const recoveryPossible =
    reconciliationStatus === "FULL";

  const stabilizationRequired =
    operationalCondition === "UNSTABLE"
    || operationalCondition === "CRITICAL";

  return {

    planningMode:
      input.planningMode,

    governanceState,

    executionPosture,

    operationalCondition,

    pressureLevel:
      input.pressureLevel,

    authorityLevel:
      input.authorityLevel,

    anomalyDetected:
      input.anomalyDetected,

    executionAllowed:
      input.executionAllowed,

    reconciliationStatus,

    executionOutcome:
      input.executionOutcome,

    realityAligned,

    executionActive,

    recoveryPossible,

    stabilizationRequired
  };
}