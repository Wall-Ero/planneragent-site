// core/src/cognitive-observability/cognitive.governance.bridge.ts
// ============================================================
// PlannerAgent — Cognitive Governance Bridge V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Transform longitudinal cognitive observability evidence into
// governance-relevant emergence signals.
//
// This layer DOES NOT:
// - activate governance authority
// - escalate organizational authority
// - modify execution permissions
// - authorize AI usage
// - govern operational execution
// - synthesize cognition
//
// It DOES:
// - bridge observability into governance relevance
// - detect governance emergence pressure
// - classify governance-relevant cognitive signals
// - expose constitutional governance evidence
// - provide emergence evidence to governance engines
//
// CONSTITUTIONAL PRINCIPLE
// ------------------------------------------------------------
// Observation precedes governance.
// Governance precedes authority.
// Authority precedes execution.
//
// ============================================================

import type {
  CognitivePressure,
  CognitiveObservabilityLevel,
} from "./cognitive.workflow.observer";

import type {
  CognitiveWorkflowMemorySnapshot,
} from "./cognitive.workflow.memory";

// ============================================================
// GOVERNANCE PRESSURE
// ============================================================

export type GovernancePressureType =
  | "NONE"
  | "AI_GOVERNANCE_PRESSURE"
  | "ADVISORY_PRESSURE"
  | "DELEGATION_PRESSURE"
  | "EXECUTION_PRESSURE"
  | "CONSTITUTIONAL_PRESSURE";

// ============================================================
// GOVERNANCE DOMAIN
// ============================================================

export type GovernanceDomain =
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

// ============================================================
// GOVERNANCE SIGNAL
// ============================================================

export interface GovernanceEmergenceSignal {

  type:
    GovernancePressureType;

  domain:
    GovernanceDomain;

  severity:
    "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  recurring: boolean;

  governanceRelevant: boolean;

  confidence: number;

  reasons: string[];

  description: string;
}

// ============================================================
// GOVERNANCE BRIDGE RESULT
// ============================================================

export interface CognitiveGovernanceBridgeResult {

  governanceRelevant: boolean;

  dominantPressure:
    GovernancePressureType;

  recommendedDomains:
    GovernanceDomain[];

  emergenceSignals:
    GovernanceEmergenceSignal[];

  constitutionalRisk:
    "NONE"
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  operationalAiDependency:
    boolean;

  shadowAiPersistence:
    boolean;

  governanceConfidence:
    number;

  summary: string[];
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function buildCognitiveGovernanceBridge(params: {

  observation: {
    observabilityLevel:
      CognitiveObservabilityLevel;

    cognitivePressure:
      CognitivePressure;

    recurringWorkflowDetected:
      boolean;

    operationalAiDependencyDetected:
      boolean;

    shadowAiDetected:
      boolean;

    governanceSignals:
      string[];

    confidence:
      number;
  };

  memory:
    CognitiveWorkflowMemorySnapshot;

}): CognitiveGovernanceBridgeResult {

  const {
    observation,
    memory,
  } = params;

  const emergenceSignals:
    GovernanceEmergenceSignal[] = [];

  // ==========================================================
  // SHADOW AI → GRADUATE PRESSURE
  // ==========================================================

  if (
    observation.shadowAiDetected ||
    memory.shadowAiPersistenceScore >= 0.5
  ) {

    emergenceSignals.push({

      type:
        "AI_GOVERNANCE_PRESSURE",

      domain:
        "GRADUATE",

      severity:
        memory.shadowAiPersistenceScore >= 0.75
          ? "CRITICAL"
          : memory.shadowAiPersistenceScore >= 0.5
          ? "HIGH"
          : "MEDIUM",

      recurring:
        memory.shadowAiPersistenceScore >= 0.4,

      governanceRelevant: true,

      confidence:
        clamp01(
          (
            observation.confidence * 0.5
          ) +
          (
            memory.shadowAiPersistenceScore * 0.5
          )
        ),

      reasons: [
        "shadow_ai_usage_detected",
        "ungoverned_ai_usage_detected",
      ],

      description:
        "Persistent unmanaged AI-assisted workflows are emerging outside governance visibility.",
    });
  }

  // ==========================================================
  // AI DEPENDENCY → ADVISORY PRESSURE
  // ==========================================================

  if (
    observation.operationalAiDependencyDetected ||
    memory.operationalDependencyScore >= 0.5
  ) {

    emergenceSignals.push({

      type:
        "ADVISORY_PRESSURE",

      domain:
        "JUNIOR",

      severity:
        memory.operationalDependencyScore >= 0.8
          ? "CRITICAL"
          : memory.operationalDependencyScore >= 0.6
          ? "HIGH"
          : "MEDIUM",

      recurring: true,

      governanceRelevant: true,

      confidence:
        clamp01(
          (
            observation.confidence * 0.4
          ) +
          (
            memory.operationalDependencyScore * 0.6
          )
        ),

      reasons: [
        "operational_ai_dependency_detected",
        "repeated_ai_assisted_decisions_detected",
      ],

      description:
        "Operational workflows are increasingly dependent on recurring AI-assisted advisory behavior.",
    });
  }

  // ==========================================================
  // EXECUTIONAL PATTERN → DELEGATION PRESSURE
  // ==========================================================

  if (
    memory.recurringWorkflowScore >= 0.7 &&
    memory.workflowStabilityScore >= 0.7
  ) {

    emergenceSignals.push({

      type:
        "DELEGATION_PRESSURE",

      domain:
        "SENIOR",

      severity:
        memory.workflowStabilityScore >= 0.85
          ? "HIGH"
          : "MEDIUM",

      recurring: true,

      governanceRelevant: true,

      confidence:
        clamp01(
          (
            memory.recurringWorkflowScore * 0.5
          ) +
          (
            memory.workflowStabilityScore * 0.5
          )
        ),

      reasons: [
        "workflow_sequences_recurring",
        "operational_patterns_stabilized",
      ],

      description:
        "Repeated operational AI-assisted workflow sequences are stabilizing longitudinally.",
    });
  }

  // ==========================================================
  // CROSS-ORGANIZATIONAL DEPENDENCY
  // ==========================================================

  if (
    memory.crossOperationalDependencyScore >= 0.75
  ) {

    emergenceSignals.push({

      type:
        "EXECUTION_PRESSURE",

      domain:
        "PRINCIPAL",

      severity:
        "HIGH",

      recurring: true,

      governanceRelevant: true,

      confidence:
        clamp01(
          memory.crossOperationalDependencyScore
        ),

      reasons: [
        "cross_operational_ai_dependency_detected",
        "multi_workflow_ai_dependency_detected",
      ],

      description:
        "AI-assisted operational dependency is expanding across interconnected operational domains.",
    });
  }

  // ==========================================================
  // CONSTITUTIONAL PRESSURE
  // ==========================================================

  if (
    observation.observabilityLevel === "CRITICAL" &&
    memory.constitutionalOperationalMaturity >= 0.8
  ) {

    emergenceSignals.push({

      type:
        "CONSTITUTIONAL_PRESSURE",

      domain:
        "CHARTER",

      severity:
        "CRITICAL",

      recurring: true,

      governanceRelevant: true,

      confidence:
        clamp01(
          (
            observation.confidence * 0.5
          ) +
          (
            memory.constitutionalOperationalMaturity * 0.5
          )
        ),

      reasons: [
        "systemic_ai_operational_presence_detected",
        "constitutional_governance_visibility_required",
      ],

      description:
        "AI-assisted operational participation has become constitutionally governance-relevant.",
    });
  }

  // ==========================================================
  // DOMINANT PRESSURE
  // ==========================================================

  const dominantPressure =
    deriveDominantPressure(
      emergenceSignals
    );

  // ==========================================================
  // DOMAINS
  // ==========================================================

  const recommendedDomains =
    Array.from(
      new Set(
        emergenceSignals.map(
          (s) => s.domain
        )
      )
    );

  // ==========================================================
  // CONSTITUTIONAL RISK
  // ==========================================================

  const constitutionalRisk =
    deriveConstitutionalRisk(
      emergenceSignals
    );

  // ==========================================================
  // CONFIDENCE
  // ==========================================================

  const governanceConfidence =
    computeGovernanceConfidence(
      emergenceSignals
    );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary =
    buildGovernanceSummary({
      dominantPressure,
      emergenceSignals,
      constitutionalRisk,
    });

  return {

    governanceRelevant:
      emergenceSignals.length > 0,

    dominantPressure,

    recommendedDomains,

    emergenceSignals,

    constitutionalRisk,

    operationalAiDependency:
      observation.operationalAiDependencyDetected,

    shadowAiPersistence:
      memory.shadowAiPersistenceScore >= 0.5,

    governanceConfidence,

    summary,
  };
}

// ============================================================
// DOMINANT PRESSURE
// ============================================================

function deriveDominantPressure(
  signals: GovernanceEmergenceSignal[]
): GovernancePressureType {

  if (!signals.length) {
    return "NONE";
  }

  const sorted =
    [...signals].sort(
      (a, b) => b.confidence - a.confidence
    );

  return sorted[0].type;
}

// ============================================================
// CONSTITUTIONAL RISK
// ============================================================

function deriveConstitutionalRisk(
  signals: GovernanceEmergenceSignal[]
): "NONE" | "LOW" | "MEDIUM" | "HIGH" {

  if (!signals.length) {
    return "NONE";
  }

  const critical =
    signals.some(
      (s) => s.severity === "CRITICAL"
    );

  if (critical) {
    return "HIGH";
  }

  const high =
    signals.some(
      (s) => s.severity === "HIGH"
    );

  if (high) {
    return "MEDIUM";
  }

  return "LOW";
}

// ============================================================
// GOVERNANCE CONFIDENCE
// ============================================================

function computeGovernanceConfidence(
  signals: GovernanceEmergenceSignal[]
): number {

  if (!signals.length) {
    return 0;
  }

  const avg =
    signals.reduce(
      (sum, s) => sum + s.confidence,
      0
    ) / signals.length;

  return round3(
    clamp01(avg)
  );
}

// ============================================================
// SUMMARY
// ============================================================

function buildGovernanceSummary(params: {

  dominantPressure:
    GovernancePressureType;

  emergenceSignals:
    GovernanceEmergenceSignal[];

  constitutionalRisk:
    "NONE"
    | "LOW"
    | "MEDIUM"
    | "HIGH";

}): string[] {

  const {
    dominantPressure,
    emergenceSignals,
    constitutionalRisk,
  } = params;

  if (!emergenceSignals.length) {

    return [
      "no_governance_emergence_detected",
    ];
  }

  const summary: string[] = [];

  summary.push(
    `dominant_pressure:${dominantPressure}`
  );

  summary.push(
    `constitutional_risk:${constitutionalRisk}`
  );

  for (const signal of emergenceSignals) {

    summary.push(
      `domain:${signal.domain}`
    );

    summary.push(
      `pressure:${signal.type}`
    );

    if (signal.recurring) {
      summary.push(
        `recurring:${signal.domain}`
      );
    }
  }

  return summary;
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

  return Math.round(
    value * 1000
  ) / 1000;
}