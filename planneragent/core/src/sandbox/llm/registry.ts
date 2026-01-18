import { LlmProviderCandidate, PlanTier } from "../llmcontracts";

export function resolveLlmProviders(
  plan: PlanTier,
  budgetLeftEur: number
): LlmProviderCandidate[] {
  const providers: LlmProviderCandidate[] = [
    {
      id: "openai",
      allowedFor: ["JUNIOR", "SENIOR"],
      priority: 1,
      costType: "paid",
      estimatedCostEur: 0.04,
    },
    {
      id: "openrouter",
      allowedFor: ["BASIC", "JUNIOR", "SENIOR"],
      priority: 2,
      costType: "openrouter",
      estimatedCostEur: 0.02,
    },
    {
      id: "oss",
      allowedFor: ["BASIC", "JUNIOR", "SENIOR"],
      priority: 99,
      costType: "oss",
      estimatedCostEur: 0,
      fallback: true,
    },
  ];

  return providers
    .filter(p => p.allowedFor.includes(plan))
    .sort((a, b) => a.priority - b.priority);
}