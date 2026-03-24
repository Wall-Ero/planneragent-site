// core/src/decision/policy/policy.resolver.v1.ts
// ======================================================
// Policy Resolver V1
// Combines:
// - Default policy
// - Inferred policy (from history)
// - Context adjustments
// ======================================================

import { DEFAULT_POLICY, PolicyRules } from "./policy.schema.v1";
import { inferPolicyFromHistory } from "./policy.inference.v1";

export function resolvePolicy(input: {
  history?: any[];
}): PolicyRules {

  const inferred = inferPolicyFromHistory({
    actionsHistory: input.history ?? []
  });

  return {
    ...DEFAULT_POLICY,
    ...inferred,
    weights: {
      ...DEFAULT_POLICY.weights,
      ...(inferred as any).weights
    }
  };
}