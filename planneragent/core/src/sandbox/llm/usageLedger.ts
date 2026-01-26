// src/sandbox/llm/usageLedger.ts


import { D1Database } from "@cloudflare/workers-types";

/**
 * Canonical LLM Usage Log Entry
 * Board-readable, audit-safe, governance-grade
 */
export interface LlmUsageLog {
  /** primary key */
  id: string;

  /** correlation id (sandbox event / decision id) */
  requestId: string;

  /** tenant / company */
  companyId: string;

  /** BASIC | JUNIOR | SENIOR */
  plan: "BASIC" | "JUNIOR" | "SENIOR";

  /** openai | openrouter | oss | mock */
  providerId: string;

  /** paid | free | oss */
  providerType: "paid" | "free" | "oss";

  /** model name if available */
  model?: string;

  /** token usage */
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;

  /** estimated or real EUR cost */
  costEur: number;

  /** success flag */
  success: boolean;

  /** fallback provider used */
  fallback: boolean;

  /** ISO timestamp */
  createdAt: string;
}

/**
 * Persist LLM usage into D1
 * This is WRITE-ONLY and GOVERNANCE-CRITICAL
 */
export async function logLlmUsage(
  db: D1Database,
  log: LlmUsageLog
): Promise<void> {
  await db
    .prepare(
      `
      INSERT INTO llm_usage (
        id,
        created_at,
        company_id,
        plan,
        provider_id,
        model,
        provider_type,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        cost_eur,
        success,
        fallback,
        request_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      log.id,
      log.createdAt,
      log.companyId,
      log.plan,
      log.providerId,
      log.model ?? null,
      log.providerType,
      log.promptTokens ?? null,
      log.completionTokens ?? null,
      log.totalTokens ?? null,
      log.costEur,
      log.success ? 1 : 0,
      log.fallback ? 1 : 0,
      log.requestId
    )
    .run();
}
