// core/src/decision/policy/policy.engine.v1.ts

import type { PolicyRules } from "./policy.schema.v1";

type Candidate = {
  id: string;
  score: number;

  kpis: {
    serviceShortfall: number;
    estimatedCost: number;
    planChurn: number;
  };

  actions: any[];
};

export function applyPolicy(
  candidates: Candidate[],
  policy: PolicyRules
): Candidate[] {

  return candidates.map(c => {

    let adjusted = c.score;

    adjusted -= policy.weights.service * c.kpis.serviceShortfall * 100;
    adjusted -= policy.weights.cost * c.kpis.estimatedCost;

    if (c.kpis.planChurn > policy.max_plan_churn) {
      adjusted -= 10;
    }

    if (!policy.allow_single_lever && c.actions.length === 1) {
      adjusted -= 15;
    }

    if (policy.prefer_multi_action && c.actions.length >= 2) {
      adjusted += 5;
    }

    return {
      ...c,
      score: Math.round(adjusted * 100) / 100
    };
  });
}