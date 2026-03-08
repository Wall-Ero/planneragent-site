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
  ConfidenceMap
} from "./reality.types";

import { AssumptionRegistry } from "./assumption.registry";

export function createRealitySnapshot(params: {
  observed: ObservedReality;
  reconstructed: ReconstructedReality;
  assumed: AssumedReality;
  confidence: ConfidenceMap;
  awareness_level: number;
  assumptions: AssumptionRegistry;

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

    fusion: params.fusion,
    twinSnapshot: params.twinSnapshot,
    signals: params.signals ?? [],

    created_at: new Date().toISOString()
  };
}