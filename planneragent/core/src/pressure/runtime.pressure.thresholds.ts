// core/src/pressure/runtime.pressure.thresholds.ts
// ============================================================

import type {
  GovernancePressureLevel,
  StabilizationRisk,
} from "./runtime.pressure.types";

export function pressureLevelFromScore(
  score: number
): GovernancePressureLevel {

  if (score >= 0.9) return "CRITICAL";
  if (score >= 0.75) return "HIGH";
  if (score >= 0.5) return "MEDIUM";
  if (score >= 0.25) return "LOW";

  return "NONE";
}

export function stabilizationRiskFromScore(
  score: number
): StabilizationRisk {

  if (score >= 0.75) return "HIGH";
  if (score >= 0.45) return "MEDIUM";

  return "LOW";
}

export function clamp01(
  value: number
): number {

  return Math.max(
    0,
    Math.min(1, value)
  );
}

export function round3(
  value: number
): number {

  return Math.round(value * 1000) / 1000;
}
