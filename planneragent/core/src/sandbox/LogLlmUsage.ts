import type { D1Database } from "@cloudflare/workers-types";
import type { LlmResultV2 } from "./llm.v2";

/* ================================
 * Types
 * ================================ */

export type LlmUsageLogV2 = {
  id: string;
  companyId: string;
  plan: string;
  domain: string;
  intent: string;
  providerId: string;
  model: string;
  status: "success" | "error";
  requestId?: string,
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  createdAt: string;
};

/* ================================
 * Low-level single row insert
 * ================================ */

export async function logLlmUsage(
  db: D1Database,
  log: LlmUsageLogV2
) {
  await db
    .prepare(`
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
    request_id,
    domain,
    intent
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
  .bind(
  log.id,
  log.createdAt,
  log.companyId,
  log.plan,
  log.providerId,
  log.model,
  "paid", // o "oss" o "free" — per ora hardcoded
  log.tokensIn,
  log.tokensOut,
  (log.tokensIn + log.tokensOut),
  0, // cost_eur (stimato dopo, budget engine)
  log.status === "success" ? 1 : 0,
  0, // fallback
  log.requestId ?? null,
  log.domain,
  log.intent
)
    .run();
}

/* ================================
 * Orchestrator helper (fanout safe)
 * ================================ */

export async function logLlmFanoutV2(
  db: D1Database | undefined,
  meta: {
    companyId: string;
    plan: string;
    domain: string;
    intent: string;
  },
  results: LlmResultV2[]
) {
  if (!db) return;

  const now = new Date().toISOString();

  for (const r of results) {
    await logLlmUsage(db, {
      id: crypto.randomUUID(),
      companyId: meta.companyId,
      plan: meta.plan,
      domain: meta.domain,
      intent: meta.intent,
      providerId: r.provider,
      model: r.model,
      status: r.ok ? "success" : "error",
      tokensIn: r.usage?.tokens_in ?? 0,
      tokensOut: r.usage?.tokens_out ?? 0,
      latencyMs: r.latency_ms ?? 0,
      createdAt: now
    });
  }
}
