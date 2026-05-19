// core/src/governance/emergence/governance.emergence.engine.test.ts
// ============================================================
// PlannerAgent — Governance Emergence Engine Test V2
// Canonical Validation Test
// ============================================================

import {
  evaluateGovernanceEmergence,
} from "./governance.emergence.engine";

import type {
  GovernanceEmergenceTimeline,
} from "./governance.emergence.memory";

import type {
  CognitiveGovernanceBridgeResult,
} from "../../cognitive-observability/cognitive.governance.bridge";

// ============================================================
// TEST
// ============================================================

function runGovernanceEmergenceEngineTest() {

  console.log("");

  console.log(
    "=================================================="
  );

  console.log(
    "GOVERNANCE EMERGENCE ENGINE TEST V2"
  );

  console.log(
    "=================================================="
  );

  // ==========================================================
  // MOCK GOVERNANCE TIMELINE
  // ==========================================================

  const governanceTimeline:
  GovernanceEmergenceTimeline = {

  company_id:
    "WAL_SIM",

  totalSnapshots: 8,

  recurringPressures: [
    "AI_GOVERNANCE_PRESSURE",
    "DELEGATION_PRESSURE",
  ],

  dominantPressureFrequency: {
    AI_GOVERNANCE_PRESSURE: 3,
    DELEGATION_PRESSURE: 4,
    CONSTITUTIONAL_PRESSURE: 1,
  },

  constitutionalPressureDetected:
    true,

  stableDelegationDetected: true,

  governanceConfidenceTrend:
    "INCREASING",
};

  // ==========================================================
  // MOCK COGNITIVE BRIDGE
  // ==========================================================

  const cognitiveBridge:
  CognitiveGovernanceBridgeResult = {

  governanceRelevant: true,

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

      recurring: true,

      governanceRelevant: true,

      confidence: 0.91,

      reasons: [
        "shadow_ai_usage_detected",
      ],

      description:
        "Recurring shadow AI usage detected.",
    },

    {
      type:
        "DELEGATION_PRESSURE",

      domain:
        "SENIOR",

      severity:
        "HIGH",

      recurring: true,

      governanceRelevant: true,

      confidence: 0.93,

      reasons: [
        "stable_cross_system_execution",
      ],

      description:
        "Stable delegated operational execution observed.",
    },

    {
      type:
        "CONSTITUTIONAL_PRESSURE",

      domain:
        "CHARTER",

      severity:
        "CRITICAL",

      recurring: true,

      governanceRelevant: true,

      confidence: 0.98,

      reasons: [
        "human_role_impact_detected",
      ],

      description:
        "Potential constitutional authority boundary detected.",
    },
  ],

  summary: [
    "constitutional_pressure_detected",
  ],
};

  // ==========================================================
  // MAIN TEST
  // ==========================================================

  const result =
    evaluateGovernanceEmergence({

      currentAuthority:
        "VISION",

      governanceTimeline,

      cognitiveBridge,

      evidence: {

        // ----------------------------------------------------
        // VISION
        // ----------------------------------------------------

        observedOperationalEvents: 250,

        recurringOperationalPatterns: 12,

        topologyConfidence: 0.94,

        anomalyRecurrence: 0.18,

        replayConsistency: 0.91,

        // ----------------------------------------------------
        // COGNITIVE
        // ----------------------------------------------------

        observedAiAssistedWorkflows: 18,

        shadowAiUsageDetected: true,

        recurringPromptPatterns: 9,

        externalAiToolDependency: 0.77,

        aiGeneratedOperationalArtifacts: 14,

        ungovernedAiWorkflowCount: 6,

        // ----------------------------------------------------
        // ADVISORY
        // ----------------------------------------------------

        advisoryOpportunitiesDetected: 18,

        decisionAlignmentRate: 0.86,

        optimizerConfidence: 0.82,

        replayAgreementRate: 0.88,

        historicalDecisionMemoryDepth: 44,

        // ----------------------------------------------------
        // EXECUTION
        // ----------------------------------------------------

        repeatedHumanApprovedActions: 17,

        microExecutionCandidates: 12,

        microExecutionSuccessRate: 0.91,

        approvalPatternConsistency: 0.87,

        rollbackCount: 0,

        // ----------------------------------------------------
        // DELEGATION
        // ----------------------------------------------------

        approvedWorkflowSequences: 24,

        successfulWorkflowSequences: 22,

        crossSystemConsistency: 0.9,

        humanOverrideRate: 0.08,

        stabilizationSuccessRate: 0.93,

        // ----------------------------------------------------
        // IMPROVEMENT
        // ----------------------------------------------------

        delegatedProcessRuns: 120,

        structuralFriction: 0.72,

        workflowFatigue: 0.66,

        manualInterventionFrequency: 0.63,

        exceptionRecurrence: 0.59,

        processInstability: 0.31,

        measurableImprovementPotential: 0.81,

        // ----------------------------------------------------
        // CHARTER
        // ----------------------------------------------------

        policyModificationPressure: false,

        autonomousGoalPressure: false,

        autonomousResourceAllocationPressure: true,

        humanRoleImpactDetected: true,
      },
    });

  // ==========================================================
  // OUTPUT
  // ==========================================================

  console.log("");

  console.log(
    "DOMINANT PRESSURE:"
  );

  console.log(
    result.dominantPressure
  );

  console.log("");

  console.log(
    "TRUST DOMAINS:"
  );

  console.log(
    result.trustDomains
  );

  console.log("");

  console.log(
    "MATURITY:"
  );

  console.log(
    result.maturity
  );

  console.log("");

  console.log(
    "REVIEW:"
  );

  console.log(
    result.review
  );

  console.log("");

  console.log(
    "SUMMARY:"
  );

  console.log(
    result.emergenceSummary
  );

  // ==========================================================
  // CONSTITUTIONAL ASSERTIONS
  // ==========================================================

  if (
    result.activationAlwaysHuman !== true
  ) {

    throw new Error(
      "FAILED: activationAlwaysHuman must remain TRUE."
    );
  }

  if (
    result.currentAuthority !==
    "VISION"
  ) {

    throw new Error(
      "FAILED: authority must not auto-upgrade."
    );
  }

  if (
    !result.review
  ) {

    throw new Error(
      "FAILED: review recommendation expected."
    );
  }

  if (
    result.dominantPressure !==
    "CONSTITUTIONAL_PRESSURE"
  ) {

    throw new Error(
      "FAILED: dominant pressure mismatch."
    );
  }

  if (
    result.maturity.structural !== true
  ) {

    throw new Error(
      "FAILED: structural maturity expected."
    );
  }

  if (
    result.trustDomains
      .delegationTrust < 0.75
  ) {

    throw new Error(
      "FAILED: delegation trust too low."
    );
  }

  console.log("");

  console.log(
    "✅ TEST PASSED"
  );

  console.log("");

  console.log(
    "Governance emergence remains constitutional:"
  );

  console.log(
    "- observational"
  );

  console.log(
    "- longitudinal"
  );

  console.log(
    "- non-authoritative"
  );

  console.log(
    "- non-self-activating"
  );

  console.log(
    "- review-oriented"
  );

  console.log(
    "- constitutionally constrained"
  );

  console.log("");
}

// ============================================================
// RUN
// ============================================================

runGovernanceEmergenceEngineTest();