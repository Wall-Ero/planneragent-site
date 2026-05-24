// core/src/pressure/runtime.pressure.summary.ts
// ============================================================

import type {
  GovernancePressureResult,
} from "./runtime.pressure.types";

export function buildPressureSummary(
  result: GovernancePressureResult
): string[] {

  const summary: string[] = [];

  summary.push(
    `pressure:${result.level}`
  );

  summary.push(
    `trend:${result.trend}`
  );

  summary.push(
    `dominant:${result.dominantPressure}`
  );

  summary.push(
    `risk:${result.stabilizationRisk}`
  );

  if (result.breakdown.structuralFriction >= 0.7) {
    summary.push(
      "organization_working_against_itself"
    );
  }

  if (result.breakdown.workflowFatigue >= 0.7) {
    summary.push(
      "human_cognitive_load_accumulating"
    );
  }

  if (result.breakdown.governanceSaturation >= 0.7) {
    summary.push(
      "governance_becoming_operational_bottleneck"
    );
  }

  return summary;
}