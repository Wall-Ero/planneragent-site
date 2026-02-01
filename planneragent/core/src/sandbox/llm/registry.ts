// core/src/sandbox/llm/registry.ts
// Sovereignty-aware provider registry (Canonical v1)

import { LlmProviderCandidate, PlanTier } from "../llmcontracts";
import type { EconomicClass, SovereigntyPolicyV1 } from "./sovereignty";

/* ================================
 * Helpers
 * ================================ */

/**
 * Maps provider technical costType → sovereignty economic class
 */
function candidateEconomicClass(
  costType: LlmProviderCandidate["costType"],
  budgetRemainingEur: number
): EconomicClass {
  switch (costType) {
    case "paid":
      return "paid";

    case "oss":
    case "mock":
      return "oss";

    case "openrouter":
      // OpenRouter can route to paid models.
      // Sovereignty rule:
      // - budget > 0  → treat as paid
      // - budget == 0 → treat as free (and likely filtered out)
      return budgetRemainingEur > 0 ? "paid" : "free";

    default:
      return "oss";
  }
}

/* ================================
 * Public API
 * ================================ */

export function resolveLlmProviders(
  plan: PlanTier,
  budgetRemainingEur: number,
  sovereignty?: SovereigntyPolicyV1
): LlmProviderCandidate[] {
  const providers: LlmProviderCandidate[] = [
    {
      id: "openai",
      allowedFor: ["JUNIOR", "SENIOR"],
      priority: 1,
      costType: "paid",
      estimatedCostEur: 0.04
    },
    {
      id: "openrouter",
      allowedFor: ["BASIC", "JUNIOR", "SENIOR"],
      priority: 2,
      costType: "openrouter",
      estimatedCostEur: 0.02
    },
    {
      id: "oss",
      allowedFor: ["BASIC", "JUNIOR", "SENIOR"],
      priority: 99,
      costType: "oss",
      estimatedCostEur: 0,
      fallback: true
    }
  ];

  const allowedEconomic: EconomicClass[] =
    sovereignty?.allowed ?? ["paid", "free", "oss"];

  return providers
    // Plan gate
    .filter(p => p.allowedFor.includes(plan))

    // Sovereignty + budget gate
    .filter(p => {
      const econClass = candidateEconomicClass(
        p.costType,
        budgetRemainingEur
      );

      // Enforce sovereignty class filter
      if (!allowedEconomic.includes(econClass)) return false;

      // OSS is always allowed (sovereign fallback)
      if (p.costType === "oss") return true;

      // BASIC must respect remaining budget for paid routes
      if (plan === "BASIC") {
        return budgetRemainingEur >= (p.estimatedCostEur ?? 0);
      }

      // JUNIOR/SENIOR always allowed (they pay)
      return true;
    })

    // Priority: lower number = tried first
    .sort((a, b) => a.priority - b.priority);
}