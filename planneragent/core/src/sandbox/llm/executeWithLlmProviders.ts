import { LlmProvider } from "./types";
import { LlmProviderCandidate } from "../llmcontracts";
import { logLlmUsage } from "./logging";

/**
 * Input contract for LLM executio
 */
export interface ExecuteLlmInput {
  db: D1Database;

  companyId: string;
  requestId: string;
  plan: "BASIC" | "JUNIOR" | "SENIOR";

  domain: string;
  intent: string;
  baseline: unknown;

  providers: LlmProviderCandidate[];
}

/**
 * Executes LLM calls using ordered providers with fallback and logging.
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
    domain,
    intent,
    baseline,
    providers,
  } = input;

  for (const candidate of providers) {
    const provider = providerMap[candidate.id];
    if (!provider) continue;

    try {
      const result = await provider.generateScenarios({
        domain,
        intent,
        baseline,
      });

      await logLlmUsage(db, {
        requestId,
        companyId,
        providerId: candidate.id,
        costType: candidate.costType,
        success: true,
        estimatedCostEur: candidate.estimatedCostEur,
        createdAt: new Date().toISOString(),
      });

      return {
        scenarios: result.scenarios,
        providerUsed: candidate.id,
        degraded: false,
      };
    } catch (err) {
      await logLlmUsage(db, {
        requestId,
        companyId,
        providerId: candidate.id,
        costType: candidate.costType,
        success: false,
        error: (err as Error).message,
        estimatedCostEur: candidate.estimatedCostEur,
        createdAt: new Date().toISOString(),
      });

      // try next provider
    }
  }

  throw new Error("All LLM providers failed");
}