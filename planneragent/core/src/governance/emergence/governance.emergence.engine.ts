// core/src/governance/emergence/governance.emergence.engine.ts
// ============================================================
// PlannerAgent — Governance Emergence Engine V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Detect governance pressure emerging from observed reality.
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
// - detect governance pressure
// - classify emergence domains
// - recommend human-governed authority review
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Authority emergence is system-observed.
// Authority activation is always human-controlled.
//
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

export interface GovernanceEmergenceEvidence {
  // ----------------------------------------------------------
  // Operational observation — VISION
  // ----------------------------------------------------------

  observedOperationalEvents: number;
  recurringOperationalPatterns: number;
  topologyConfidence: number;
  anomalyRecurrence: number;
  replayConsistency: number;

  // ----------------------------------------------------------
  // Cognitive observability — VISION → GRADUATE pressure
  // ----------------------------------------------------------

  observedAiAssistedWorkflows: number;
  shadowAiUsageDetected: boolean;
  recurringPromptPatterns: number;
  externalAiToolDependency: number;
  aiGeneratedOperationalArtifacts: number;
  ungovernedAiWorkflowCount: number;

  // ----------------------------------------------------------
  // Advisory trust — VISION/GRADUATE → JUNIOR advisory
  // ----------------------------------------------------------

  advisoryOpportunitiesDetected: number;
  decisionAlignmentRate: number;
  optimizerConfidence: number;
  replayAgreementRate: number;
  historicalDecisionMemoryDepth: number;

  // ----------------------------------------------------------
  // Approved execution trust — VISION/GRADUATE → JUNIOR execution
  // ----------------------------------------------------------

  repeatedHumanApprovedActions: number;
  microExecutionCandidates: number;
  microExecutionSuccessRate: number;
  approvalPatternConsistency: number;
  rollbackCount: number;

  // ----------------------------------------------------------
  // Delegated workflow trust — JUNIOR → SENIOR pressure
  // ----------------------------------------------------------

  approvedWorkflowSequences: number;
  successfulWorkflowSequences: number;
  crossSystemConsistency: number;
  humanOverrideRate: number;
  stabilizationSuccessRate: number;

  // ----------------------------------------------------------
  // Longitudinal stewardship — SENIOR → PRINCIPAL pressure
  // ----------------------------------------------------------

  delegatedProcessRuns: number;
  structuralFriction: number;
  workflowFatigue: number;
  manualInterventionFrequency: number;
  exceptionRecurrence: number;
  processInstability: number;
  measurableImprovementPotential: number;

  // ----------------------------------------------------------
  // Constitutional boundary — PRINCIPAL → CHARTER pressure
  // ----------------------------------------------------------

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

  emergenceSummary: string[];

  governanceConfidence: number;
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function evaluateGovernanceEmergence(params: {
  currentAuthority: AuthorityLevel;
  evidence: GovernanceEmergenceEvidence;
}): GovernanceEmergenceResult {
  const { currentAuthority, evidence } = params;

  const pressures: GovernanceEmergenceSignal[] = [];

  const aiGovernance =
    evaluateAiGovernancePressure(evidence);

  if (aiGovernance) {
    pressures.push(aiGovernance);
  }

  const advisory =
    evaluateAdvisoryPressure(evidence);

  if (advisory) {
    pressures.push(advisory);
  }

  const execution =
    evaluateExecutionPressure(evidence);

  if (execution) {
    pressures.push(execution);
  }

  const delegation =
    evaluateDelegationPressure(evidence);

  if (delegation) {
    pressures.push(delegation);
  }

  const improvement =
    evaluateImprovementPressure(evidence);

  if (improvement) {
    pressures.push(improvement);
  }

  const constitutional =
    evaluateConstitutionalPressure(evidence);

  if (constitutional) {
    pressures.push(constitutional);
  }

  const dominantPressure =
    resolveDominantPressure(pressures);

  return {
    currentAuthority,
    pressures,
    dominantPressure,
    activationAlwaysHuman: true,
    emergenceSummary:
      buildEmergenceSummary(pressures),
    governanceConfidence:
      computeGovernanceConfidence(evidence),
  };
}

// ============================================================
// AI GOVERNANCE PRESSURE
// VISION observes uncontrolled AI usage.
// GRADUATE governs it.
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

// ============================================================
// ADVISORY PRESSURE
// VISION/GRADUATE may reveal need for JUNIOR advisory.
// ============================================================

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

// ============================================================
// EXECUTION PRESSURE
// Micro-approved execution can emerge before advisory trust.
// ============================================================

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

// ============================================================
// DELEGATION PRESSURE
// JUNIOR patterns may justify SENIOR review.
// ============================================================

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

// ============================================================
// IMPROVEMENT PRESSURE
// SENIOR does not become PRINCIPAL.
// SENIOR may reveal structural inefficiency.
// ============================================================

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

// ============================================================
// CONSTITUTIONAL PRESSURE
// No authority expansion without charter review.
// ============================================================

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
    if (pressures.some((x) => x.pressure === p)) {
      return p;
    }
  }

  return pressures[0]?.pressure ?? "NONE";
}

// ============================================================
// SUMMARY
// ============================================================

function buildEmergenceSummary(
  pressures: GovernanceEmergenceSignal[]
): string[] {
  if (pressures.length === 0) {
    return [
      "no_governance_pressure_detected",
    ];
  }

  return pressures.flatMap((p) => [
    `pressure:${p.pressure}`,
    `domain:${p.domain}`,
    `severity:${p.severity}`,
  ]);
}

// ============================================================
// GOVERNANCE CONFIDENCE
// ============================================================

function computeGovernanceConfidence(
  e: GovernanceEmergenceEvidence
): number {
  const positive =
    e.topologyConfidence * 0.25 +
    e.replayConsistency * 0.2 +
    e.decisionAlignmentRate * 0.15 +
    e.microExecutionSuccessRate * 0.15 +
    e.crossSystemConsistency * 0.15 +
    e.stabilizationSuccessRate * 0.1;

  const penalty =
    normalizeCount(e.rollbackCount, 5) * 0.35 +
    e.humanOverrideRate * 0.35 +
    e.processInstability * 0.3;

  return round3(
    clamp01(positive - penalty + 0.35)
  );
}

// ============================================================
// HELPERS
// ============================================================

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