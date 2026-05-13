// core/src/cognition/planner.cognition.ts
// ======================================================
// PlannerAgent — Operational Cognition Engine v1
// Canonical Source of Truth
// ======================================================
//
// PURPOSE
// ------------------------------------------------------
// Transform operational runtime state into
// deterministic operational cognition.
//
// This layer:
//
// - interprets operational reality
// - determines execution posture
// - evaluates operational trust
// - classifies urgency
// - structures semantic cognition
//
// It DOES NOT:
//
// - optimize
// - execute
// - authorize
// - rank scenarios
// - generate narratives
//
// ======================================================

import type {
  PlannerOperationalCognition,
  OperationalCondition,
  ExecutionPosture,
  OperationalTrust,
  InterventionUrgency,
} from "./planner.cognition.types";

import type {
  RealityStateEvidence,
} from "../reality/reality.state";

// ======================================================
// INPUT
// ======================================================

export type BuildPlannerCognitionInput = {

  // ---------------------------------------------------
  // Reality
  // ---------------------------------------------------

  reality: RealityStateEvidence;

  // ---------------------------------------------------
  // Governance
  // ---------------------------------------------------

  executionAllowed: boolean;

  governanceState: string;

  // ---------------------------------------------------
  // Runtime
  // ---------------------------------------------------

  anomalyDetected: boolean;

  hasBlockingMismatch: boolean;

  // ---------------------------------------------------
  // Pressure
  // ---------------------------------------------------

  pressureLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  // ---------------------------------------------------
  // Execution
  // ---------------------------------------------------

  correctionEffect?:
    | "NONE"
    | "PARTIAL"
    | "FULL";

 executionOutcome?:
  | "NONE"
  | "PARTIAL"
  | "SUCCESS"
  | "FAILED"
  | "BLOCKED";
};

// ======================================================
// OPERATIONAL CONDITION
// ======================================================

function resolveOperationalCondition(
  input: BuildPlannerCognitionInput
): OperationalCondition {

  if (
    input.pressureLevel === "HIGH"
    && input.hasBlockingMismatch
  ) {
    return "CRITICAL";
  }

  switch (input.reality.realityState) {

    case "UNSTABLE":
      return "UNSTABLE";

    case "SHIFTING":
      return "SHIFTING";

    case "ASSUMED":
      return "UNSTABLE";

    default:
      return "STABLE";
  }
}

// ======================================================
// EXECUTION POSTURE
// ======================================================

function resolveExecutionPosture(
  input: BuildPlannerCognitionInput
): ExecutionPosture {

  if (
    input.hasBlockingMismatch
  ) {
    return "CONTAIN";
  }

  if (
    input.reality.realityState === "UNSTABLE"
  ) {
    return "STABILIZE";
  }

  if (
    input.executionAllowed
    && input.pressureLevel === "HIGH"
  ) {
    return "EXECUTE";
  }

  if (
    input.executionAllowed
  ) {
    return "ADVISE";
  }

  return "OBSERVE";
}

// ======================================================
// OPERATIONAL TRUST
// ======================================================

function resolveOperationalTrust(
  reality: RealityStateEvidence
): OperationalTrust {

  if (
    reality.realityState === "ASSUMED"
  ) {
    return "LOW";
  }

  if (
    reality.realityState === "UNSTABLE"
  ) {
    return "LOW";
  }

  if (
    reality.realityState === "SHIFTING"
  ) {
    return "MEDIUM";
  }

  return "HIGH";
}

// ======================================================
// INTERVENTION URGENCY
// ======================================================

function resolveInterventionUrgency(
  input: BuildPlannerCognitionInput
): InterventionUrgency {

  if (
    input.pressureLevel === "HIGH"
    || input.reality.realityState === "UNSTABLE"
    || input.hasBlockingMismatch
  ) {
    return "HIGH";
  }

  if (
    input.pressureLevel === "MEDIUM"
    || input.reality.realityState === "SHIFTING"
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

// ======================================================
// SEMANTIC SIGNALS
// ======================================================

function buildSemanticSignals(
  input: BuildPlannerCognitionInput
): string[] {

  const out: string[] = [];

  out.push(
    `reality:${input.reality.realityState}`
  );

  out.push(
    `pressure:${input.pressureLevel}`
  );

  if (input.hasBlockingMismatch) {
    out.push(
      "inventory:blocking_mismatch"
    );
  }

  if (input.anomalyDetected) {
    out.push(
      "runtime:anomaly_detected"
    );
  }

  for (const r of input.reality.reasons ?? []) {
    out.push(`reality_reason:${r}`);
  }

  return out;
}

// ======================================================
// REASONING
// ======================================================

function buildReasoning(
  input: BuildPlannerCognitionInput
): string[] {

  const reasoning: string[] = [];

  switch (input.reality.realityState) {

    case "ASSUMED":
      reasoning.push(
        "Operational reality depends heavily on assumptions."
      );
      break;

    case "SHIFTING":
      reasoning.push(
        "Operational behavior is progressively diverging."
      );
      break;

    case "UNSTABLE":
      reasoning.push(
        "Operational behavior is unstable or inconsistent."
      );
      break;

    case "STABLE":
      reasoning.push(
        "Operational behavior is coherent and stable."
      );
      break;
  }

  if (input.hasBlockingMismatch) {
    reasoning.push(
      "Inventory reconciliation contains blocking mismatches."
    );
  }

  if (input.anomalyDetected) {
    reasoning.push(
      "Runtime anomalies require operational attention."
    );
  }

  return reasoning;
}

// ======================================================
// MAIN
// ======================================================

export function buildPlannerCognition(
  input: BuildPlannerCognitionInput
): PlannerOperationalCognition {

  const operationalCondition =
    resolveOperationalCondition(input);

  const executionPosture =
    resolveExecutionPosture(input);

  const operationalTrust =
    resolveOperationalTrust(input.reality);

  const interventionUrgency =
    resolveInterventionUrgency(input);

  const semanticSignals =
    buildSemanticSignals(input);

  const reasoning =
    buildReasoning(input);

  return {

    // -------------------------------------------------
    // Reality cognition
    // -------------------------------------------------

    realityState:
      input.reality.realityState,

    operationalCondition,

    operationalTrust,

    // -------------------------------------------------
    // Execution cognition
    // -------------------------------------------------

    executionPosture,

    interventionUrgency,

    // -------------------------------------------------
    // Governance cognition
    // -------------------------------------------------

    governanceState:
      input.governanceState,

    executionAllowed:
      input.executionAllowed,

    // -------------------------------------------------
    // Semantic cognition
    // -------------------------------------------------

    semanticSignals,

    reasoning,

    // -------------------------------------------------
    // Confidence
    // -------------------------------------------------

    confidence:
      input.reality.confidence,
  };
}