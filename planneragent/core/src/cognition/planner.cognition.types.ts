// core/src/cognition/planner.cognition.types.ts
// ======================================================
// PlannerAgent — Operational Cognition Types
// Canonical Source of Truth
// ======================================================

import type {
  RealityStabilityState,
} from "../reality/reality.state";

// ======================================================
// OPERATIONAL CONDITION
// ======================================================

export type OperationalCondition =
  | "STABLE"
  | "SHIFTING"
  | "UNSTABLE"
  | "CRITICAL";

// ======================================================
// EXECUTION POSTURE
// ======================================================

export type ExecutionPosture =
  | "OBSERVE"
  | "ADVISE"
  | "EXECUTE"
  | "CONTAIN"
  | "STABILIZE";

// ======================================================
// OPERATIONAL TRUST
// ======================================================

export type OperationalTrust =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

// ======================================================
// INTERVENTION URGENCY
// ======================================================

export type InterventionUrgency =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

// ======================================================
// COGNITION
// ======================================================

export type PlannerOperationalCognition = {

  // ---------------------------------------------------
  // Reality cognition
  // ---------------------------------------------------

  realityState: RealityStabilityState;

  operationalCondition: OperationalCondition;

  operationalTrust: OperationalTrust;

  // ---------------------------------------------------
  // Execution cognition
  // ---------------------------------------------------

  executionPosture: ExecutionPosture;

  interventionUrgency: InterventionUrgency;

  // ---------------------------------------------------
  // Governance cognition
  // ---------------------------------------------------

  governanceState: string;

  executionAllowed: boolean;

  // ---------------------------------------------------
  // Semantic cognition
  // ---------------------------------------------------

  semanticSignals: string[];

  reasoning: string[];

  // ---------------------------------------------------
  // Confidence
  // ---------------------------------------------------

  confidence: number;
};