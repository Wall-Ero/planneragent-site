import { D1Database } from "@cloudflare/workers-types";
import { LlmCostType } from "./llmcontracts";

/**
 * Single LLM usage log entry
 * This is WRITE-ONLY: no logic, no branching
 */
export interface LlmUsageLog {
  requestId: string;
  companyId: string;

  providerId: string;     // openai | openrouter | oss | mock
  costType: LlmCostType;  // paid | openrouter | oss | mock

  success: boolean;
  error?: string;

  estimatedCostEur: number;
  createdAt: string;
}

/**
 * Persist LLM usage into D1
 */
export async function logLlmUsage(
  db: D1Database,
  log: LlmUsageLog
): Promise<void> {
  await db
    .prepare(
      `
      INSERT INTO llm_usage (
        request_id,
        company_id,
        provider_id,
        cost_type,
        success,
        error,
        estimated_cost_eur,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      log.requestId,
      log.companyId,
      log.providerId,
      log.costType,
      log.success ? 1 : 0,
      log.error ?? null,
      log.estimatedCostEur,
      log.createdAt
    )
    .run();
}