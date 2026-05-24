// core/src/pressure/runtime.governance.pressure.engine.ts
// ============================================================
// PlannerAgent — Runtime Governance Pressure Engine
// Canonical Source of Truth
// ============================================================

import type {
  GovernancePressureEvidence,
  GovernancePressureBreakdown,
  GovernancePressureResult,
} from "./runtime.pressure.types";

import {
  pressureLevelFromScore,
  stabilizationRiskFromScore,
  clamp01,
  round3,
} from "./runtime.pressure.thresholds";

import {
  resolveDominantPressure,
} from "./runtime.pressure.classifier";

import {
  computePressureTrend,
} from "./runtime.pressure.timeline";

import {
  buildPressureSummary,
} from "./runtime.pressure.summary";

export function evaluateRuntimeGovernancePressure(params: {

  evidence: GovernancePressureEvidence;

  previousPressureScores?: number[];

}): GovernancePressureResult {

  const {
    evidence,
    previousPressureScores = [],
  } = params;

  const breakdown: GovernancePressureBreakdown = {

    structuralFriction:
      round3(
        clamp01(
          evidence.rollbackRate * 0.25 +
          evidence.overrideRate * 0.25 +
          evidence.correctionFailureRate * 0.25 +
          evidence.decisionChurn * 0.25
        )
      ),

    workflowFatigue:
      round3(
        clamp01(
          normalizeCount(
            evidence.repeatedApprovals,
            50
          ) * 0.4 +

          normalizeCount(
            evidence.manualInterventions,
            50
          ) * 0.4 +

          normalizeCount(
            evidence.governanceReviews,
            20
          ) * 0.2
        )
      ),

    exceptionRecurrence:
      round3(
        clamp01(
          normalizeCount(
            evidence.recurringExceptions,
            25
          )
        )
      ),

    processInstability:
      round3(
        clamp01(
          normalizeCount(
            evidence.unstableExecutions,
            25
          ) * 0.5 +

          evidence.reconciliationVolatility * 0.5
        )
      ),

    governanceSaturation:
      round3(
        clamp01(
          normalizeCount(
            evidence.delegatedExecutionLoad,
            100
          ) * 0.4 +

          normalizeCount(
            evidence.unresolvedGovernancePressure,
            20
          ) * 0.6
        )
      ),
  };

  const pressureScore =
    round3(
      (
        breakdown.structuralFriction +
        breakdown.workflowFatigue +
        breakdown.exceptionRecurrence +
        breakdown.processInstability +
        breakdown.governanceSaturation
      ) / 5
    );

  const level =
    pressureLevelFromScore(
      pressureScore
    );

  const trend =
    computePressureTrend(
      previousPressureScores,
      pressureScore
    );

  const dominantPressure =
    resolveDominantPressure(
      breakdown
    );

  const stabilizationRisk =
    stabilizationRiskFromScore(
      pressureScore
    );

  const result: GovernancePressureResult = {

    level,

    trend,

    dominantPressure,

    stabilizationRisk,

    breakdown,

    pressureScore,

    governanceRelevant:
      pressureScore >= 0.5,

    summary: [],
  };

  result.summary =
    buildPressureSummary(result);

  return result;
}

function normalizeCount(
  value: number,
  target: number
): number {

  if (target <= 0) {
    return 0;
  }

  return clamp01(
    value / target
  );
}