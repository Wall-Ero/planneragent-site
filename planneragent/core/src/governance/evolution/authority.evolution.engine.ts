// core/src/governance/evolution/authority.evolution.engine.ts
// ============================================================
// PlannerAgent — Authority Evolution Engine V2
// Canonical Source of Truth · Multidimensional Authority Model
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Evaluate how operational trust evolves across:
//
// - observation
// - governed AI usage
// - advisory cognition
// - approved execution
// - delegated workflows
// - improvement authority
// - constitutional boundaries
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Authority evolution is NOT linear.
//
// PlannerAgent evolves through:
//
// capability trust domains
//
// not through:
//
// fixed sequential funnel transitions.
//
// ============================================================

export type AuthorityLevel =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

// ============================================================
// TRUST DOMAINS
// ============================================================

export type TrustDomain =
  | "OBSERVATION"
  | "AI_GOVERNANCE"
  | "ADVISORY"
  | "APPROVED_EXECUTION"
  | "DELEGATED_EXECUTION"
  | "IMPROVEMENT"
  | "CONSTITUTIONAL_BOUNDARY";

// ============================================================
// EVOLUTION PATHS
// ============================================================

export type EvolutionPath =
  | "NONE"

  // Observation paths
  | "VISION_TO_JUNIOR_ADVISORY"
  | "VISION_TO_JUNIOR_EXECUTION"

  // Graduate acceleration
  | "GRADUATE_TO_JUNIOR_ADVISORY"
  | "GRADUATE_TO_JUNIOR_EXECUTION"

  // Junior internal domains
  | "JUNIOR_ADVISORY_STRENGTHENING"
  | "JUNIOR_EXECUTION_STRENGTHENING"

  // Senior
  | "JUNIOR_TO_SENIOR"

  // Principal
  | "SENIOR_TO_PRINCIPAL"

  // Charter
  | "PRINCIPAL_TO_CHARTER_REVIEW";

// ============================================================
// EVOLUTION POSTURE
// ============================================================

export type EvolutionPosture =
  | "NO_EVOLUTION"
  | "OBSERVE_MORE"

  | "ADVISORY_READY"
  | "EXECUTION_READY"

  | "DELEGATION_READY"
  | "IMPROVEMENT_READY"

  | "CHARTER_REVIEW_REQUIRED";

// ============================================================
// DOMAIN SCORES
// ============================================================

export interface DomainTrustScores {

  // VISION
  observationTrust: number;

  // GRADUATE
  aiGovernanceTrust: number;

  // JUNIOR
  advisoryTrust: number;

  approvedExecutionTrust: number;

  // SENIOR
  delegatedExecutionTrust: number;

  // PRINCIPAL
  improvementTrust: number;

  // CHARTER
  constitutionalBoundaryPressure: number;
}

// ============================================================
// EVIDENCE
// ============================================================

export interface AuthorityEvolutionEvidence {

  // ----------------------------------------------------------
  // VISION — Observation trust
  // ----------------------------------------------------------

  observedOperationalEvents: number;

  replayConsistency: number;

  topologyConfidence: number;

  anomalyClassificationAccuracy: number;

  plannerVisibilityUsage: number;

  // ----------------------------------------------------------
  // GRADUATE — Governed AI usage
  // ----------------------------------------------------------

  governedAiSessions: number;

  aiWorkflowConsistency: number;

  repeatedAiPatterns: number;

  governedPromptUsage: number;

  aiToolDiversity: number;

  // ----------------------------------------------------------
  // JUNIOR — Advisory trust
  // ----------------------------------------------------------

  advisoryRecommendationsAccepted: number;

  advisoryRecommendationsRejected: number;

  decisionAlignmentRate: number;

  optimizerConfidence: number;

  replayAgreementRate: number;

  // ----------------------------------------------------------
  // JUNIOR — Approved execution trust
  // ----------------------------------------------------------

  approvedExecutions: number;

  successfulApprovedExecutions: number;

  failedApprovedExecutions: number;

  rollbackCount: number;

  microExecutionSuccessRate: number;

  // ----------------------------------------------------------
  // SENIOR — Delegated workflow trust
  // ----------------------------------------------------------

  delegatedWorkflowExecutions: number;

  successfulDelegatedExecutions: number;

  humanOverrideRate: number;

  stabilizationSuccessRate: number;

  crossSystemConsistency: number;

  // ----------------------------------------------------------
  // PRINCIPAL — Improvement trust
  // ----------------------------------------------------------

  successfulImprovements: number;

  measurableOperationalGain: number;

  budgetDisciplineScore: number;

  optimizationReliability: number;

  organizationalImpactRisk: number;

  // ----------------------------------------------------------
  // CHARTER — Constitutional pressure
  // ----------------------------------------------------------

  policyModificationPressure: boolean;

  autonomousGoalPressure: boolean;

  autonomousResourceAllocationPressure: boolean;
}

// ============================================================
// RESULT
// ============================================================

export interface AuthorityEvolutionResult {

  currentAuthority: AuthorityLevel;

  posture: EvolutionPosture;

  eligible: boolean;

  paths: EvolutionPath[];

  scores: DomainTrustScores;

  blockers: string[];

  evidenceSummary: string[];

  suggestedCapabilities: string[];

  governanceConfidence: number;
}

// ============================================================
// MAIN
// ============================================================

export function evaluateAuthorityEvolution(
  currentAuthority: AuthorityLevel,
  evidence: AuthorityEvolutionEvidence
): AuthorityEvolutionResult {

  const scores =
    computeDomainScores(evidence);

  const paths: EvolutionPath[] = [];

  const blockers: string[] = [];

  const evidenceSummary =
    buildEvidenceSummary(evidence);

  const suggestedCapabilities: string[] = [];

  // ==========================================================
  // VISION → JUNIOR ADVISORY
  // ==========================================================

  if (
    scores.advisoryTrust >= 0.72 &&
    evidence.decisionAlignmentRate >= 0.7
  ) {

    paths.push(
      currentAuthority === "GRADUATE"
        ? "GRADUATE_TO_JUNIOR_ADVISORY"
        : "VISION_TO_JUNIOR_ADVISORY"
    );

    suggestedCapabilities.push(
      "optimizer_advisory",
      "weighted_operational_recommendations",
      "scenario_tradeoff_analysis"
    );
  }

  // ==========================================================
  // VISION → JUNIOR EXECUTION
  // ==========================================================

  if (
    scores.approvedExecutionTrust >= 0.72 &&
    evidence.microExecutionSuccessRate >= 0.75
  ) {

    paths.push(
      currentAuthority === "GRADUATE"
        ? "GRADUATE_TO_JUNIOR_EXECUTION"
        : "VISION_TO_JUNIOR_EXECUTION"
    );

    suggestedCapabilities.push(
      "supplier_followup",
      "planning_sheet_update",
      "ticket_creation",
      "approved_email_execution"
    );
  }

  // ==========================================================
  // JUNIOR → SENIOR
  // ==========================================================

  if (
    scores.delegatedExecutionTrust >= 0.8 &&
    evidence.humanOverrideRate <= 0.15 &&
    evidence.crossSystemConsistency >= 0.8
  ) {

    paths.push("JUNIOR_TO_SENIOR");

    suggestedCapabilities.push(
      "delegated_workflow_execution",
      "cross_system_orchestration",
      "end_to_end_process_execution"
    );
  }

  // ==========================================================
  // SENIOR → PRINCIPAL
  // ==========================================================

  if (
    scores.improvementTrust >= 0.82 &&
    evidence.budgetDisciplineScore >= 0.75 &&
    evidence.organizationalImpactRisk <= 0.25
  ) {

    paths.push("SENIOR_TO_PRINCIPAL");

    suggestedCapabilities.push(
      "budgeted_improvement_execution",
      "automation_investment_allocation",
      "operational_optimization_authority"
    );
  }

  // ==========================================================
  // PRINCIPAL → CHARTER
  // ==========================================================

  if (
    evidence.policyModificationPressure ||
    evidence.autonomousGoalPressure ||
    evidence.autonomousResourceAllocationPressure
  ) {

    paths.push("PRINCIPAL_TO_CHARTER_REVIEW");

    suggestedCapabilities.push(
      "constitutional_review_required"
    );
  }

  // ==========================================================
  // BLOCKERS
  // ==========================================================

  if (evidence.rollbackCount >= 3) {
    blockers.push("rollback_frequency_high");
  }

  if (evidence.failedApprovedExecutions >= 3) {
    blockers.push("execution_failure_rate_high");
  }

  if (evidence.humanOverrideRate > 0.35) {
    blockers.push("human_override_rate_high");
  }

  if (evidence.organizationalImpactRisk > 0.45) {
    blockers.push("organizational_impact_requires_human_review");
  }

  // ==========================================================
  // POSTURE
  // ==========================================================

  let posture: EvolutionPosture =
    "NO_EVOLUTION";

  if (paths.includes("PRINCIPAL_TO_CHARTER_REVIEW")) {
    posture = "CHARTER_REVIEW_REQUIRED";
  }

  else if (paths.includes("SENIOR_TO_PRINCIPAL")) {
    posture = "IMPROVEMENT_READY";
  }

  else if (paths.includes("JUNIOR_TO_SENIOR")) {
    posture = "DELEGATION_READY";
  }

  else if (
    paths.includes("VISION_TO_JUNIOR_EXECUTION")
    || paths.includes("GRADUATE_TO_JUNIOR_EXECUTION")
  ) {
    posture = "EXECUTION_READY";
  }

  else if (
    paths.includes("VISION_TO_JUNIOR_ADVISORY")
    || paths.includes("GRADUATE_TO_JUNIOR_ADVISORY")
  ) {
    posture = "ADVISORY_READY";
  }

  else if (blockers.length > 0) {
    posture = "OBSERVE_MORE";
  }

  return {

    currentAuthority,

    posture,

    eligible:
      paths.length > 0,

    paths,

    scores,

    blockers,

    evidenceSummary,

    suggestedCapabilities,

    governanceConfidence:
      computeGovernanceConfidence(evidence),
  };
}

// ============================================================
// DOMAIN SCORING
// ============================================================

function computeDomainScores(
  e: AuthorityEvolutionEvidence
): DomainTrustScores {

  return {

    observationTrust:
      round3(
        clamp01(
          (
            normalizeCount(
              e.observedOperationalEvents,
              100
            ) * 0.2
            +
            e.replayConsistency * 0.3
            +
            e.topologyConfidence * 0.25
            +
            e.anomalyClassificationAccuracy * 0.15
            +
            e.plannerVisibilityUsage * 0.1
          )
        )
      ),

    aiGovernanceTrust:
      round3(
        clamp01(
          (
            normalizeCount(
              e.governedAiSessions,
              50
            ) * 0.25
            +
            e.aiWorkflowConsistency * 0.25
            +
            normalizeCount(
              e.repeatedAiPatterns,
              20
            ) * 0.2
            +
            e.governedPromptUsage * 0.15
            +
            e.aiToolDiversity * 0.15
          )
        )
      ),

    advisoryTrust:
      round3(
        clamp01(
          (
            safeRate(
              e.advisoryRecommendationsAccepted,
              e.advisoryRecommendationsAccepted
              +
              e.advisoryRecommendationsRejected
            ) * 0.35
            +
            e.decisionAlignmentRate * 0.3
            +
            e.optimizerConfidence * 0.2
            +
            e.replayAgreementRate * 0.15
          )
        )
      ),

    approvedExecutionTrust:
      round3(
        clamp01(
          (
            safeRate(
              e.successfulApprovedExecutions,
              e.approvedExecutions
            ) * 0.45
            +
            e.microExecutionSuccessRate * 0.35
            +
            (
              1 -
              normalizeCount(
                e.rollbackCount,
                5
              )
            ) * 0.2
          )
        )
      ),

    delegatedExecutionTrust:
      round3(
        clamp01(
          (
            safeRate(
              e.successfulDelegatedExecutions,
              e.delegatedWorkflowExecutions
            ) * 0.4
            +
            (
              1 - e.humanOverrideRate
            ) * 0.25
            +
            e.stabilizationSuccessRate * 0.2
            +
            e.crossSystemConsistency * 0.15
          )
        )
      ),

    improvementTrust:
      round3(
        clamp01(
          (
            normalizeCount(
              e.successfulImprovements,
              10
            ) * 0.2
            +
            e.measurableOperationalGain * 0.3
            +
            e.budgetDisciplineScore * 0.3
            +
            e.optimizationReliability * 0.2
          )
        )
      ),

    constitutionalBoundaryPressure:
      (
        e.policyModificationPressure
        || e.autonomousGoalPressure
        || e.autonomousResourceAllocationPressure
      )
        ? 1
        : 0,
  };
}

// ============================================================
// GOVERNANCE CONFIDENCE
// ============================================================

function computeGovernanceConfidence(
  e: AuthorityEvolutionEvidence
): number {

  const penalties =
    (
      normalizeCount(
        e.rollbackCount,
        5
      ) * 0.3
      +
      e.humanOverrideRate * 0.35
      +
      normalizeCount(
        e.failedApprovedExecutions,
        5
      ) * 0.35
    );

  return round3(
    clamp01(1 - penalties)
  );
}

// ============================================================
// EVIDENCE SUMMARY
// ============================================================

function buildEvidenceSummary(
  e: AuthorityEvolutionEvidence
): string[] {

  const out: string[] = [];

  if (e.replayConsistency >= 0.7) {
    out.push(
      "planner_observation_patterns_stable"
    );
  }

  if (e.governedAiSessions > 0) {
    out.push(
      "governed_ai_usage_detected"
    );
  }

  if (e.decisionAlignmentRate >= 0.7) {
    out.push(
      "planner_advisory_alignment_detected"
    );
  }

  if (e.microExecutionSuccessRate >= 0.75) {
    out.push(
      "micro_execution_reliability_detected"
    );
  }

  if (e.crossSystemConsistency >= 0.8) {
    out.push(
      "delegated_workflow_stability_detected"
    );
  }

  if (e.measurableOperationalGain >= 0.7) {
    out.push(
      "measurable_operational_improvement_detected"
    );
  }

  return out;
}

// ============================================================
// HELPERS
// ============================================================

function normalizeCount(
  value: number,
  target: number
): number {

  if (target <= 0) {
    return 0;
  }

  return clamp01(
    value / target
  );
}

function safeRate(
  num: number,
  den: number
): number {

  if (den <= 0) {
    return 0;
  }

  return clamp01(
    num / den
  );
}

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

  return Math.round(
    value * 1000
  ) / 1000;
}