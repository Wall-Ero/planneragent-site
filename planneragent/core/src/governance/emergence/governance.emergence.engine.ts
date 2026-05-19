// core/src/governance/emergence/governance.emergence.engine.ts
// ============================================================
// PlannerAgent — Governance Emergence Engine V2
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Detect governance pressure emerging from observed operational,
// cognitive, and longitudinal reality.
//
// This engine DOES NOT:
// - upgrade authority
// - activate authority
// - approve execution
// - certify AI usage
// - allocate budget
// - modify policy
//
// It DOES:
// - observe operational reality
// - observe cognitive / AI-assisted reality
// - integrate longitudinal governance memory
// - integrate cognitive governance bridge signals
// - detect governance pressure
// - classify emergence domains
// - evaluate trust domains independently
// - recommend human-governed authority review
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Authority emergence is system-observed.
// Authority activation is always human-controlled.
//
// ============================================================

import type {
  CognitiveGovernanceBridgeResult,
} from "../../cognitive-observability/cognitive.governance.bridge";

import type {
  GovernanceEmergenceTimeline,
} from "./governance.emergence.memory";

import {
  evaluateGovernanceReview,
  type GovernanceReviewRecommendation,
} from "./governance.review.engine";

// ============================================================
// TYPES
// ============================================================

export type AuthorityLevel =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

export type GovernancePressure =
  | "NONE"
  | "AI_GOVERNANCE_PRESSURE"
  | "ADVISORY_PRESSURE"
  | "EXECUTION_PRESSURE"
  | "DELEGATION_PRESSURE"
  | "IMPROVEMENT_PRESSURE"
  | "CONSTITUTIONAL_PRESSURE";

export type EmergenceDomain =
  | "OPERATIONAL_OBSERVATION"
  | "COGNITIVE_OBSERVABILITY"
  | "ADVISORY_TRUST"
  | "APPROVED_EXECUTION_TRUST"
  | "DELEGATED_PROCESS_STEWARDSHIP"
  | "STRUCTURAL_IMPROVEMENT"
  | "CONSTITUTIONAL_BOUNDARY";

export type EmergenceSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ActivationRequirement =
  | "NONE"
  | "HUMAN_REVIEW_REQUIRED"
  | "HUMAN_APPROVAL_REQUIRED"
  | "BUDGET_ASSIGNMENT_REQUIRED"
  | "BOARD_CHARTER_REQUIRED";

export interface GovernanceTrustDomains {
  advisoryTrust: number;
  executionTrust: number;
  delegationTrust: number;
  improvementTrust: number;
  constitutionalTrust: number;
}

export interface GovernanceMaturity {
  episodic: boolean;
  emerging: boolean;
  stable: boolean;
  structural: boolean;
}

export interface GovernanceEmergenceEvidence {
  observedOperationalEvents: number;
  recurringOperationalPatterns: number;
  topologyConfidence: number;
  anomalyRecurrence: number;
  replayConsistency: number;

  observedAiAssistedWorkflows: number;
  shadowAiUsageDetected: boolean;
  recurringPromptPatterns: number;
  externalAiToolDependency: number;
  aiGeneratedOperationalArtifacts: number;
  ungovernedAiWorkflowCount: number;

  advisoryOpportunitiesDetected: number;
  decisionAlignmentRate: number;
  optimizerConfidence: number;
  replayAgreementRate: number;
  historicalDecisionMemoryDepth: number;

  repeatedHumanApprovedActions: number;
  microExecutionCandidates: number;
  microExecutionSuccessRate: number;
  approvalPatternConsistency: number;
  rollbackCount: number;

  approvedWorkflowSequences: number;
  successfulWorkflowSequences: number;
  crossSystemConsistency: number;
  humanOverrideRate: number;
  stabilizationSuccessRate: number;

  delegatedProcessRuns: number;
  structuralFriction: number;
  workflowFatigue: number;
  manualInterventionFrequency: number;
  exceptionRecurrence: number;
  processInstability: number;
  measurableImprovementPotential: number;

  policyModificationPressure: boolean;
  autonomousGoalPressure: boolean;
  autonomousResourceAllocationPressure: boolean;
  humanRoleImpactDetected: boolean;
}

export interface GovernanceEmergenceSignal {
  pressure: GovernancePressure;
  domain: EmergenceDomain;
  severity: EmergenceSeverity;

  recommendedAuthority?: AuthorityLevel;

  activationRequired: boolean;
  activationRequirement: ActivationRequirement;

  reasons: string[];
  suggestedReview: string;
}

export interface GovernanceEmergenceResult {
  currentAuthority: AuthorityLevel;

  pressures: GovernanceEmergenceSignal[];

  dominantPressure: GovernancePressure;

  activationAlwaysHuman: true;

  trustDomains: GovernanceTrustDomains;

  maturity: GovernanceMaturity;

  review?: GovernanceReviewRecommendation;

  emergenceSummary: string[];

  governanceConfidence: number;
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function evaluateGovernanceEmergence(params: {
  currentAuthority: AuthorityLevel;
  evidence: GovernanceEmergenceEvidence;

  governanceTimeline?: GovernanceEmergenceTimeline | null;

  cognitiveBridge?: CognitiveGovernanceBridgeResult | null;
}): GovernanceEmergenceResult {

  const {
    currentAuthority,
    evidence,
    governanceTimeline,
    cognitiveBridge,
  } = params;

  const pressures: GovernanceEmergenceSignal[] = [];

  pushIfPresent(
    pressures,
    evaluateAiGovernancePressure(evidence)
  );

  pushIfPresent(
    pressures,
    evaluateAdvisoryPressure(evidence)
  );

  pushIfPresent(
    pressures,
    evaluateExecutionPressure(evidence)
  );

  pushIfPresent(
    pressures,
    evaluateDelegationPressure(evidence)
  );

  pushIfPresent(
    pressures,
    evaluateImprovementPressure(evidence)
  );

  pushIfPresent(
    pressures,
    evaluateConstitutionalPressure(evidence)
  );

  if (cognitiveBridge) {
    pressures.push(
      ...mapCognitiveBridgeToEmergenceSignals(
        cognitiveBridge
      )
    );
  }

  const trustDomains =
    computeTrustDomains(
      evidence,
      cognitiveBridge
    );

  const maturity =
    computeGovernanceMaturity(
      pressures,
      governanceTimeline,
      trustDomains
    );

  const dominantPressure =
    resolveDominantPressure(pressures);

  const review =
    governanceTimeline
      ? evaluateGovernanceReview({
          currentAuthority,
          timeline: governanceTimeline,
        })
      : undefined;

  return {
    currentAuthority,

    pressures:
      dedupePressures(pressures),

    dominantPressure,

    activationAlwaysHuman: true,

    trustDomains,

    maturity,

    review,

    emergenceSummary:
      buildEmergenceSummary(
        pressures,
        maturity,
        review
      ),

    governanceConfidence:
      computeGovernanceConfidence(
        evidence,
        trustDomains,
        cognitiveBridge
      ),
  };
}

// ============================================================
// PRESSURE EVALUATORS
// ============================================================

function evaluateAiGovernancePressure(
  e: GovernanceEmergenceEvidence
): GovernanceEmergenceSignal | null {

  const score =
    normalizeCount(e.observedAiAssistedWorkflows, 20) * 0.25 +
    normalizeCount(e.recurringPromptPatterns, 10) * 0.2 +
    e.externalAiToolDependency * 0.2 +
    normalizeCount(e.aiGeneratedOperationalArtifacts, 20) * 0.15 +
    normalizeCount(e.ungovernedAiWorkflowCount, 10) * 0.2;

  if (!e.shadowAiUsageDetected && score < 0.45) {
    return null;
  }

  const reasons: string[] = [];

  if (e.shadowAiUsageDetected) {
    reasons.push("shadow_ai_usage_detected");
  }

  if (e.recurringPromptPatterns > 0) {
    reasons.push("recurring_ai_assisted_workflows");
  }

  if (e.ungovernedAiWorkflowCount > 0) {
    reasons.push("ungoverned_ai_workflows_observed");
  }

  return {
    pressure: "AI_GOVERNANCE_PRESSURE",
    domain: "COGNITIVE_OBSERVABILITY",
    severity: severityFromScore(score),
    recommendedAuthority: "GRADUATE",
    activationRequired: true,
    activationRequirement: "HUMAN_REVIEW_REQUIRED",
    reasons,
    suggestedReview:
      "Observed AI-assisted operational behavior suggests that governed human AI usage should be reviewed.",
  };
}

function evaluateAdvisoryPressure(
  e: GovernanceEmergenceEvidence
): GovernanceEmergenceSignal | null {

  const score =
    normalizeCount(e.advisoryOpportunitiesDetected, 20) * 0.25 +
    e.decisionAlignmentRate * 0.25 +
    e.optimizerConfidence * 0.2 +
    e.replayAgreementRate * 0.2 +
    normalizeCount(e.historicalDecisionMemoryDepth, 50) * 0.1;

  if (score < 0.65) {
    return null;
  }

  return {
    pressure: "ADVISORY_PRESSURE",
    domain: "ADVISORY_TRUST",
    severity: severityFromScore(score),
    recommendedAuthority: "JUNIOR",
    activationRequired: true,
    activationRequirement: "HUMAN_APPROVAL_REQUIRED",
    reasons: [
      "recurring_advisory_opportunities_detected",
      "decision_alignment_evidence_present",
    ],
    suggestedReview:
      "PlannerAgent has sufficient evidence to support structured operational advisory under JUNIOR authority.",
  };
}

function evaluateExecutionPressure(
  e: GovernanceEmergenceEvidence
): GovernanceEmergenceSignal | null {

  const score =
    normalizeCount(e.repeatedHumanApprovedActions, 20) * 0.3 +
    normalizeCount(e.microExecutionCandidates, 20) * 0.25 +
    e.microExecutionSuccessRate * 0.25 +
    e.approvalPatternConsistency * 0.2 -
    normalizeCount(e.rollbackCount, 5) * 0.2;

  if (score < 0.65) {
    return null;
  }

  return {
    pressure: "EXECUTION_PRESSURE",
    domain: "APPROVED_EXECUTION_TRUST",
    severity: severityFromScore(score),
    recommendedAuthority: "JUNIOR",
    activationRequired: true,
    activationRequirement: "HUMAN_APPROVAL_REQUIRED",
    reasons: [
      "repeated_human_approved_actions",
      "micro_execution_patterns_detected",
    ],
    suggestedReview:
      "Recurring approved actions suggest PlannerAgent may execute simple operational routines after explicit human approval.",
  };
}

function evaluateDelegationPressure(
  e: GovernanceEmergenceEvidence
): GovernanceEmergenceSignal | null {

  const successRate =
    safeRate(
      e.successfulWorkflowSequences,
      e.approvedWorkflowSequences
    );

  const score =
    successRate * 0.35 +
    e.crossSystemConsistency * 0.25 +
    (1 - e.humanOverrideRate) * 0.2 +
    e.stabilizationSuccessRate * 0.2;

  if (score < 0.75) {
    return null;
  }

  return {
    pressure: "DELEGATION_PRESSURE",
    domain: "DELEGATED_PROCESS_STEWARDSHIP",
    severity: severityFromScore(score),
    recommendedAuthority: "SENIOR",
    activationRequired: true,
    activationRequirement: "HUMAN_APPROVAL_REQUIRED",
    reasons: [
      "workflow_sequences_repeated_successfully",
      "cross_system_consistency_detected",
    ],
    suggestedReview:
      "Repeated approved workflow sequences may justify delegated process authority review.",
  };
}

function evaluateImprovementPressure(
  e: GovernanceEmergenceEvidence
): GovernanceEmergenceSignal | null {

  const score =
    normalizeCount(e.delegatedProcessRuns, 100) * 0.15 +
    e.structuralFriction * 0.2 +
    e.workflowFatigue * 0.15 +
    e.manualInterventionFrequency * 0.15 +
    e.exceptionRecurrence * 0.15 +
    e.processInstability * 0.1 +
    e.measurableImprovementPotential * 0.1;

  if (score < 0.7) {
    return null;
  }

  return {
    pressure: "IMPROVEMENT_PRESSURE",
    domain: "STRUCTURAL_IMPROVEMENT",
    severity: severityFromScore(score),
    recommendedAuthority: "PRINCIPAL",
    activationRequired: true,
    activationRequirement: "BUDGET_ASSIGNMENT_REQUIRED",
    reasons: [
      "persistent_structural_inefficiency_detected",
      "delegated_process_friction_accumulated",
      "improvement_authority_may_materially_improve_outcomes",
    ],
    suggestedReview:
      "Observed delegated process friction suggests that improvement authority and assigned budget may be worth formal review.",
  };
}

function evaluateConstitutionalPressure(
  e: GovernanceEmergenceEvidence
): GovernanceEmergenceSignal | null {

  const triggered =
    e.policyModificationPressure ||
    e.autonomousGoalPressure ||
    e.autonomousResourceAllocationPressure ||
    e.humanRoleImpactDetected;

  if (!triggered) {
    return null;
  }

  const reasons: string[] = [];

  if (e.policyModificationPressure) {
    reasons.push("policy_modification_pressure");
  }

  if (e.autonomousGoalPressure) {
    reasons.push("autonomous_goal_pressure");
  }

  if (e.autonomousResourceAllocationPressure) {
    reasons.push("autonomous_resource_allocation_pressure");
  }

  if (e.humanRoleImpactDetected) {
    reasons.push("human_role_impact_detected");
  }

  return {
    pressure: "CONSTITUTIONAL_PRESSURE",
    domain: "CONSTITUTIONAL_BOUNDARY",
    severity: "CRITICAL",
    recommendedAuthority: "CHARTER",
    activationRequired: true,
    activationRequirement: "BOARD_CHARTER_REQUIRED",
    reasons,
    suggestedReview:
      "Potential cognitive authority boundary detected. Formal charter review is required before any authority expansion.",
  };
}

// ============================================================
// COGNITIVE BRIDGE MAPPING
// ============================================================

function mapCognitiveBridgeToEmergenceSignals(
  bridge: CognitiveGovernanceBridgeResult
): GovernanceEmergenceSignal[] {

  return bridge.emergenceSignals.map((s) => ({
    pressure:
      mapBridgePressure(s.type),

    domain:
      mapBridgeDomain(s.domain),

    severity:
      s.severity,

    recommendedAuthority:
      mapBridgeAuthority(s.domain),

    activationRequired: true,

    activationRequirement:
      s.domain === "CHARTER"
        ? "BOARD_CHARTER_REQUIRED"
        : s.domain === "PRINCIPAL"
        ? "BUDGET_ASSIGNMENT_REQUIRED"
        : "HUMAN_REVIEW_REQUIRED",

    reasons:
      s.reasons,

    suggestedReview:
      s.description,
  }));
}

function mapBridgePressure(
  pressure: string
): GovernancePressure {

  if (pressure === "AI_GOVERNANCE_PRESSURE") {
    return "AI_GOVERNANCE_PRESSURE";
  }

  if (pressure === "ADVISORY_PRESSURE") {
    return "ADVISORY_PRESSURE";
  }

  if (pressure === "DELEGATION_PRESSURE") {
    return "DELEGATION_PRESSURE";
  }

  if (pressure === "EXECUTION_PRESSURE") {
    return "EXECUTION_PRESSURE";
  }

  if (pressure === "CONSTITUTIONAL_PRESSURE") {
    return "CONSTITUTIONAL_PRESSURE";
  }

  return "NONE";
}

function mapBridgeDomain(
  domain: string
): EmergenceDomain {

  if (domain === "GRADUATE") {
    return "COGNITIVE_OBSERVABILITY";
  }

  if (domain === "JUNIOR") {
    return "ADVISORY_TRUST";
  }

  if (domain === "SENIOR") {
    return "DELEGATED_PROCESS_STEWARDSHIP";
  }

  if (domain === "PRINCIPAL") {
    return "STRUCTURAL_IMPROVEMENT";
  }

  if (domain === "CHARTER") {
    return "CONSTITUTIONAL_BOUNDARY";
  }

  return "OPERATIONAL_OBSERVATION";
}

function mapBridgeAuthority(
  domain: string
): AuthorityLevel | undefined {

  if (
    domain === "GRADUATE" ||
    domain === "JUNIOR" ||
    domain === "SENIOR" ||
    domain === "PRINCIPAL" ||
    domain === "CHARTER"
  ) {
    return domain;
  }

  return undefined;
}

// ============================================================
// TRUST DOMAINS
// ============================================================

function computeTrustDomains(
  e: GovernanceEmergenceEvidence,
  bridge?: CognitiveGovernanceBridgeResult | null
): GovernanceTrustDomains {

  const advisoryTrust =
    clamp01(
      e.decisionAlignmentRate * 0.3 +
      e.optimizerConfidence * 0.25 +
      e.replayAgreementRate * 0.25 +
      normalizeCount(e.historicalDecisionMemoryDepth, 50) * 0.2
    );

  const executionTrust =
    clamp01(
      e.microExecutionSuccessRate * 0.35 +
      e.approvalPatternConsistency * 0.3 +
      normalizeCount(e.repeatedHumanApprovedActions, 20) * 0.25 -
      normalizeCount(e.rollbackCount, 5) * 0.2
    );

  const delegationTrust =
    clamp01(
      safeRate(
        e.successfulWorkflowSequences,
        e.approvedWorkflowSequences
      ) * 0.35 +
      e.crossSystemConsistency * 0.3 +
      e.stabilizationSuccessRate * 0.25 +
      (1 - e.humanOverrideRate) * 0.1
    );

  const improvementTrust =
    clamp01(
      e.measurableImprovementPotential * 0.35 +
      e.structuralFriction * 0.25 +
      e.exceptionRecurrence * 0.2 +
      e.workflowFatigue * 0.2
    );

  const constitutionalTrust =
    clamp01(
      (
        bridge?.constitutionalRisk === "HIGH"
          ? 0.5
          : bridge?.constitutionalRisk === "MEDIUM"
          ? 0.3
          : 0
      ) +
      (
        e.policyModificationPressure ? 0.2 : 0
      ) +
      (
        e.autonomousGoalPressure ? 0.2 : 0
      ) +
      (
        e.autonomousResourceAllocationPressure ? 0.2 : 0
      ) +
      (
        e.humanRoleImpactDetected ? 0.2 : 0
      )
    );

  return {
    advisoryTrust:
      round3(advisoryTrust),

    executionTrust:
      round3(executionTrust),

    delegationTrust:
      round3(delegationTrust),

    improvementTrust:
      round3(improvementTrust),

    constitutionalTrust:
      round3(constitutionalTrust),
  };
}

// ============================================================
// MATURITY
// ============================================================

function computeGovernanceMaturity(
  pressures: GovernanceEmergenceSignal[],
  timeline: GovernanceEmergenceTimeline | null | undefined,
  trust: GovernanceTrustDomains
): GovernanceMaturity {

  const pressureCount =
    pressures.length;

  const recurring =
    timeline?.recurringPressures?.length ?? 0;

  const stableDelegation =
    timeline?.stableDelegationDetected === true;

  const confidenceIncreasing =
    timeline?.governanceConfidenceTrend === "INCREASING";

  const maxTrust =
    Math.max(
      trust.advisoryTrust,
      trust.executionTrust,
      trust.delegationTrust,
      trust.improvementTrust,
      trust.constitutionalTrust
    );

  return {
    episodic:
      pressureCount > 0 && recurring === 0,

    emerging:
      recurring > 0 || maxTrust >= 0.55,

    stable:
      stableDelegation ||
      confidenceIncreasing ||
      maxTrust >= 0.75,

    structural:
      trust.constitutionalTrust >= 0.7 ||
      trust.improvementTrust >= 0.8 ||
      (stableDelegation && recurring >= 2),
  };
}

// ============================================================
// DOMINANT PRESSURE
// ============================================================

function resolveDominantPressure(
  pressures: GovernanceEmergenceSignal[]
): GovernancePressure {

  if (pressures.length === 0) {
    return "NONE";
  }

  const order: GovernancePressure[] = [
    "CONSTITUTIONAL_PRESSURE",
    "IMPROVEMENT_PRESSURE",
    "DELEGATION_PRESSURE",
    "AI_GOVERNANCE_PRESSURE",
    "EXECUTION_PRESSURE",
    "ADVISORY_PRESSURE",
  ];

  for (const p of order) {
    if (
      pressures.some(
        (x) => x.pressure === p
      )
    ) {
      return p;
    }
  }

  return pressures[0]?.pressure ?? "NONE";
}

// ============================================================
// SUMMARY
// ============================================================

function buildEmergenceSummary(
  pressures: GovernanceEmergenceSignal[],
  maturity: GovernanceMaturity,
  review?: GovernanceReviewRecommendation
): string[] {

  if (pressures.length === 0) {
    return [
      "no_governance_pressure_detected",
    ];
  }

  const summary =
    pressures.flatMap((p) => [
      `pressure:${p.pressure}`,
      `domain:${p.domain}`,
      `severity:${p.severity}`,
    ]);

  if (maturity.episodic) {
    summary.push("maturity:episodic");
  }

  if (maturity.emerging) {
    summary.push("maturity:emerging");
  }

  if (maturity.stable) {
    summary.push("maturity:stable");
  }

  if (maturity.structural) {
    summary.push("maturity:structural");
  }

  if (review?.recommended) {
    summary.push(
      `review:${review.reviewDomain}`
    );
  }

  return summary;
}

// ============================================================
// GOVERNANCE CONFIDENCE
// ============================================================

function computeGovernanceConfidence(
  e: GovernanceEmergenceEvidence,
  trust: GovernanceTrustDomains,
  bridge?: CognitiveGovernanceBridgeResult | null
): number {

  const operational =
    e.topologyConfidence * 0.25 +
    e.replayConsistency * 0.2 +
    e.crossSystemConsistency * 0.15 +
    e.stabilizationSuccessRate * 0.15;

  const trustAvg =
    (
      trust.advisoryTrust +
      trust.executionTrust +
      trust.delegationTrust +
      trust.improvementTrust +
      trust.constitutionalTrust
    ) / 5;

  const bridgeBoost =
    bridge?.governanceRelevant
      ? bridge.governanceConfidence * 0.15
      : 0;

  const penalty =
    normalizeCount(e.rollbackCount, 5) * 0.2 +
    e.humanOverrideRate * 0.25 +
    e.processInstability * 0.25;

  return round3(
    clamp01(
      operational +
      trustAvg * 0.35 +
      bridgeBoost -
      penalty +
      0.25
    )
  );
}

// ============================================================
// HELPERS
// ============================================================

function pushIfPresent(
  arr: GovernanceEmergenceSignal[],
  value: GovernanceEmergenceSignal | null
): void {

  if (value) {
    arr.push(value);
  }
}

function dedupePressures(
  pressures: GovernanceEmergenceSignal[]
): GovernanceEmergenceSignal[] {

  const map =
    new Map<string, GovernanceEmergenceSignal>();

  for (const p of pressures) {
    const key =
      `${p.pressure}:${p.domain}:${p.recommendedAuthority ?? "none"}`;

    const existing =
      map.get(key);

    if (!existing) {
      map.set(key, p);
      continue;
    }

    map.set(key, {
      ...existing,
      severity:
        severityRank(p.severity) >
        severityRank(existing.severity)
          ? p.severity
          : existing.severity,

      reasons:
        Array.from(
          new Set([
            ...existing.reasons,
            ...p.reasons,
          ])
        ),
    });
  }

  return Array.from(map.values());
}

function severityRank(
  s: EmergenceSeverity
): number {

  switch (s) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    default:
      return 1;
  }
}

function severityFromScore(
  score: number
): EmergenceSeverity {

  const s = clamp01(score);

  if (s >= 0.9) return "CRITICAL";
  if (s >= 0.75) return "HIGH";
  if (s >= 0.55) return "MEDIUM";

  return "LOW";
}

function normalizeCount(
  value: number,
  target: number
): number {

  if (target <= 0) {
    return 0;
  }

  return clamp01(value / target);
}

function safeRate(
  num: number,
  den: number
): number {

  if (den <= 0) {
    return 0;
  }

  return clamp01(num / den);
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

  return Math.round(value * 1000) / 1000;
}