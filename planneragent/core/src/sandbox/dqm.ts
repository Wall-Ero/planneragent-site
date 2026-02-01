//core/src/sandbox/dqm.ts

// ===============================
// Decision Quality Metrics v1
// ===============================

type DqmWeights = {
  service: number;
  stability: number;
  cost: number;
};

type DqmMetrics = {
  lateness_days_weighted: number;
  late_orders: number;
  inventory_negatives_count: number;
  plan_churn_index: number;
  cost_proxy: number;
};

//helper
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function invertMinBetter(value: number, softMax: number) {
  return clamp01(1 - value / Math.max(softMax, 1e-9));
}

//funzione principlae
export function computeDqmV1(
  baseline: DqmMetrics,
  scenario: DqmMetrics,
  feasible: boolean,
  weights: DqmWeights
) {
  const latenessSoftMax = Math.max(baseline.lateness_days_weighted * 1.5, 1);
  const costSoftMax = Math.max(baseline.cost_proxy * 2, 1);

  const service = invertMinBetter(scenario.lateness_days_weighted, latenessSoftMax);
  const stability = invertMinBetter(scenario.plan_churn_index, 1);
  const cost = invertMinBetter(scenario.cost_proxy, costSoftMax);

  let score =
    weights.service * service +
    weights.stability * stability +
    weights.cost * cost;

  if (!feasible) score = Math.min(score, 0.15);

  return {
    normalized: { service, stability, cost },
    score: Math.round(score * 1000) / 10
  };
}

// tipi
export type { DqmWeights, DqmMetrics}

export function scoreScenario(
  scenario: { confidence: number  },
  _dl: unknown
): number {
      return scenario.confidence;
  }
