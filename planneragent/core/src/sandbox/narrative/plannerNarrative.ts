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

import type {
  PlannerOperationalCognition,
} from "../../cognition/planner.cognition.types";

export type ExecutionPosture =
  | "OBSERVE"
  | "ADVISE"
  | "EXECUTE"
  | "CONTAIN"
  | "STABILIZE";

export type OperationalCondition =
  | "STABLE"
  | "SHIFTING"
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
  | "FAILED"
  | "BLOCKED";

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

  cognition: PlannerOperationalCognition;

  planningMode: string;

  authorityLevel:
    | "VISION"
    | "GRADUATE"
    | "JUNIOR"
    | "SENIOR"
    | "PRINCIPAL"
    | "CHARTER";

  reconciliationStatus?:
    | "NOT_REQUIRED"
    | "PARTIAL"
    | "FULL";

  executionOutcome?:
    | "NONE"
    | "PARTIAL"
    | "SUCCESS"
    | "FAILED"
    | "BLOCKED";
}

// ============================================================
// GOVERNANCE STATE RESOLUTION
// ============================================================


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
  input.cognition.governanceState;

const operationalCondition =
  input.cognition.operationalCondition;

const executionPosture =
  input.cognition.executionPosture;

  const reconciliationStatus =
  input.reconciliationStatus ?? "NOT_REQUIRED";

 const realityAligned =
  !input.cognition.semanticSignals.includes(
    "inventory:blocking_mismatch"
  );

  const executionActive =
    input.cognition.executionAllowed;

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
  input.cognition.interventionUrgency,

    authorityLevel:
      input.authorityLevel,

   anomalyDetected:
  input.cognition.semanticSignals.includes(
    "runtime:anomaly_detected"
  ),

    executionAllowed:
  input.cognition.executionAllowed,

    reconciliationStatus,

    executionOutcome:
      input.executionOutcome,

    realityAligned,

    executionActive,

    recoveryPossible,

    stabilizationRequired
  };
}