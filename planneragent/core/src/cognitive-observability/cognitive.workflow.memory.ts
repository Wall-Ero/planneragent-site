// core/src/cognitive-observability/cognitive.workflow.memory.ts
// ============================================================
// PlannerAgent — Cognitive Workflow Memory V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Persist longitudinal cognitive observability evidence.
//
// This layer DOES NOT:
// - synthesize cognition
// - activate governance
// - escalate authority
// - approve AI usage
// - govern execution
//
// It DOES:
// - persist recurring AI-assisted workflow evidence
// - track operational AI dependency evolution
// - track shadow AI persistence
// - track cognitive pressure evolution
// - provide longitudinal governance observability
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance emergence must emerge from observed reality
// accumulated over time.
//
// ============================================================

import type {
  CognitivePressure,
  CognitiveWorkflowObservationResult,
} from "./cognitive.workflow.observer";


// ============================================================
// MEMORY SNAPSHOT
// ============================================================

export interface CognitiveWorkflowMemorySnapshot {

  recurringWorkflowScore: number;

  operationalDependencyScore: number;

  workflowStabilityScore: number;

  shadowAiPersistenceScore: number;

  crossOperationalDependencyScore: number;

  constitutionalOperationalMaturity: number;

  confidence: number;

  signals: string[];
}

// ============================================================
// MEMORY ENTRY
// ============================================================

export interface CognitiveWorkflowMemoryEntry {

  timestamp: string;

  observabilityLevel: string;

  cognitivePressure:
    CognitivePressure;

  recurringWorkflowDetected: boolean;

  operationalAiDependencyDetected: boolean;

  shadowAiDetected: boolean;

  governanceRelevant: boolean;

  workflowCount: number;

  governanceSignals: string[];

  confidence: number;
}

// ============================================================
// LONGITUDINAL SIGNALS
// ============================================================

export interface CognitiveLongitudinalSignals {

  recurringShadowAi: boolean;

  recurringOperationalDependency: boolean;

  recurringGovernancePressure: boolean;

  increasingCognitivePressure: boolean;

  stableAiAssistedOperations: boolean;

  unmanagedAiPersistence: boolean;
}

// ============================================================
// MEMORY RESULT
// ============================================================

export interface CognitiveWorkflowMemoryResult {

  entries:
    CognitiveWorkflowMemoryEntry[];

  totalEntries: number;

  averageConfidence: number;

  dominantPressure:
    CognitivePressure;

  longitudinalSignals:
    CognitiveLongitudinalSignals;

    snapshot:
  CognitiveWorkflowMemorySnapshot;

  governanceRelevant: boolean;

  summary: string[];
}

// ============================================================
// IN-MEMORY STORE (V1)
// ============================================================

const cognitiveWorkflowMemory:
  CognitiveWorkflowMemoryEntry[] = [];

// ============================================================
// APPEND MEMORY
// ============================================================

export function appendCognitiveWorkflowMemory(
  observation:
    CognitiveWorkflowObservationResult
): CognitiveWorkflowMemoryEntry {

  const entry:
    CognitiveWorkflowMemoryEntry = {

    timestamp:
      new Date().toISOString(),

    observabilityLevel:
      observation.observabilityLevel,

    cognitivePressure:
      observation.cognitivePressure,

    recurringWorkflowDetected:
      observation.recurringWorkflowDetected,

    operationalAiDependencyDetected:
      observation.operationalAiDependencyDetected,

    shadowAiDetected:
      observation.shadowAiDetected,

    governanceRelevant:
      observation.governanceRelevant,

    workflowCount:
      observation.observedWorkflows.length,

    governanceSignals:
      observation.governanceSignals,

    confidence:
      observation.confidence,
  };

  cognitiveWorkflowMemory.push(entry);

  return entry;
}

// ============================================================
// READ MEMORY
// ============================================================

export function readCognitiveWorkflowMemory():
  CognitiveWorkflowMemoryResult {

  const entries =
    [...cognitiveWorkflowMemory];

  const longitudinalSignals =
    deriveLongitudinalSignals(
      entries
    );

    const snapshot =
  buildMemorySnapshot(
    entries,
    longitudinalSignals
  );

  return {

    entries,

    totalEntries:
      entries.length,

    averageConfidence:
      computeAverageConfidence(
        entries
      ),

    dominantPressure:
      resolveDominantPressure(
        entries
      ),

    longitudinalSignals,

    snapshot,

    governanceRelevant:
      entries.some(
        (e) => e.governanceRelevant
      ),

    summary:
      buildMemorySummary(
        entries,
        longitudinalSignals
      ),
  };
}

// ============================================================
// CLEAR MEMORY
// ============================================================

export function clearCognitiveWorkflowMemory():
  void {

  cognitiveWorkflowMemory.length = 0;
}

// ============================================================
// LONGITUDINAL SIGNALS
// ============================================================

function deriveLongitudinalSignals(
  entries:
    CognitiveWorkflowMemoryEntry[]
): CognitiveLongitudinalSignals {

  const recurringShadowAi =
    entries.filter(
      (e) => e.shadowAiDetected
    ).length >= 2;

  const recurringOperationalDependency =
    entries.filter(
      (e) =>
        e.operationalAiDependencyDetected
    ).length >= 2;

  const recurringGovernancePressure =
    entries.filter(
      (e) =>
        e.cognitivePressure !== "NONE"
    ).length >= 3;

  const unmanagedAiPersistence =
    entries.filter(
      (e) => e.shadowAiDetected
    ).length >= 3;

  const stableAiAssistedOperations =
    entries.filter(
      (e) =>
        e.recurringWorkflowDetected
    ).length >= 3;

  const increasingCognitivePressure =
    detectIncreasingPressure(
      entries
    );

  return {

    recurringShadowAi,

    recurringOperationalDependency,

    recurringGovernancePressure,

    increasingCognitivePressure,

    stableAiAssistedOperations,

    unmanagedAiPersistence,
  };
}

// ============================================================
// PRESSURE TREND
// ============================================================

function detectIncreasingPressure(
  entries:
    CognitiveWorkflowMemoryEntry[]
): boolean {

  if (entries.length < 3) {
    return false;
  }

  const last =
    entries.slice(-3);

  const scores =
    last.map(
      pressureScore
    );

  return (
    scores[2] >= scores[1] &&
    scores[1] >= scores[0] &&
    scores[2] > scores[0]
  );
}

// ============================================================
// DOMINANT PRESSURE
// ============================================================

function resolveDominantPressure(
  entries:
    CognitiveWorkflowMemoryEntry[]
): CognitivePressure {

  if (!entries.length) {
    return "NONE";
  }

  const order: CognitivePressure[] = [
    "UNGOVERNED_AI_PRESSURE",
    "AI_DEPENDENCY_PRESSURE",
    "COGNITIVE_AUTOMATION_PRESSURE",
  ];

  for (const p of order) {

    if (
      entries.some(
        (e) =>
          e.cognitivePressure === p
      )
    ) {
      return p;
    }
  }

  return "NONE";
}

// ============================================================
// SUMMARY
// ============================================================

function buildMemorySummary(
  entries:
    CognitiveWorkflowMemoryEntry[],

  signals:
    CognitiveLongitudinalSignals
): string[] {

  if (!entries.length) {

    return [
      "no_cognitive_memory_present",
    ];
  }

  const summary: string[] = [];

  summary.push(
    `memory_entries:${entries.length}`
  );

  if (signals.recurringShadowAi) {
    summary.push(
      "recurring_shadow_ai_detected"
    );
  }

  if (
    signals.recurringOperationalDependency
  ) {
    summary.push(
      "recurring_operational_ai_dependency_detected"
    );
  }

  if (
    signals.recurringGovernancePressure
  ) {
    summary.push(
      "recurring_governance_pressure_detected"
    );
  }

  if (
    signals.increasingCognitivePressure
  ) {
    summary.push(
      "increasing_cognitive_pressure_detected"
    );
  }

  if (
    signals.stableAiAssistedOperations
  ) {
    summary.push(
      "stable_ai_assisted_operational_patterns_detected"
    );
  }

  return summary;
}

// ============================================================
// CONFIDENCE
// ============================================================

function computeAverageConfidence(
  entries:
    CognitiveWorkflowMemoryEntry[]
): number {

  if (!entries.length) {
    return 0;
  }

  const avg =
    entries.reduce(
      (sum, e) =>
        sum + e.confidence,
      0
    ) / entries.length;

  return round3(avg);
}

// ============================================================
// PRESSURE SCORE
// ============================================================

function pressureScore(
  entry:
    CognitiveWorkflowMemoryEntry
): number {

  switch (
    entry.cognitivePressure
  ) {

    case "COGNITIVE_AUTOMATION_PRESSURE":
      return 1;

    case "AI_DEPENDENCY_PRESSURE":
      return 2;

    case "UNGOVERNED_AI_PRESSURE":
      return 3;

    default:
      return 0;
  }
}

// ============================================================
// MEMORY SNAPSHOT BUILDER
// ============================================================

function buildMemorySnapshot(
  entries:
    CognitiveWorkflowMemoryEntry[],

  signals:
    CognitiveLongitudinalSignals
): CognitiveWorkflowMemorySnapshot {

  const recurringWorkflowScore =
    clamp01(
      entries.filter(
        (e) =>
          e.recurringWorkflowDetected
      ).length / 10
    );

  const operationalDependencyScore =
    clamp01(
      entries.filter(
        (e) =>
          e.operationalAiDependencyDetected
      ).length / 10
    );

  const workflowStabilityScore =
    signals.stableAiAssistedOperations
      ? 0.8
      : recurringWorkflowScore * 0.5;

  const shadowAiPersistenceScore =
    clamp01(
      entries.filter(
        (e) => e.shadowAiDetected
      ).length / 10
    );

  const crossOperationalDependencyScore =
    clamp01(
      (
        operationalDependencyScore * 0.6
      ) +
      (
        recurringWorkflowScore * 0.4
      )
    );

  const constitutionalOperationalMaturity =
    clamp01(
      (
        workflowStabilityScore * 0.4
      ) +
      (
        operationalDependencyScore * 0.3
      ) +
      (
        shadowAiPersistenceScore * 0.3
      )
    );

  const confidence =
    computeAverageConfidence(
      entries
    );

  const snapshotSignals: string[] = [];

  if (signals.recurringShadowAi) {
    snapshotSignals.push(
      "recurring_shadow_ai"
    );
  }

  if (signals.recurringOperationalDependency) {
    snapshotSignals.push(
      "recurring_operational_dependency"
    );
  }

  if (signals.stableAiAssistedOperations) {
    snapshotSignals.push(
      "stable_ai_assisted_operations"
    );
  }

  return {

    recurringWorkflowScore:
      round3(recurringWorkflowScore),

    operationalDependencyScore:
      round3(operationalDependencyScore),

    workflowStabilityScore:
      round3(workflowStabilityScore),

    shadowAiPersistenceScore:
      round3(shadowAiPersistenceScore),

    crossOperationalDependencyScore:
      round3(
        crossOperationalDependencyScore
      ),

    constitutionalOperationalMaturity:
      round3(
        constitutionalOperationalMaturity
      ),

    confidence:
      round3(confidence),

    signals:
      snapshotSignals,
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

  return Math.round(
    value * 1000
  ) / 1000;
}
