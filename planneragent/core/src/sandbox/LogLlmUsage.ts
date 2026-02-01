//core/src/sandbox/LogLlmUsage.ts

import type { D1Database } from "@cloudflare/workers-types";
import type { LlmResultV2 } from "./llm.v2";

/* ================================
 * Types
 * ================================ */

export type LlmUsageLogV2 = {
  createdAt: string;

  companyId: string;
  plan: "BASIC" | "JUNIOR" | "SENIOR";

  domain: string;
  intent: string;

  providerId: string;
  model: string;

  tokensIn: number;
  tokensOut: number;

  latencyMs: number;

  status: "success" | "error";

  requestId?: string;

  mode: "sense" | "advise";
};

/* ================================
 * Low-level single row insert
 * ================================ */

export async function logLlmUsage(
  db: D1Database,
  log: LlmUsageLogV2
) {
  await db.prepare(`
    INSERT INTO llm_usage (
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
      intent,
      mode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  .bind(
    log.createdAt,                      // created_at
    log.companyId,                    // company_id
    log.plan,                        // plan
    log.providerId,                 // provider_id
    log.model,                      // model
    "paid",                         // provider_type (hardcoded for now)
    log.tokensIn,                  // prompt_tokens
    log.tokensOut,                // completion_tokens
    log.tokensIn + log.tokensOut, // total_tokens
    0,                             // cost_eur
    log.status === "success" ? 1 : 0, // success
    0,                             // fallback
    log.requestId ?? null,         // request_id
    log.domain,                   // domain
    log.intent,                  // intent
    log.mode                     // mode
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
    plan: "BASIC" | "JUNIOR" | "SENIOR";
    domain: string;
    intent: string;
    mode: "sense" | "advise";
  },
  results: LlmResultV2[]
) {
  if (!db) return;

  const now = new Date().toISOString();
  const requestId = crypto.randomUUID(); // 🔗 1 ciclo = 1 requestId

  for (const r of results) {
    await logLlmUsage(db, {
      createdAt: now,
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

      requestId,
      mode: meta.mode
    });
  }
}