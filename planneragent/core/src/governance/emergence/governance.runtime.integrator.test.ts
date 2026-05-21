// core/src/governance/emergence/governance.runtime.integrator.test.ts
// ============================================================
// PlannerAgent — Governance Runtime Integrator Test V1
// Canonical Validation
// ============================================================

import {
  integrateGovernanceRuntime,
} from "./governance.runtime.integrator";

import type {
  GovernanceEmergenceResult,
} from "./governance.emergence.engine";

import type {
  GovernanceReviewRecommendation,
} from "./governance.review.engine";

import type {
  CognitiveGovernanceBridgeResult,
} from "../../cognitive-observability/cognitive.governance.bridge";

// ============================================================
// TEST
// ============================================================

console.log("");
console.log("==================================================");
console.log("GOVERNANCE RUNTIME INTEGRATOR TEST V1");
console.log("==================================================");
console.log("");

// ============================================================
// MOCK — EMERGENCE
// ============================================================

const emergence:
  GovernanceEmergenceResult = {

  currentAuthority:
    "VISION",

  pressures: [

    {
      pressure:
        "AI_GOVERNANCE_PRESSURE",

      domain:
        "COGNITIVE_OBSERVABILITY",

      severity:
        "HIGH",

      recommendedAuthority:
        "GRADUATE",

      activationRequired:
        true,

      activationRequirement:
        "HUMAN_REVIEW_REQUIRED",

        reasons: [
        "shadow_ai_usage_detected",
      ],

      suggestedReview:
        "Observed AI-assisted operational behavior suggests governance review.",
    },

    {
      pressure:
        "DELEGATION_PRESSURE",

      domain:
        "DELEGATED_PROCESS_STEWARDSHIP",

      severity:
        "CRITICAL",

      recommendedAuthority:
        "SENIOR",

      activationRequired:
        true,

      activationRequirement:
        "HUMAN_APPROVAL_REQUIRED",

      reasons: [
        "stable_cross_system_execution",
      ],

      suggestedReview:
        "Delegated operational stewardship may require review.",
    },

    {
      pressure:
        "CONSTITUTIONAL_PRESSURE",

      domain:
        "CONSTITUTIONAL_BOUNDARY",

      severity:
        "CRITICAL",

      recommendedAuthority:
        "CHARTER",

      activationRequired:
        true,

      activationRequirement:
        "BOARD_CHARTER_REQUIRED",

      reasons: [
        "human_role_impact_detected",
      ],

      suggestedReview:
        "Constitutional review required.",
    },
  ],

  dominantPressure:
    "CONSTITUTIONAL_PRESSURE",

  activationAlwaysHuman:
    true,

  emergenceSummary: [
    "pressure:CONSTITUTIONAL_PRESSURE",
  ],

  governanceConfidence:
    0.92,

  trustDomains: {

    advisoryTrust:
      0.84,

    executionTrust:
      0.79,

    delegationTrust:
      0.93,

    improvementTrust:
      0.71,

    constitutionalTrust:
      0.9,
  },

  maturity: {

    episodic:
      false,

    emerging:
      true,

    stable:
      true,

    structural:
      true,
  },

  review: {

    recommended:
      true,

    reviewDomain:
      "CHARTER_REVIEW",

    severity:
      "CRITICAL",

    currentAuthority:
      "VISION",

    recommendedAuthority:
      "CHARTER",

    reasons: [
      "constitutional_pressure_detected",
    ],

    summary:
      "Observed governance pressure suggests constitutional review.",

    humanReviewRequired:
      true,

    constitutionalBoundary:
      true,
  },
};

// ============================================================
// MOCK — COGNITIVE BRIDGE
// ============================================================

const cognitiveBridge:
  CognitiveGovernanceBridgeResult = {

  governanceRelevant:
    true,

  dominantPressure:
    "CONSTITUTIONAL_PRESSURE",

  constitutionalRisk:
    "HIGH",

  governanceConfidence:
    0.91,

  operationalAiDependency:
    true,

  shadowAiPersistence:
    true,

  recommendedDomains: [
    "GRADUATE",
    "JUNIOR",
    "SENIOR",
    "PRINCIPAL",
    "CHARTER",
  ],

  emergenceSignals: [

    {
      type:
        "AI_GOVERNANCE_PRESSURE",

      domain:
        "GRADUATE",

      severity:
        "HIGH",

      recurring:
        true,

      governanceRelevant:
        true,

      confidence:
        0.91,

      reasons: [
        "shadow_ai_usage_detected",
      ],

      description:
        "Recurring shadow AI usage detected.",
    },
  ],

  summary: [
    "constitutional_pressure_detected",
  ],
};

// ============================================================
// MOCK — REVIEW
// ============================================================

const review:
  GovernanceReviewRecommendation = {

  recommended:
    true,

  reviewDomain:
    "CHARTER_REVIEW",

  severity:
    "CRITICAL",

  currentAuthority:
    "VISION",

  recommendedAuthority:
    "CHARTER",

  reasons: [
    "constitutional_pressure_detected",
    "governance_boundary_review_required",
  ],

  summary:
    "Observed governance pressure suggests constitutional review.",

  humanReviewRequired:
    true,

  constitutionalBoundary:
    true,
};

// ============================================================
// EXECUTION
// ============================================================

const result =
  integrateGovernanceRuntime({

    emergence,

    cognitiveBridge,

    review,
  });

// ============================================================
// OUTPUT
// ============================================================

console.log("POSTURE:");
console.log(result.posture);

console.log("");
console.log("DOMINANT PRESSURE:");
console.log(result.dominantPressure);

console.log("");
console.log("REVIEW DOMAIN:");
console.log(result.reviewDomain);

console.log("");
console.log("CONSTITUTIONAL RISK:");
console.log(result.constitutionalRisk);

console.log("");
console.log("TRUST DOMAINS:");
console.log(result.trustDomains);

console.log("");
console.log("MATURITY:");
console.log(result.maturity);

console.log("");
console.log("SUMMARY:");
console.log(result.summary);

console.log("");

// ============================================================
// ASSERTIONS
// ============================================================

if (
  result.activationAllowed !== false
) {
  throw new Error(
    "Runtime integrator must NEVER activate authority."
  );
}

if (
  result.activationAlwaysHuman !== true
) {
  throw new Error(
    "Activation must remain human-controlled."
  );
}

if (
  result.posture !==
  "CONSTITUTIONAL_REVIEW_REQUIRED"
) {
  throw new Error(
    "Expected constitutional review posture."
  );
}

if (
  result.reviewDomain !==
  "CHARTER_REVIEW"
) {
  throw new Error(
    "Expected CHARTER_REVIEW domain."
  );
}

if (
  result.constitutionalRisk !==
  "HIGH"
) {
  throw new Error(
    "Expected HIGH constitutional risk."
  );
}

if (
  result.governanceRelevant !== true
) {
  throw new Error(
    "Expected governance relevant runtime."
  );
}

console.log("✅ TEST PASSED");
console.log("");

console.log(
  "Governance runtime remains constitutional:"
);

console.log(
  "- observational"
);

console.log(
  "- integrative"
);

console.log(
  "- non-authoritative"
);

console.log(
  "- non-self-activating"
);

console.log(
  "- runtime-oriented"
);

console.log(
  "- cockpit-ready"
);

console.log(
  "- narrative-ready"
);

console.log(
  "- constitutionally constrained"
);

console.log("");