// core/src/reality/reality.types.ts
// ======================================================
// PlannerAgent — Reality Types
// Canonical Source of Truth
// ======================================================

import type { BomDivergenceSignal } from "./planRealityToDivergence.v1";

// ------------------------------------------------------
// AWARENESS
// ------------------------------------------------------

export type DataAwarenessLevel = 0 | 1 | 2 | 3;

// ------------------------------------------------------
// CONFIDENCE
// ------------------------------------------------------

export type ConfidenceMap = {
  stock: number;
  demand: number;
  lead_time: number;
  bom: number;
};

// ------------------------------------------------------
// REALITY SOURCES
// ------------------------------------------------------

export type RealitySource = "observed" | "reconstructed" | "assumed";

// ------------------------------------------------------
// ASSUMPTIONS
// ------------------------------------------------------

export type AssumptionCategory =
  | "demand"
  | "stock"
  | "bom"
  | "lead_time"
  | "other";

export type AssumptionRecord = {
  id: string;
  category: AssumptionCategory;
  value: number | string | boolean;
  source: RealitySource;
  reason: string;
  confidence: number;
  created_at: string;
};

// ------------------------------------------------------
// DIVERGENCE
// ------------------------------------------------------

export type BomDivergenceMap = {
  master_vs_plan?: boolean;
  plan_vs_reality?: BomDivergenceSignal;
  master_vs_reality?: boolean;
};

// ------------------------------------------------------
// INSTABILITY
// ------------------------------------------------------

export type ProcessInstabilitySignal = {
  components: Array<{
    parent: string;
    component: string;
    variance: number;
    samples: number;
    instability: number;
  }>;
  overall_instability: number;
  unstable_components: number;
};

// ------------------------------------------------------
// REALITY STRUCTURE
// ------------------------------------------------------

export type ObservedReality = Record<string, unknown>;
export type ReconstructedReality = Record<string, unknown>;
export type AssumedReality = Record<string, unknown>;

// ------------------------------------------------------
// SNAPSHOT
// ------------------------------------------------------

export type RealitySnapshot = {
  observed: ObservedReality;
  reconstructed: ReconstructedReality;
  assumed: AssumedReality;

  awareness_level: DataAwarenessLevel;
  confidence: ConfidenceMap;

  assumptions: AssumptionRecord[];

  reality_score?: number | null;

  bom_divergence?: BomDivergenceMap;

  process_instability?: ProcessInstabilitySignal;

  fusion?: unknown;
  twinSnapshot?: unknown;
  signals?: unknown[];

  created_at: string;
};