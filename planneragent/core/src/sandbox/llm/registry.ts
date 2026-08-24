// core/src/sandbox/llm/registry.ts
// Sovereignty-aware provider + model registry (Canonical v1)

import { LlmProviderCandidate, PlanTier } from "../llmcontracts";
import type { EconomicClass, SovereigntyPolicyV1 } from "./sovereignty";

function candidateEconomicClass(candidate: LlmProviderCandidate): EconomicClass {
  if (candidate.economicClass) return candidate.economicClass;
  if (candidate.costType === "oss" || candidate.costType === "mock") return "oss";
  return "paid";
}

export function resolveLlmProviders(
  plan: PlanTier,
  budgetRemainingEur: number,
  sovereignty?: SovereigntyPolicyV1,
  candidates?: readonly LlmProviderCandidate[]
): LlmProviderCandidate[] {
  const providers: readonly LlmProviderCandidate[] = candidates ?? [
    { id: "openai", model: "gpt-4o-mini", allowedFor: ["JUNIOR", "SENIOR"], priority: 1, costType: "paid", economicClass: "paid", estimatedCostEur: 0.04 },
    { id: "openrouter", model: "openai/gpt-4o-mini", allowedFor: ["BASIC", "JUNIOR", "SENIOR"], priority: 2, costType: "openrouter", economicClass: "paid", estimatedCostEur: 0.02 },
    { id: "openrouter", model: "openrouter/free", allowedFor: ["VISION", "BASIC", "JUNIOR", "SENIOR"], priority: 3, costType: "openrouter", economicClass: "free", estimatedCostEur: 0 },
    { id: "oss", model: "oss", allowedFor: ["BASIC", "JUNIOR", "SENIOR"], priority: 99, costType: "oss", economicClass: "oss", estimatedCostEur: 0, fallback: true }
  ];

  const allowedEconomic: EconomicClass[] = sovereignty?.allowed ?? ["paid", "free", "oss"];

  return providers
    .filter((candidate) => candidate.allowedFor.includes(plan))
    .filter((candidate) => {
      if (!allowedEconomic.includes(candidateEconomicClass(candidate))) return false;
      const economicClass = candidateEconomicClass(candidate);
      if (economicClass === "oss") return true;
      if (plan === "BASIC" && economicClass === "paid") return budgetRemainingEur >= candidate.estimatedCostEur;
      return true;
    })
    .sort((left, right) => left.priority - right.priority);
}
