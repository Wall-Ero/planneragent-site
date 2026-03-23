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

  // 1) reward reasonable diversification
  // one action type is acceptable, 2 is often planner-like, >3 tends to be churn
  let diversityScore = 0.4;
  if (actionTypeCount === 0) diversityScore = 0.2;
  else if (actionTypeCount === 1) diversityScore = 0.55;
  else if (actionTypeCount === 2) diversityScore = 0.9;
  else diversityScore = 0.7;

  // 2) penalize over-complex plans
  const complexityPenalty = ratio(Math.max(0, actionCount - 2), 4) * 0.35;

  // 3) penalize assumption-heavy logic
  const assumptionPenalty = ratio(assumptionCount, 4) * 0.35;

  // 4) penalize isolated topology actions
  const isolationPenalty = ratio(isolatedActionCount, Math.max(actionCount, 1)) * 0.3;

  // 5) penalize missing topology
  const topologyPenalty = topologyMissing ? 0.2 : 0;

  // 6) optional baseline awareness:
  // if baseline has no action metadata, no issue; this keeps backward compatibility
  const baselinePenalty = baseline.topology_missing ? 0.05 : 0;

  const score =
    diversityScore
    - complexityPenalty
    - assumptionPenalty
    - isolationPenalty
    - topologyPenalty
    - baselinePenalty;

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
  const latenessSoftMax = Math.max(baseline.lateness_days_weighted * 1.5, 1);
  const costSoftMax = Math.max(baseline.cost_proxy * 2, 1);

  const service = invertMinBetter(
    scenario.lateness_days_weighted,
    latenessSoftMax
  );

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
    weights.service * service +
    weights.stability * stability +
    weights.cost * cost +
    weights.structural * structural +
    weights.confidence * confidence;

  if (!feasible) {
    score = Math.min(score, 0.15);
  }

  return {
    normalized: {
      service,
      stability,
      cost,
      structural,
      confidence
    },
    score: Math.round(score * 1000) / 10
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