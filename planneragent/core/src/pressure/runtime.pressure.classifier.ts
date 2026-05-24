// core/src/pressure/runtime.pressure.classifier.ts
// ============================================================

import type {
  GovernancePressureBreakdown,
  GovernancePressureDomain,
} from "./runtime.pressure.types";

export function resolveDominantPressure(
  breakdown: GovernancePressureBreakdown
): GovernancePressureDomain {

  const ranked = [
    {
      domain: "STRUCTURAL_FRICTION",
      score: breakdown.structuralFriction,
    },
    {
      domain: "WORKFLOW_FATIGUE",
      score: breakdown.workflowFatigue,
    },
    {
      domain: "EXCEPTION_RECURRENCE",
      score: breakdown.exceptionRecurrence,
    },
    {
      domain: "PROCESS_INSTABILITY",
      score: breakdown.processInstability,
    },
    {
      domain: "GOVERNANCE_SATURATION",
      score: breakdown.governanceSaturation,
    },
  ];

  ranked.sort((a, b) => b.score - a.score);

  return ranked[0]
    ?.domain as GovernancePressureDomain;
}