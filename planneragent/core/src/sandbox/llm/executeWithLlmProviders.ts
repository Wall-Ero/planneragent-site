import type { D1Database } from "@cloudflare/workers-types";

import { LlmProvider, LlmProviderResult, LlmUsage } from "./types";
import { LlmProviderCandidate } from "../llmcontracts";
import { writeUsageLedger } from "./usageLedger";

import type { LlmResultV2,LlmUsageV2 } from "../llm.v2";

function mapUsageToV2(
  usage?: LlmUsage
): LlmUsageV2 | undefined {
  if (!usage) return undefined;

  return {
    tokens_in: usage.prompt_tokens,
    tokens_out: usage.completion_tokens,
  };
}

/* ============================================================
 * Types
 * ============================================================
 */

export type LlmExecutionResultV2 = {
  scenarios: any[];
  providerUsed: string;
  degraded: boolean;
  llmResults: LlmResultV2[];
};

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
export type DecisionMode = "sense" | "advise";

/**
 * Input contract for LLM execution
 * LLM never sees authority level, only cognitive mode
 */
export interface ExecuteLlmInput {
  db?: D1Database; // optional → no ledger in sandbox/dev

  companyId: string;
  requestId: string;

  mode: DecisionMode; // 👈 NOT plan

  domain: string;
  intent: string;
  baseline: unknown;

  providers: LlmProviderCandidate[];
}

/* ============================================================
 * Main
 * ============================================================
 */

/**
 * Executes LLM calls using ordered providers with fallback and usage ledger.
 * Stops at first successful provider.
 */
export async function executeWithLlmProviders(
  input: ExecuteLlmInput,
  providerMap: Record<string, LlmProvider>
): Promise<LlmExecutionResultV2> {
  const {
    db,
    companyId,
    requestId,
    mode,
    domain,
    intent,
    baseline,
    providers,
  } = input;

  console.log("[LLM EXEC] called", {
  mode: input.mode,
  providers: input.providers?.map(p => p.id)
});

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

const llmResults: LlmResultV2[] = [
  {
    ok: true,
    call_id: requestId,
    provider: "worker-ai", // oppure candidate.id se vuoi tracciarlo come provider tecnico
    model: result.model ?? "unknown",
    text: "scenario fanout",
    usage: mapUsageToV2(result.usage), // ✅ QUI
  },
];

      // ======================
      // LEDGER — SUCCESS
      // ======================
      if (db) {
        await writeUsageLedger(db, {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),

          company_id: companyId,
          mode: mode,

          provider_id: candidate.id,
          model: llmResults[0]?.model,
          provider_type: mapProviderType(candidate.costType),

          prompt_tokens: llmResults.reduce(
            (sum, r) => sum + (r.usage?.tokens_in ?? 0),
            0
          ),
          completion_tokens: llmResults.reduce(
            (sum, r) => sum + (r.usage?.tokens_out ?? 0),
            0
          ),
          total_tokens: llmResults.reduce(
            (sum, r) =>
              sum +
              (r.usage?.tokens_in ?? 0) +
              (r.usage?.tokens_out ?? 0),
            0
          ),

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
        llmResults,
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
          mode: mode,

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