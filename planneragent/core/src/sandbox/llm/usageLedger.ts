import type { D1Database } from "@cloudflare/workers-types";

export type LlmUsageLedgerEntry = {
  id: string;
  created_at: string;

  company_id: string;
  mode: "sense" | "advise";

  provider_id: string;      // openai | openrouter | oss | mock
  model?: string;          // gpt-4o-mini, mistral-7b, etc
  provider_type: "paid" | "free" | "oss";

  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;

  cost_eur: number;
  success: boolean;
  fallback: boolean;

  request_id?: string;
};

export async function writeUsageLedger(
  db: D1Database,
  entry: LlmUsageLedgerEntry
) {
  await db
    .prepare(`
      INSERT INTO llm_usage (
        id,
        created_at,

        company_id,
        mode,

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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      entry.id,
      entry.created_at,

      entry.company_id,
      entry.mode,

      entry.provider_id,
      entry.model ?? null,
      entry.provider_type,

      entry.prompt_tokens ?? null,
      entry.completion_tokens ?? null,
      entry.total_tokens ?? null,

      entry.cost_eur,
      entry.success ? 1 : 0,
      entry.fallback ? 1 : 0,

      entry.request_id ?? null
    )
    .run();
}