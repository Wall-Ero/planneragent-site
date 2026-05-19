// core/src/cognitive-observability/cognitive.workflow.observer.ts
// ============================================================
// PlannerAgent — Cognitive Workflow Observer V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Observe AI-assisted operational behavior emerging inside
// operational workflows.
//
// This layer DOES NOT:
// - govern AI usage
// - approve AI usage
// - block AI usage
// - activate GRADUATE authority
// - enforce constitutional policy
// - expand execution scope
//
// It DOES:
// - observe AI-assisted workflows
// - detect recurring cognitive patterns
// - detect operational AI dependency
// - detect shadow AI usage
// - classify cognitive observability signals
// - provide runtime evidence for governance emergence
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Cognitive observability precedes governance.
//
// PlannerAgent observes how AI is already interacting
// with operations before governance authority emerges.
//
// ============================================================

// ============================================================
// COGNITIVE WORKFLOW TYPE
// ============================================================

export type CognitiveWorkflowType =
  | "PROMPT_DRIVEN_OPERATION"
  | "AI_ASSISTED_DECISION"
  | "AI_GENERATED_ARTIFACT"
  | "AI_ASSISTED_RECOVERY"
  | "EXTERNAL_AI_DEPENDENCY"
  | "SHADOW_AI_USAGE";

// ============================================================
// OBSERVABILITY LEVEL
// ============================================================

export type CognitiveObservabilityLevel =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

// ============================================================
// COGNITIVE PRESSURE
// ============================================================

export type CognitivePressure =
  | "NONE"
  | "AI_DEPENDENCY_PRESSURE"
  | "UNGOVERNED_AI_PRESSURE"
  | "COGNITIVE_AUTOMATION_PRESSURE";

// ============================================================
// OBSERVED WORKFLOW
// ============================================================

export interface ObservedCognitiveWorkflow {
  workflowType: CognitiveWorkflowType;

  recurring: boolean;

  aiInvolved: boolean;

  operationallyCritical: boolean;

  confidence: number;

  signals: string[];

  description: string;
}

// ============================================================
// OPERATIONAL COGNITIVE EVIDENCE
// ============================================================

export interface CognitiveWorkflowEvidence {

  // ----------------------------------------------------------
  // Prompt repetition
  // ----------------------------------------------------------

  recurringPromptPatterns: number;

  repeatedOperationalPrompts: number;

  // ----------------------------------------------------------
  // AI-assisted artifacts
  // ----------------------------------------------------------

  aiGeneratedOperationalArtifacts: number;

  aiGeneratedInstructions: number;

  aiGeneratedOperationalSummaries: number;

  // ----------------------------------------------------------
  // AI-assisted recovery
  // ----------------------------------------------------------

  aiAssistedRecoveryFlows: number;

  aiAssistedReconciliation: number;

  // ----------------------------------------------------------
  // External AI dependency
  // ----------------------------------------------------------

  externalAiDependencyRate: number;

  operationalSlowdownWithoutAi: boolean;

  // ----------------------------------------------------------
  // Shadow AI
  // ----------------------------------------------------------

  shadowAiUsageDetected: boolean;

  unmanagedExternalTools: number;

  // ----------------------------------------------------------
  // Cognitive repetition
  // ----------------------------------------------------------

  recurringCognitiveWorkflows: number;
}

// ============================================================
// OBSERVABILITY RESULT
// ============================================================

export interface CognitiveWorkflowObservationResult {

  observabilityLevel:
    CognitiveObservabilityLevel;

  cognitivePressure:
    CognitivePressure;

  observedWorkflows:
    ObservedCognitiveWorkflow[];

  recurringWorkflowDetected: boolean;

  operationalAiDependencyDetected: boolean;

  shadowAiDetected: boolean;

  governanceRelevant: boolean;

  governanceSignals: string[];

  summary: string[];

  confidence: number;
}

// ============================================================
// MAIN ENGINE
// ============================================================

export function observeCognitiveWorkflows(params: {
  evidence: CognitiveWorkflowEvidence;
}): CognitiveWorkflowObservationResult {

  const { evidence } = params;

  const observedWorkflows:
    ObservedCognitiveWorkflow[] = [];

  // ----------------------------------------------------------
  // PROMPT-DRIVEN OPERATIONS
  // ----------------------------------------------------------

  if (
    evidence.recurringPromptPatterns > 0 ||
    evidence.repeatedOperationalPrompts > 0
  ) {

    observedWorkflows.push({
      workflowType:
        "PROMPT_DRIVEN_OPERATION",

      recurring:
        evidence.recurringPromptPatterns >= 3,

      aiInvolved: true,

      operationallyCritical:
        evidence.repeatedOperationalPrompts >= 5,

      confidence:
        clamp01(
          (
            normalizeCount(
              evidence.recurringPromptPatterns,
              10
            ) * 0.5
          ) +
          (
            normalizeCount(
              evidence.repeatedOperationalPrompts,
              20
            ) * 0.5
          )
        ),

      signals: [
        "recurring_prompt_patterns_detected",
        "repeated_operational_prompts_detected",
      ],

      description:
        "Recurring AI-assisted prompt workflows detected inside operational processes.",
    });
  }

  // ----------------------------------------------------------
  // AI-GENERATED ARTIFACTS
  // ----------------------------------------------------------

  if (
    evidence.aiGeneratedOperationalArtifacts > 0 ||
    evidence.aiGeneratedInstructions > 0
  ) {

    observedWorkflows.push({
      workflowType:
        "AI_GENERATED_ARTIFACT",

      recurring:
        evidence.aiGeneratedOperationalArtifacts >= 3,

      aiInvolved: true,

      operationallyCritical:
        evidence.aiGeneratedInstructions >= 5,

      confidence:
        clamp01(
          (
            normalizeCount(
              evidence.aiGeneratedOperationalArtifacts,
              20
            ) * 0.6
          ) +
          (
            normalizeCount(
              evidence.aiGeneratedInstructions,
              20
            ) * 0.4
          )
        ),

      signals: [
        "ai_generated_operational_artifacts_detected",
        "ai_generated_operational_instructions_detected",
      ],

      description:
        "AI-generated operational artifacts are recurring inside operational execution flows.",
    });
  }

  // ----------------------------------------------------------
  // AI-ASSISTED RECOVERY
  // ----------------------------------------------------------

  if (
    evidence.aiAssistedRecoveryFlows > 0 ||
    evidence.aiAssistedReconciliation > 0
  ) {

    observedWorkflows.push({
      workflowType:
        "AI_ASSISTED_RECOVERY",

      recurring:
        evidence.aiAssistedRecoveryFlows >= 3,

      aiInvolved: true,

      operationallyCritical:
        evidence.aiAssistedReconciliation >= 5,

      confidence:
        clamp01(
          (
            normalizeCount(
              evidence.aiAssistedRecoveryFlows,
              10
            ) * 0.5
          ) +
          (
            normalizeCount(
              evidence.aiAssistedReconciliation,
              10
            ) * 0.5
          )
        ),

      signals: [
        "ai_assisted_recovery_detected",
        "ai_assisted_reconciliation_detected",
      ],

      description:
        "AI-assisted operational recovery patterns are emerging repeatedly.",
    });
  }

  // ----------------------------------------------------------
  // EXTERNAL AI DEPENDENCY
  // ----------------------------------------------------------

  if (
    evidence.externalAiDependencyRate >= 0.5 ||
    evidence.operationalSlowdownWithoutAi
  ) {

    observedWorkflows.push({
      workflowType:
        "EXTERNAL_AI_DEPENDENCY",

      recurring: true,

      aiInvolved: true,

      operationallyCritical:
        evidence.externalAiDependencyRate >= 0.75,

      confidence:
        clamp01(
          (
            evidence.externalAiDependencyRate * 0.7
          ) +
          (
            evidence.operationalSlowdownWithoutAi
              ? 0.3
              : 0
          )
        ),

      signals: [
        "external_ai_dependency_detected",
        "operational_slowdown_without_ai_detected",
      ],

      description:
        "Operational execution appears increasingly dependent on external AI assistance.",
    });
  }

  // ----------------------------------------------------------
  // SHADOW AI USAGE
  // ----------------------------------------------------------

  if (
    evidence.shadowAiUsageDetected ||
    evidence.unmanagedExternalTools > 0
  ) {

    observedWorkflows.push({
      workflowType:
        "SHADOW_AI_USAGE",

      recurring:
        evidence.unmanagedExternalTools >= 2,

      aiInvolved: true,

      operationallyCritical: true,

      confidence:
        clamp01(
          (
            evidence.shadowAiUsageDetected
              ? 0.6
              : 0
          ) +
          (
            normalizeCount(
              evidence.unmanagedExternalTools,
              5
            ) * 0.4
          )
        ),

      signals: [
        "shadow_ai_usage_detected",
        "unmanaged_external_ai_tools_detected",
      ],

      description:
        "Unmanaged AI-assisted operational behavior has been observed outside governance boundaries.",
    });
  }

  // ==========================================================
  // DERIVED SIGNALS
  // ==========================================================

  const recurringWorkflowDetected =
    observedWorkflows.some(
      (w) => w.recurring
    );

  const operationalAiDependencyDetected =
    observedWorkflows.some(
      (w) =>
        w.workflowType ===
        "EXTERNAL_AI_DEPENDENCY"
    );

  const shadowAiDetected =
    observedWorkflows.some(
      (w) =>
        w.workflowType ===
        "SHADOW_AI_USAGE"
    );

  // ==========================================================
  // COGNITIVE PRESSURE
  // ==========================================================

  let cognitivePressure:
    CognitivePressure = "NONE";

  if (shadowAiDetected) {

    cognitivePressure =
      "UNGOVERNED_AI_PRESSURE";

  } else if (
    operationalAiDependencyDetected
  ) {

    cognitivePressure =
      "AI_DEPENDENCY_PRESSURE";

  } else if (
    recurringWorkflowDetected
  ) {

    cognitivePressure =
      "COGNITIVE_AUTOMATION_PRESSURE";
  }

  // ==========================================================
  // OBSERVABILITY LEVEL
  // ==========================================================

  const confidence =
    computeObservabilityConfidence(
      observedWorkflows
    );

  const observabilityLevel =
    observabilityLevelFromConfidence(
      confidence
    );

  // ==========================================================
  // GOVERNANCE SIGNALS
  // ==========================================================

  const governanceSignals: string[] = [];

  if (shadowAiDetected) {
    governanceSignals.push(
      "shadow_ai_usage_detected"
    );
  }

  if (operationalAiDependencyDetected) {
    governanceSignals.push(
      "operational_ai_dependency_detected"
    );
  }

  if (recurringWorkflowDetected) {
    governanceSignals.push(
      "recurring_ai_workflows_detected"
    );
  }

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary =
    buildCognitiveSummary(
      observedWorkflows,
      cognitivePressure
    );

  return {

    observabilityLevel,

    cognitivePressure,

    observedWorkflows,

    recurringWorkflowDetected,

    operationalAiDependencyDetected,

    shadowAiDetected,

    governanceRelevant:
      governanceSignals.length > 0,

    governanceSignals,

    summary,

    confidence,
  };
}

// ============================================================
// SUMMARY
// ============================================================

function buildCognitiveSummary(
  workflows: ObservedCognitiveWorkflow[],
  pressure: CognitivePressure
): string[] {

  if (workflows.length === 0) {
    return [
      "no_ai_assisted_operational_behavior_detected",
    ];
  }

  const summary: string[] = [];

  summary.push(
    `cognitive_pressure:${pressure}`
  );

  for (const workflow of workflows) {

    summary.push(
      `workflow:${workflow.workflowType}`
    );

    if (workflow.recurring) {
      summary.push(
        `recurring:${workflow.workflowType}`
      );
    }
  }

  return summary;
}

// ============================================================
// CONFIDENCE
// ============================================================

function computeObservabilityConfidence(
  workflows: ObservedCognitiveWorkflow[]
): number {

  if (!workflows.length) {
    return 0;
  }

  const avg =
    workflows.reduce(
      (sum, w) => sum + w.confidence,
      0
    ) / workflows.length;

  return round3(
    clamp01(avg)
  );
}

// ============================================================
// OBSERVABILITY LEVEL
// ============================================================

function observabilityLevelFromConfidence(
  confidence: number
): CognitiveObservabilityLevel {

  const c = clamp01(confidence);

  if (c >= 0.9) return "CRITICAL";
  if (c >= 0.75) return "HIGH";
  if (c >= 0.5) return "MEDIUM";
  if (c >= 0.25) return "LOW";

  return "NONE";
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

  return clamp01(value / target);
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