// core/src/sandbox/dqm.ts
// ===============================
// Decision Quality Metrics v2
// Planner-aware ranking layer
// Canonical Source of Truth
// ===============================

type DqmWeights = {
  service: number;
  stability: number;
  cost: number;
  structural: number;
  confidence: number;
};

type DqmMetrics = {
  lateness_days_weighted: number;
  late_orders: number;
  inventory_negatives_count: number;
  plan_churn_index: number;
  cost_proxy: number;
  serviceShortfall?: number;
  shortage_units?: number;

  // v2 planner-aware additions
  action_count?: number;
  action_type_count?: number;
  assumption_count?: number;
  isolated_action_count?: number;
  topology_missing?: boolean;
  confidence_score?: number;
};

// --------------------------------
// Helpers
// --------------------------------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function invertMinBetter(value: number, softMax: number): number {
  return clamp01(1 - value / Math.max(softMax, 1e-9));
}

function ratio(value: number, max: number): number {
  return clamp01(value / Math.max(max, 1e-9));
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeWeights(weights: DqmWeights): DqmWeights {
  const total =
    Math.max(0, weights.service) +
    Math.max(0, weights.stability) +
    Math.max(0, weights.cost) +
    Math.max(0, weights.structural) +
    Math.max(0, weights.confidence);

  if (total <= 0) {
    return {
      service: 0.2,
      stability: 0.2,
      cost: 0.2,
      structural: 0.2,
      confidence: 0.2
    };
  }

  return {
    service: Math.max(0, weights.service) / total,
    stability: Math.max(0, weights.stability) / total,
    cost: Math.max(0, weights.cost) / total,
    structural: Math.max(0, weights.structural) / total,
    confidence: Math.max(0, weights.confidence) / total
  };
}

// --------------------------------
// Structural intelligence v2
// --------------------------------

function computeStructuralScore(
  baseline: DqmMetrics,
  scenario: DqmMetrics
): number {
  const actionCount = num(scenario.action_count, 0);
  const actionTypeCount = num(scenario.action_type_count, 0);
  const assumptionCount = num(scenario.assumption_count, 0);
  const isolatedActionCount = num(scenario.isolated_action_count, 0);
  const topologyMissing = Boolean(scenario.topology_missing);

  let diversityScore = 0.4;
  if (actionTypeCount === 0) diversityScore = 0.2;
  else if (actionTypeCount === 1) diversityScore = 0.55;
  else if (actionTypeCount === 2) diversityScore = 0.9;
  else diversityScore = 0.7;

  const complexityPenalty = ratio(Math.max(0, actionCount - 2), 4) * 0.35;
  const assumptionPenalty = ratio(assumptionCount, 4) * 0.35;
  const isolationPenalty =
    ratio(isolatedActionCount, Math.max(actionCount, 1)) * 0.3;
  const topologyPenalty = topologyMissing ? 0.2 : 0;
  const baselinePenalty = baseline.topology_missing ? 0.05 : 0;

  const score =
    diversityScore -
    complexityPenalty -
    assumptionPenalty -
    isolationPenalty -
    topologyPenalty -
    baselinePenalty;

  return clamp01(score);
}

function computeConfidenceScore(
  scenario: DqmMetrics
): number {
  return clamp01(num(scenario.confidence_score, 0.5));
}

// --------------------------------
// Main function
// --------------------------------

export function computeDqmV2(
  baseline: DqmMetrics,
  scenario: DqmMetrics,
  feasible: boolean,
  weights: DqmWeights
) {
  const normalizedWeights = normalizeWeights(weights);

  const latenessSoftMax = Math.max(baseline.lateness_days_weighted * 1.5, 1);
  const costSoftMax = Math.max(baseline.cost_proxy * 2, 1);

  const baselineShortageUnits = Math.max(0, num(baseline.shortage_units, 0));
  const scenarioShortageUnits = Math.max(0, num(scenario.shortage_units, 0));
  const shortageReduction = Math.max(
    0,
    baselineShortageUnits - scenarioShortageUnits
  );
  const shortageReductionRatio =
    baselineShortageUnits > 0
      ? shortageReduction / baselineShortageUnits
      : 1;

  const serviceLevel = 1 - clamp01(num(scenario.serviceShortfall, 1));

  const latenessComponent = invertMinBetter(
    scenario.lateness_days_weighted,
    latenessSoftMax
  );

  const service = (serviceLevel * 0.7) + (latenessComponent * 0.3);

  const stability = invertMinBetter(
    scenario.plan_churn_index,
    1
  );

  const cost = invertMinBetter(
    scenario.cost_proxy,
    costSoftMax
  );

  const structural = computeStructuralScore(baseline, scenario);
  const confidence = computeConfidenceScore(scenario);

  let score =
    normalizedWeights.service * service +
    normalizedWeights.stability * stability +
    normalizedWeights.cost * cost +
    normalizedWeights.structural * structural +
    normalizedWeights.confidence * confidence;

  // --------------------------------
  // HARD FEASIBILITY GATE
  // --------------------------------

  if (!feasible) {
    score = Math.min(score, 0.15);
  }

  // --------------------------------
  // HARD GATE — plans that do not reduce shortage
  // If baseline has shortage and scenario does not improve it,
  // the plan must not win the ranking.
  // --------------------------------

  if (baselineShortageUnits > 0 && shortageReduction <= 0) {
    score = 0;
  }

  // --------------------------------
  // SHORTAGE IMPROVEMENT FACTOR
  // Reward plans that actually reduce shortage
  // --------------------------------

  score *= shortageReductionRatio;

  // --------------------------------
  // SAFE MODE SERVICE FLOOR
  // SAFE must not become passive
  // --------------------------------

  const serviceShortfall = 1 - service;
  const isSafeMode = normalizedWeights.stability >= 0.6;

  if (isSafeMode) {
    if (serviceShortfall >= 1) score *= 0.05;
    else if (serviceShortfall >= 0.5) score *= 0.3;
    else if (serviceShortfall >= 0.2) score *= 0.6;
  }

  // --------------------------------
  // SOFT RISK PENALTY
  // Penalize, do not hard-exclude
  // --------------------------------

  const riskScore =
    ratio(num(scenario.assumption_count, 0), 4) +
    ratio(
      num(scenario.isolated_action_count, 0),
      Math.max(num(scenario.action_count, 1), 1)
    );

  if (isSafeMode) {
    score *= 1 - (Math.min(1, riskScore) * 0.5);
  }

  // --------------------------------
  // Final normalization
  // Score must remain in 0..100
  // --------------------------------

  score = clamp01(score);

  const finalScore = Math.round(score * 1000) / 10;

  return {
    normalized: {
      service,
      stability,
      cost,
      structural,
      confidence,
      shortage_reduction_ratio: Math.round(shortageReductionRatio * 1000) / 1000
    },
    score: finalScore
  };
}

// --------------------------------
// Backward-compatible v1 wrapper
// --------------------------------

export function computeDqmV1(
  baseline: DqmMetrics,
  scenario: DqmMetrics,
  feasible: boolean,
  weights: {
    service: number;
    stability: number;
    cost: number;
  }
) {
  return computeDqmV2(
    baseline,
    scenario,
    feasible,
    {
      service: weights.service,
      stability: weights.stability,
      cost: weights.cost,
      structural: 0,
      confidence: 0
    }
  );
}

// --------------------------------
// Scenario scorer
// --------------------------------

export function scoreScenario(
  scenario: { confidence: number },
  _dl: unknown
): number {
  return scenario.confidence;
}

// --------------------------------
// Types
// --------------------------------

export type {
  DqmWeights,
  DqmMetrics
};