import type { D1Database } from "@cloudflare/workers-types";

import { LlmProvider, LlmProviderResult } from "./types";
import { LlmProviderCandidate } from "../llmcontracts";
import { writeUsageLedger } from "./usageLedger";

/**
 * Maps technical provider cost type → economic provider category
 */
function mapProviderType(
  costType: "openrouter" | "mock" | "free" | "paid" | "oss"
): "oss" | "free" | "paid" {
  switch (costType) {
    case "free":
      return "free";
    case "paid":
      return "paid";
    case "oss":
      return "oss";
    case "openrouter":
    case "mock":
    default:
      return "oss";
  }
}

/**
 * Input contract for LLM execution
 */
export interface ExecuteLlmInput {
  db?: D1Database; // optional → no ledger in sandbox/dev

  companyId: string;
  requestId: string;
  plan: "BASIC" | "JUNIOR" | "SENIOR";

  domain: string;
  intent: string;
  baseline: unknown;

  providers: LlmProviderCandidate[];
}

/**
 * Executes LLM calls using ordered providers with fallback and usage ledger.
 * Stops at first successful provider.
 */
export async function executeWithLlmProviders(
  input: ExecuteLlmInput,
  providerMap: Record<string, LlmProvider>
): Promise<{
  scenarios: any[];
  providerUsed: string;
  degraded: boolean;
}> {
  const {
    db,
    companyId,
    requestId,
    plan,
    domain,
    intent,
    baseline,
    providers,
  } = input;

  let usedFallback = false;

  for (let i = 0; i < providers.length; i++) {
    const candidate = providers[i];
    const provider = providerMap[candidate.id];

    if (!provider) {
      usedFallback = true;
      continue;
    }

    try {
      const result: LlmProviderResult =
        await provider.generateScenarios({
          domain,
          intent,
          baseline,
        });

      // ======================
      // LEDGER — SUCCESS
      // ======================
      if (db) {
        await writeUsageLedger(db, {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),

          company_id: companyId,
          plan,

          provider_id: candidate.id,
          model: result.model ?? undefined,
          provider_type: mapProviderType(candidate.costType),

          prompt_tokens: result.usage?.prompt_tokens,
          completion_tokens: result.usage?.completion_tokens,
          total_tokens: result.usage?.total_tokens,

          cost_eur: candidate.estimatedCostEur,
          success: true,
          fallback: usedFallback,

          request_id: requestId,
        });
      }

      return {
        scenarios: result.scenarios,
        providerUsed: candidate.id,
        degraded: usedFallback,
      };
    } catch (err) {
      usedFallback = true;

      // ======================
      // LEDGER — FAILURE
      // ======================
      if (db) {
        await writeUsageLedger(db, {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),

          company_id: companyId,
          plan,

          provider_id: candidate.id,
          provider_type: mapProviderType(candidate.costType),

          cost_eur: candidate.estimatedCostEur,
          success: false,
          fallback: true,

          request_id: requestId,
        });
      }

      // fallback → try next provider
    }
  }

  throw new Error("All LLM providers failed");
}