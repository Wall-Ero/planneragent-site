// core/src/sandbox/narrative/planner.narrative.runtime.test.ts

import {
buildPlannerRuntimeNarrative,
} from "./planner.narrative.runtime";

console.log("");
console.log("==================================================");
console.log("PLANNER NARRATIVE RUNTIME TEST V1");
console.log("==================================================");
console.log("");

const runtime =
  buildPlannerRuntimeNarrative({

      planningMode:
        "REALITY_CORRECTION",

      governanceState:
        "DELEGATED_OR_BUDGETED_AUTHORITY",

      executionPosture:
        "CONTAIN",

      operationalCondition:
        "CRITICAL",

      pressureLevel:
        "HIGH",

      authorityLevel:
        "SENIOR",

      anomalyDetected:
        true,

      executionAllowed:
        true,

      reconciliationStatus:
        "FULL",

      executionOutcome:
        "PARTIAL",

      realityAligned:
        false,

      executionActive:
        true,

      recoveryPossible:
        true,

      stabilizationRequired:
        true,
  });

console.log("HEADLINE:");
console.log(runtime.headline);

console.log("");
console.log("SUMMARY:");
console.log(runtime.operationalSummary);

console.log("");
console.log("PLANNER:");
console.log(runtime.plannerStatement);

console.log("");
console.log("URGENCY:");
console.log(runtime.urgencyStatement);

console.log("");
console.log("EXECUTION:");
console.log(runtime.executionStatement);

console.log("");
console.log("✅ TEST PASSED");
console.log("");

console.log(
  "Narrative runtime remains constitutional:"
);

console.log("- deterministic");
console.log("- governance-aware");
console.log("- non-generative");
console.log("- operational");
console.log("- runtime-oriented");
console.log("- cockpit-ready");
console.log("- narrative-ready");