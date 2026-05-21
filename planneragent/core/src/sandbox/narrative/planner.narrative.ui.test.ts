// core/src/sandbox/narrative/planner.narrative.ui.test.ts
// ============================================================
// PlannerAgent — Narrative UI Semantic Layer Test V1
// Canonical Test
// ============================================================

import assert from "node:assert/strict";

import {
  buildPlannerNarrativeUiState,
} from "./planner.narrative.ui";

import type {
  PlannerNarrativeState,
} from "./plannerNarrative";

console.log("\n==================================================");
console.log("PLANNER NARRATIVE UI TEST V1");
console.log("==================================================\n");

// ============================================================
// TEST 1 — NORMAL OPERATION
// ============================================================

const normalState: PlannerNarrativeState = {

  planningMode: "NORMAL",

  governanceState: "NORMAL",

  executionPosture: "OBSERVE",

  operationalCondition: "STABLE",

  pressureLevel: "LOW",

  authorityLevel: "VISION",

  anomalyDetected: false,

  executionAllowed: false,

  reconciliationStatus: "NOT_REQUIRED",

  executionOutcome: "NONE",

  realityAligned: true,

  executionActive: false,

  recoveryPossible: false,

  stabilizationRequired: false,
};

const normalUi =
  buildPlannerNarrativeUiState(
    normalState
  );

assert.equal(
  normalUi.cockpitTone,
  "CALM"
);

assert.equal(
  normalUi.focusZone,
  "PLAN"
);

assert.equal(
  normalUi.chatPriority,
  "NORMAL"
);

assert.equal(
  normalUi.governanceVisibility,
  "PASSIVE"
);

assert.equal(
  normalUi.tracePriority,
  "NONE"
);

console.log("✅ TEST 1 — NORMAL OPERATION PASSED");

// ============================================================
// TEST 2 — REALITY CORRECTION
// ============================================================

const recoveryState: PlannerNarrativeState = {

  planningMode: "REALITY_CORRECTION",

  governanceState: "NORMAL",

  executionPosture: "CONTAIN",

  operationalCondition: "UNSTABLE",

  pressureLevel: "MEDIUM",

  authorityLevel: "JUNIOR",

  anomalyDetected: true,

  executionAllowed: true,

  reconciliationStatus: "PARTIAL",

  executionOutcome: "PARTIAL",

  realityAligned: false,

  executionActive: true,

  recoveryPossible: true,

  stabilizationRequired: true,
};

const recoveryUi =
  buildPlannerNarrativeUiState(
    recoveryState
  );

assert.equal(
  recoveryUi.cockpitTone,
  "ELEVATED"
);

assert.equal(
  recoveryUi.focusZone,
  "RECONCILIATION"
);

assert.equal(
  recoveryUi.interactionPolicy,
  "GUIDED_RECOVERY"
);

assert.equal(
  recoveryUi.governanceVisibility,
  "PRESSURE_VISIBLE"
);

assert.equal(
  recoveryUi.tracePriority,
  "LOW"
);

console.log("✅ TEST 2 — REALITY CORRECTION PASSED");

// ============================================================
// TEST 3 — GOVERNANCE PRESSURE
// ============================================================

const governancePressureState:
  PlannerNarrativeState = {

  planningMode: "NORMAL",

  governanceState:
    "REVIEW_RECOMMENDED",

  executionPosture: "OBSERVE",

  operationalCondition: "SHIFTING",

  pressureLevel: "HIGH",

  authorityLevel: "VISION",

  anomalyDetected: true,

  executionAllowed: false,

  reconciliationStatus: "NOT_REQUIRED",

  executionOutcome: "NONE",

  realityAligned: true,

  executionActive: false,

  recoveryPossible: false,

  stabilizationRequired: false,
};

const governanceUi =
  buildPlannerNarrativeUiState(
    governancePressureState
  );

assert.equal(
  governanceUi.focusZone,
  "GOVERNANCE_PRESSURE"
);

assert.equal(
  governanceUi.governanceVisibility,
  "REVIEW_VISIBLE"
);

assert.equal(
  governanceUi.tracePriority,
  "MEDIUM"
);

console.log("✅ TEST 3 — GOVERNANCE PRESSURE PASSED");

// ============================================================
// TEST 4 — CONSTITUTIONAL REVIEW
// ============================================================

const constitutionalState:
  PlannerNarrativeState = {

  planningMode: "REALITY_CORRECTION",

  governanceState:
    "CONSTITUTIONAL_REVIEW_REQUIRED",

  executionPosture: "CONTAIN",

  operationalCondition: "CRITICAL",

  pressureLevel: "HIGH",

  authorityLevel: "SENIOR",

  anomalyDetected: true,

  executionAllowed: true,

  reconciliationStatus: "FULL",

  executionOutcome: "PARTIAL",

  realityAligned: false,

  executionActive: true,

  recoveryPossible: true,

  stabilizationRequired: true,
};

const constitutionalUi =
  buildPlannerNarrativeUiState(
    constitutionalState
  );

assert.equal(
  constitutionalUi.cockpitTone,
  "CRITICAL"
);

assert.equal(
  constitutionalUi.governanceVisibility,
  "CONSTITUTIONAL_ALERT"
);

assert.equal(
  constitutionalUi.tracePriority,
  "HIGH"
);

assert.equal(
  constitutionalUi.chatPriority,
  "URGENT"
);

console.log("✅ TEST 4 — CONSTITUTIONAL REVIEW PASSED");

// ============================================================
// TEST 5 — EXECUTION LOCK
// ============================================================

const executionLockState:
  PlannerNarrativeState = {

  planningMode: "NORMAL",

  governanceState: "NORMAL",

  executionPosture: "OBSERVE",

  operationalCondition: "SHIFTING",

  pressureLevel: "MEDIUM",

  authorityLevel: "VISION",

  anomalyDetected: false,

  executionAllowed: false,

  reconciliationStatus: "NOT_REQUIRED",

  executionOutcome: "NONE",

  realityAligned: true,

  executionActive: false,

  recoveryPossible: false,

  stabilizationRequired: false,
};

const executionLockUi =
  buildPlannerNarrativeUiState(
    executionLockState
  );

assert.equal(
  executionLockUi.interactionPolicy,
  "LOCK_EXECUTION"
);

console.log("✅ TEST 5 — EXECUTION LOCK PASSED");

// ============================================================
// FINAL RESULT
// ============================================================

console.log("\n==================================================");
console.log("ALL TESTS PASSED");
console.log("==================================================\n");

console.log(
  "Narrative UI remains constitutional:"
);

console.log("- runtime-derived");
console.log("- governance-aware");
console.log("- cockpit-oriented");
console.log("- operationally deterministic");
console.log("- non-decorative");
console.log("- constitutionally constrained");
console.log("- trace-aware");
console.log("- governance-pressure-aware");