// core/src/decision/policy/policy.inference.v1.ts

import type { PolicyRules } from "./policy.schema.v1";

export function inferPolicyFromHistory(input: {
  actionsHistory?: { type: string }[];
}): Partial<PolicyRules> {

  const history = input.actionsHistory ?? [];

  if (history.length === 0) return {};

  const multiActionRatio =
    history.filter(h => h.type === "MULTI").length / history.length;

  return {
    prefer_multi_action: multiActionRatio > 0.6,
    allow_single_lever: multiActionRatio < 0.4
  };
}