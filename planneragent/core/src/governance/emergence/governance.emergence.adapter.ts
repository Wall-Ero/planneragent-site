// core/src/governance/emergence/governance.emergence.adapter.ts
// ============================================================
// PlannerAgent — Governance Emergence Adapter V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Transform runtime/orchestrator state into
// Governance Emergence evidence.
//
// This adapter:
// - extracts trust signals
// - extracts cognitive observability signals
// - extracts longitudinal stewardship signals
// - maps runtime → governance emergence evidence
//
// This adapter DOES NOT:
// - activate authority
// - upgrade plans
// - expand permissions
// - allocate budget
//
// ============================================================

import {
  evaluateGovernanceEmergence,
  type GovernanceEmergenceResult,
} from "./governance.emergence.engine";

// ============================================================
// INPUT CONTRACT
// ============================================================

export interface GovernanceEmergenceAdapterInput {
  plan: string;

  signals?: any;

  governance?: any;

  execution?: any;

  replay?: any;

  optimizer?: any;

  planner_narrative_state?: any;

  cognitive_observability?: {
    aiUsageDetected?: boolean;

    uncontrolledAiUsage?: boolean;

    recurringAiWorkflows?: boolean;

    operationalAiDependency?: number;
  };

  stewardship?: {
    recurringManualInterventions?: number;

    workflowFatigue?: number;

    processInstability?: number;

    exceptionRecurrence?: number;
  };
}

// ============================================================
// TRUST DOMAINS
// ============================================================

export interface GovernanceTrustDomains {
  advisoryTrust: number;

  executionTrust: number;

  delegationTrust: number;

  improvementTrust: number;
}

// ============================================================
// MAIN ADAPTER
// ============================================================

export function buildGovernanceEmergence(
  input: GovernanceEmergenceAdapterInput
): GovernanceEmergenceResult {

  const trustDomains =
    computeTrustDomains(input);

  return evaluateGovernanceEmergence({
    currentAuthority: input.plan as any,

    evidence: {

      // ------------------------------------------------------
      // Operational observation
      // ------------------------------------------------------

      observedOperationalEvents:
        input.execution?.capabilities?.length ?? 0,

      recurringOperationalPatterns:
        input.execution?.capabilities?.length ?? 0,

      topologyConfidence:
        input.signals?.topology_alignment ?? 0,

      anomalyRecurrence:
        input.governance?.anomaly ? 1 : 0,

      replayConsistency:
        input.replay?.similarity ?? 0,

      // ------------------------------------------------------
      // Cognitive observability
      // ------------------------------------------------------

      observedAiAssistedWorkflows:
        input.cognitive_observability?.recurringAiWorkflows
          ? 5
          : 0,

      shadowAiUsageDetected:
        input.cognitive_observability?.uncontrolledAiUsage
          ?? false,

      recurringPromptPatterns:
        input.cognitive_observability?.recurringAiWorkflows
          ? 5
          : 0,

      externalAiToolDependency:
        input.cognitive_observability?.operationalAiDependency
          ?? 0,

      aiGeneratedOperationalArtifacts:
        input.cognitive_observability?.aiUsageDetected
          ? 5
          : 0,

      ungovernedAiWorkflowCount:
        input.cognitive_observability?.uncontrolledAiUsage
          ? 3
          : 0,

      // ------------------------------------------------------
      // Advisory trust
      // ------------------------------------------------------

      advisoryOpportunitiesDetected:
        trustDomains.advisoryTrust > 0.6
          ? 5
          : 0,

      decisionAlignmentRate:
        trustDomains.advisoryTrust,

      optimizerConfidence:
        trustDomains.advisoryTrust,

      replayAgreementRate:
        input.replay?.similarity ?? 0,

      historicalDecisionMemoryDepth:
        25,

      // ------------------------------------------------------
      // Approved execution trust
      // ------------------------------------------------------

      repeatedHumanApprovedActions:
        trustDomains.executionTrust > 0.6
          ? 10
          : 0,

      microExecutionCandidates:
        input.execution?.capabilities?.length ?? 0,

      microExecutionSuccessRate:
        trustDomains.executionTrust,

      approvalPatternConsistency:
        trustDomains.executionTrust,

      rollbackCount:
        input.execution?.outcome === "FAILED"
          ? 1
          : 0,

      // ------------------------------------------------------
      // Delegated workflow trust
      // ------------------------------------------------------

      approvedWorkflowSequences:
        trustDomains.delegationTrust > 0.6
          ? 10
          : 0,

      successfulWorkflowSequences:
        input.execution?.outcome === "SUCCESS"
          ? 10
          : 5,

      crossSystemConsistency:
        trustDomains.delegationTrust,

      humanOverrideRate:
        0,

      stabilizationSuccessRate:
        input.planner_narrative_state?.recoveryPossible
          ? 1
          : 0.5,

      // ------------------------------------------------------
      // Improvement pressure
      // ------------------------------------------------------

      delegatedProcessRuns:
        input.stewardship?.recurringManualInterventions
          ?? 0,

      structuralFriction:
        input.stewardship?.workflowFatigue ?? 0,

      workflowFatigue:
        input.stewardship?.workflowFatigue ?? 0,

      manualInterventionFrequency:
        input.stewardship?.recurringManualInterventions
          ?? 0,

      exceptionRecurrence:
        input.stewardship?.exceptionRecurrence ?? 0,

      processInstability:
        input.stewardship?.processInstability ?? 0,

      measurableImprovementPotential:
        trustDomains.improvementTrust,

      // ------------------------------------------------------
      // Constitutional pressure
      // ------------------------------------------------------

      policyModificationPressure: false,

      autonomousGoalPressure: false,

      autonomousResourceAllocationPressure: false,

      humanRoleImpactDetected: false,
    },
  });
}

// ============================================================
// TRUST DOMAIN COMPUTATION
// ============================================================

function computeTrustDomains(
  input: GovernanceEmergenceAdapterInput
): GovernanceTrustDomains {

  // ----------------------------------------------------------
  // Advisory trust
  // ----------------------------------------------------------

  const advisoryTrust =
    clamp01(
      (
        (input.replay?.similarity ?? 0) * 0.35 +

        (input.optimizer?.best_score ?? 0) * 0.35 +

        (
          input.signals?.plan?.confidence ??
          0
        ) * 0.3
      )
    );

  // ----------------------------------------------------------
  // Execution trust
  // ----------------------------------------------------------

  const executionSuccess =
    input.execution?.capabilities?.filter(
      (x: any) => x.status === "EXECUTED"
    )?.length ?? 0;

  const executionTotal =
    input.execution?.capabilities?.length ?? 1;

  const executionTrust =
    clamp01(
      executionSuccess / executionTotal
    );

  // ----------------------------------------------------------
  // Delegation trust
  // ----------------------------------------------------------

  const delegationTrust =
    clamp01(
      (
        executionTrust * 0.4 +

        (
          input.planner_narrative_state?.recoveryPossible
            ? 1
            : 0
        ) * 0.3 +

        (
          input.signals?.topology_alignment ??
          0
        ) * 0.3
      )
    );

  // ----------------------------------------------------------
  // Improvement trust
  // ----------------------------------------------------------

  const improvementTrust =
    clamp01(
      (
        (
          input.stewardship?.workflowFatigue ??
          0
        ) * 0.25 +

        (
          input.stewardship?.processInstability ??
          0
        ) * 0.25 +

        (
          input.stewardship?.exceptionRecurrence ??
          0
        ) * 0.25 +

        (
          input.stewardship?.recurringManualInterventions ??
          0
        ) * 0.25
      )
    );

  return {
    advisoryTrust: round3(advisoryTrust),

    executionTrust: round3(executionTrust),

    delegationTrust: round3(delegationTrust),

    improvementTrust: round3(improvementTrust),
  };
}

// ============================================================
// HELPERS
// ============================================================

function clamp01(
  value: number
): number {
  return Math.max(
    0,
    Math.min(1, value)
  );
}

function round3(
  value: number
): number {
  return Math.round(value * 1000) / 1000;
}