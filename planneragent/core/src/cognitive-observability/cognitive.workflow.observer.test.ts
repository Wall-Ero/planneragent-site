// core/src/cognitive-observability/cognitive.workflow.observer.test.ts
// ============================================================
// PlannerAgent — Cognitive Workflow Observer Test
// Canonical Runtime Validation
// ============================================================
//
// RUN:
// npx tsx src/cognitive-observability/cognitive.workflow.observer.test.ts
//
// ============================================================

import {
  observeCognitiveWorkflows,
} from "./cognitive.workflow.observer";

// ============================================================
// TEST INPUT
// ============================================================

const result = observeCognitiveWorkflows({
  evidence: {

    // --------------------------------------------------------
    // Prompt repetition
    // --------------------------------------------------------

    recurringPromptPatterns: 8,

    repeatedOperationalPrompts: 14,

    // --------------------------------------------------------
    // AI-generated artifacts
    // --------------------------------------------------------

    aiGeneratedOperationalArtifacts: 11,

    aiGeneratedInstructions: 9,

    aiGeneratedOperationalSummaries: 6,

    // --------------------------------------------------------
    // AI-assisted recovery
    // --------------------------------------------------------

    aiAssistedRecoveryFlows: 5,

    aiAssistedReconciliation: 4,

    // --------------------------------------------------------
    // External AI dependency
    // --------------------------------------------------------

    externalAiDependencyRate: 0.82,

    operationalSlowdownWithoutAi: true,

    // --------------------------------------------------------
    // Shadow AI
    // --------------------------------------------------------

    shadowAiUsageDetected: true,

    unmanagedExternalTools: 3,

    // --------------------------------------------------------
    // Cognitive repetition
    // --------------------------------------------------------

    recurringCognitiveWorkflows: 7,
  },
});

// ============================================================
// OUTPUT
// ============================================================

console.log("\n");
console.log("====================================================");
console.log("COGNITIVE OBSERVABILITY RESULT");
console.log("====================================================");
console.log("\n");

console.log(
  JSON.stringify(result, null, 2)
);

console.log("\n");
console.log("====================================================");
console.log("ASSERTIONS");
console.log("====================================================");
console.log("\n");

// ============================================================
// ASSERTIONS
// ============================================================

if (!result) {
  throw new Error(
    "RESULT_NOT_RETURNED"
  );
}

// ------------------------------------------------------------
// OBSERVABILITY
// ------------------------------------------------------------

if (
  typeof result.observabilityLevel !== "string"
) {
  throw new Error(
    "OBSERVABILITY_LEVEL_MISSING"
  );
}

if (
  typeof result.cognitivePressure !== "string"
) {
  throw new Error(
    "COGNITIVE_PRESSURE_MISSING"
  );
}

// ------------------------------------------------------------
// WORKFLOWS
// ------------------------------------------------------------

if (
  !Array.isArray(result.observedWorkflows)
) {
  throw new Error(
    "OBSERVED_WORKFLOWS_NOT_ARRAY"
  );
}

if (
  result.observedWorkflows.length === 0
) {
  throw new Error(
    "NO_WORKFLOWS_OBSERVED"
  );
}

// ------------------------------------------------------------
// GOVERNANCE SIGNALS
// ------------------------------------------------------------

if (
  !Array.isArray(result.governanceSignals)
) {
  throw new Error(
    "GOVERNANCE_SIGNALS_NOT_ARRAY"
  );
}

if (
  !result.governanceRelevant
) {
  throw new Error(
    "GOVERNANCE_RELEVANCE_NOT_DETECTED"
  );
}

// ------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------

if (
  !Array.isArray(result.summary)
) {
  throw new Error(
    "SUMMARY_NOT_ARRAY"
  );
}

if (
  result.summary.length === 0
) {
  throw new Error(
    "SUMMARY_EMPTY"
  );
}

// ------------------------------------------------------------
// CONFIDENCE
// ------------------------------------------------------------

if (
  typeof result.confidence !== "number"
) {
  throw new Error(
    "CONFIDENCE_NOT_NUMBER"
  );
}

if (
  result.confidence <= 0
) {
  throw new Error(
    "CONFIDENCE_INVALID"
  );
}

// ============================================================
// CONSTITUTIONAL ASSERTIONS
// ============================================================
//
// Observer layer MUST remain:
//
// - observational
// - non-governing
// - non-authoritative
// - non-executive
// - non-cognitive
//
// ============================================================

if (
  "authorityActivated" in result
) {
  throw new Error(
    "OBSERVER_MUST_NOT_ACTIVATE_AUTHORITY"
  );
}

if (
  "executionAllowed" in result
) {
  throw new Error(
    "OBSERVER_MUST_NOT_EXECUTE"
  );
}

if (
  "syntheticCognition" in result
) {
  throw new Error(
    "OBSERVER_MUST_NOT_SYNTHESIZE_COGNITION"
  );
}

if (
  "approved" in result
) {
  throw new Error(
    "OBSERVER_MUST_NOT_APPROVE"
  );
}

// ============================================================
// SUCCESS
// ============================================================

console.log("✅ TEST PASSED");
console.log("\n");

console.log(
  "Observer layer remains constitutional:"
);

console.log(
  "- observational"
);

console.log(
  "- non-governing"
);

console.log(
  "- non-authoritative"
);

console.log(
  "- non-executive"
);

console.log(
  "- non-cognitive"
);

console.log("\n");

console.log("====================================================");