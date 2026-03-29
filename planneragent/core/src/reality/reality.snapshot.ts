// core/src/reality/reality.snapshot.ts
// ======================================================
// PlannerAgent — Reality Snapshot Builder
// Canonical Source of Truth
// ======================================================

import type {
  RealitySnapshot,
  ObservedReality,
  ReconstructedReality,
  AssumedReality,
  ConfidenceMap,
  DataAwarenessLevel,
  BomDivergenceMap,
  ProcessInstabilitySignal
} from "./reality.types";

import { AssumptionRegistry } from "./assumption.registry";

export function createRealitySnapshot(params: {
  observed: ObservedReality;
  reconstructed: ReconstructedReality;
  assumed: AssumedReality;

  confidence: ConfidenceMap;

  awareness_level: DataAwarenessLevel;

  assumptions: AssumptionRegistry;

  reality_score?: number;

  bom_divergence?: BomDivergenceMap;
  process_instability?: ProcessInstabilitySignal;

  fusion?: unknown;
  twinSnapshot?: unknown;
  signals?: unknown[];
}): RealitySnapshot {

  return {
    observed: params.observed,
    reconstructed: params.reconstructed,
    assumed: params.assumed,

    awareness_level: params.awareness_level,

    confidence: params.confidence,

    assumptions: params.assumptions.list(),

    reality_score: params.reality_score ?? null,

    bom_divergence: params.bom_divergence,
    process_instability: params.process_instability,

    fusion: params.fusion,
    twinSnapshot: params.twinSnapshot,
    signals: params.signals ?? [],

    created_at: new Date().toISOString(),
  };
}