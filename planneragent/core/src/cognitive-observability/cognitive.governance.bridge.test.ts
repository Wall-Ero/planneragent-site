// core/src/cognitive-observability/cognitive.governance.bridge.test.ts
// ============================================================
// PlannerAgent — Cognitive Governance Bridge Test V1
// Canonical Test
// ============================================================

import assert from "node:assert";

import {
  buildCognitiveGovernanceBridge,
} from "./cognitive.governance.bridge";

import type {
  CognitiveWorkflowMemorySnapshot,
} from "./cognitive.workflow.memory";

// ============================================================
// TEST INPUT
// ============================================================

const snapshot:
  CognitiveWorkflowMemorySnapshot = {

  recurringWorkflowScore: 0.8,

  operationalDependencyScore: 0.85,

  workflowStabilityScore: 0.9,

  shadowAiPersistenceScore: 0.7,

  crossOperationalDependencyScore: 0.82,

  constitutionalOperationalMaturity: 0.88,

  confidence: 0.91,

  signals: [
    "recurring_shadow_ai",
    "stable_ai_assisted_operations",
    "recurring_operational_dependency",
  ],
};

// ============================================================
// EXECUTE
// ============================================================

const result =
  buildCognitiveGovernanceBridge({

    observation: {

      observabilityLevel:
        "CRITICAL",

      cognitivePressure:
        "UNGOVERNED_AI_PRESSURE",

      recurringWorkflowDetected:
        true,

      operationalAiDependencyDetected:
        true,

      shadowAiDetected:
        true,

      governanceSignals: [
        "shadow_ai_usage_detected",
        "operational_ai_dependency_detected",
      ],

      confidence:
        0.92,
    },

    memory:
      snapshot,
  });

// ============================================================
// ASSERTIONS
// ============================================================

assert(
  result.governanceRelevant === true,
  "governance should be relevant"
);

assert(
  result.emergenceSignals.length > 0,
  "emergence signals should exist"
);

assert(
  result.dominantPressure !== "NONE",
  "dominant pressure should exist"
);

assert(
  result.constitutionalRisk === "HIGH",
  "constitutional risk should be HIGH"
);

assert(
  result.recommendedDomains.includes(
    "GRADUATE"
  ),
  "GRADUATE domain should emerge"
);

assert(
  result.recommendedDomains.includes(
    "CHARTER"
  ),
  "CHARTER domain should emerge"
);

assert(
  result.governanceConfidence > 0.7,
  "governance confidence should be high"
);

assert(
  result.shadowAiPersistence === true,
  "shadow AI persistence should be detected"
);

assert(
  result.operationalAiDependency === true,
  "operational dependency should be detected"
);

// ============================================================
// OUTPUT
// ============================================================

console.log("\n✅ TEST PASSED\n");

console.log(
  "Governance bridge remains constitutional:"
);

console.log("- observational");
console.log("- governance-relevant");
console.log("- non-authoritative");
console.log("- non-executive");
console.log("- non-activating");

console.log("\nDOMINANT PRESSURE:");
console.log(result.dominantPressure);

console.log("\nRECOMMENDED DOMAINS:");
console.log(result.recommendedDomains);

console.log("\nCONSTITUTIONAL RISK:");
console.log(result.constitutionalRisk);

console.log("\nSUMMARY:");
console.log(result.summary);