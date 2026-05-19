// core/src/governance/emergence/governance.emergence.memory.ts
// ============================================================
// PlannerAgent — Governance Emergence Memory V1
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Persist and observe governance emergence evolution over time.
//
// This layer DOES NOT:
// - activate authority
// - upgrade authority
// - modify governance
// - change runtime behavior
// - approve execution
// - expand delegation scope
//
// It DOES:
// - persist governance emergence snapshots
// - observe governance pressure longitudinally
// - detect recurring governance patterns
// - detect stable delegation emergence
// - detect constitutional governance pressure
// - classify governance confidence evolution
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance maturity is observed longitudinally.
//
// Authority activation always remains human-controlled.
//
// ============================================================

import type {
  AuthorityLevel,
  GovernancePressure,
  GovernanceEmergenceSignal,
} from "./governance.emergence.engine";

// ============================================================
// MEMORY RECORD
// ============================================================

export interface GovernanceEmergenceMemoryRecord {
  company_id: string;

  issued_at: string;

  currentAuthority: AuthorityLevel;

  dominantPressure: GovernancePressure;

  governanceConfidence: number;

  pressures: GovernanceEmergenceSignal[];

  emergenceSummary: string[];
}

// ============================================================
// LONGITUDINAL TIMELINE
// ============================================================

export interface GovernanceEmergenceTimeline {
  company_id: string;

  totalSnapshots: number;

  firstObservedAt?: string;
  lastObservedAt?: string;

  dominantPressureFrequency: Record<string, number>;

  recurringPressures: GovernancePressure[];

  stableDelegationDetected: boolean;

  constitutionalPressureDetected: boolean;

  governanceConfidenceTrend:
    | "INCREASING"
    | "STABLE"
    | "DECREASING";
}

// ============================================================
// APPEND MEMORY
// ============================================================

export function appendGovernanceEmergenceMemory(
  memory: GovernanceEmergenceMemoryRecord[],
  record: GovernanceEmergenceMemoryRecord
): GovernanceEmergenceMemoryRecord[] {

  return [
    ...memory,
    record,
  ].sort((a, b) =>
    a.issued_at.localeCompare(b.issued_at)
  );
}

// ============================================================
// BUILD TIMELINE
// ============================================================

export function buildGovernanceEmergenceTimeline(
  memory: GovernanceEmergenceMemoryRecord[]
): GovernanceEmergenceTimeline {

  // ----------------------------------------------------------
  // EMPTY MEMORY
  // ----------------------------------------------------------

  if (!memory.length) {
    return {
      company_id: "unknown",

      totalSnapshots: 0,

      dominantPressureFrequency: {},

      recurringPressures: [],

      stableDelegationDetected: false,

      constitutionalPressureDetected: false,

      governanceConfidenceTrend: "STABLE",
    };
  }

  // ----------------------------------------------------------
  // PRESSURE FREQUENCY
  // ----------------------------------------------------------

  const dominantPressureFrequency:
    Record<string, number> = {};

  for (const m of memory) {

    dominantPressureFrequency[m.dominantPressure] =
      (dominantPressureFrequency[
        m.dominantPressure
      ] ?? 0) + 1;
  }

  // ----------------------------------------------------------
  // RECURRING PRESSURES
  // ----------------------------------------------------------

  const recurringPressures =
    Object.entries(dominantPressureFrequency)
      .filter(([, count]) => count >= 3)
      .map(([pressure]) =>
        pressure as GovernancePressure
      );

  // ----------------------------------------------------------
  // STABLE DELEGATION
  // ----------------------------------------------------------

  const stableDelegationDetected =
    (dominantPressureFrequency[
      "DELEGATION_PRESSURE"
    ] ?? 0) >= 5;

  // ----------------------------------------------------------
  // CONSTITUTIONAL PRESSURE
  // ----------------------------------------------------------

  const constitutionalPressureDetected =
    (dominantPressureFrequency[
      "CONSTITUTIONAL_PRESSURE"
    ] ?? 0) > 0;

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {

    company_id:
      memory[0]?.company_id ?? "unknown",

    totalSnapshots:
      memory.length,

    firstObservedAt:
      memory[0]?.issued_at,

    lastObservedAt:
      memory[memory.length - 1]?.issued_at,

    dominantPressureFrequency,

    recurringPressures,

    stableDelegationDetected,

    constitutionalPressureDetected,

    governanceConfidenceTrend:
      resolveConfidenceTrend(memory),
  };
}

// ============================================================
// GOVERNANCE TREND
// ============================================================

function resolveConfidenceTrend(
  memory: GovernanceEmergenceMemoryRecord[]
): "INCREASING" | "STABLE" | "DECREASING" {

  if (memory.length < 2) {
    return "STABLE";
  }

  const first =
    memory[0]?.governanceConfidence ?? 0;

  const last =
    memory[memory.length - 1]
      ?.governanceConfidence ?? 0;

  const delta = last - first;

  if (delta > 0.1) {
    return "INCREASING";
  }

  if (delta < -0.1) {
    return "DECREASING";
  }

  return "STABLE";
}