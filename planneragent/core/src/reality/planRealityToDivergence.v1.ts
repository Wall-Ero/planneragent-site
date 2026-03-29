//core/src/reality/planRealityToDivergence.v1.ts

// ======================================================
// PlannerAgent — PlanReality → Divergence Bridge
// Canonical Source of Truth
//
// Converts detailed PlanRealityDiff into
// structured divergence signal for scoring.
//
// Keeps deterministic logic.
// No heuristics beyond normalization.
// ======================================================

import type { PlanRealityDiff } from "../sandbox/reality/planRealityDiff.v1";

export type BomDivergenceSignal = {
  has_divergence: boolean;

  mismatch_count: number;
  missing_components: number;

  avg_delta: number;
  max_delta: number;

  severity: number; // 0 → 1
};

export function computeBomDivergence(
  diff: PlanRealityDiff
): BomDivergenceSignal {

  const mismatches = diff?.mismatches ?? [];

  if (mismatches.length === 0) {
    return {
      has_divergence: false,
      mismatch_count: 0,
      missing_components: 0,
      avg_delta: 0,
      max_delta: 0,
      severity: 0
    };
  }

  let totalDelta = 0;
  let maxDelta = 0;
  let missing = 0;

  for (const m of mismatches) {

    const absDelta = Math.abs(m.delta);

    totalDelta += absDelta;

    if (absDelta > maxDelta) {
      maxDelta = absDelta;
    }

    if (m.actual_ratio === 0) {
      missing++;
    }
  }

  const avgDelta =
    mismatches.length > 0
      ? totalDelta / mismatches.length
      : 0;

  // ------------------------------------------------------
  // SEVERITY MODEL (deterministic)
  // ------------------------------------------------------
  // components:
  // - volume: how many mismatches
  // - intensity: avg delta
  // - critical: missing components
  // ------------------------------------------------------

  const volumeScore = clamp01(mismatches.length * 0.1);
  const intensityScore = clamp01(avgDelta);
  const missingScore = clamp01(missing * 0.2);

  const severity =
    0.4 * volumeScore +
    0.4 * intensityScore +
    0.2 * missingScore;

  return {
    has_divergence: true,
    mismatch_count: mismatches.length,
    missing_components: missing,
    avg_delta: round3(avgDelta),
    max_delta: round3(maxDelta),
    severity: round3(severity)
  };
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}