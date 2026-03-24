// core/src/decision/policy/policy.context.v1.ts

import type { PolicyRules } from "./policy.schema.v1";

export type PolicyInsight = {
  summary: string;
  confidence: number;
  signals: string[];
};

export function buildPolicyContext(
  policy: PolicyRules
): PolicyInsight {

  const signals: string[] = [];

  if (policy.primary_focus === "SERVICE") {
    signals.push("service_priority");
  }

  if (policy.prefer_multi_action) {
    signals.push("multi_action_preference");
  }

  return {
    summary: "Company historically prioritizes service continuity with multi-action recovery",
    confidence: 0.7,
    signals
  };
}