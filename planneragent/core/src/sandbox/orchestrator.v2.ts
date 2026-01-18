// src/sandbox/orchestrator.v2.ts

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioAdvisoryV2,
} from "./contracts.v2";

import { createProviderMap } from "./llm/providerMap";
import type { D1Database } from "@cloudflare/workers-types";

import { analyzeCore } from "../analyzeCore";
import { scoreScenario } from "./dqm";
// import { runDecisionLayer } from "./dl.v2";

import { resolveLlmProviders } from "./llm/registry";
import { executeWithLlmProviders } from "./llm/executeWithLlmProviders";

import { getLlmBudgetConfig } from "./budget";

/**
 * MAIN ENTRY — Sandbox V2
 * - Core analyze -> baseline + evidence
 * - LLM scenarios (budget-aware + fallback)
 * - Decision Layer (DL v2) -> evidence
 * - DQM ranking
 * - Response contract (clean)
 */
export async function evaluateSandboxV2(
  input: SandboxEvaluateRequestV2,
  env: Record<string, unknown>
): Promise<SandboxEvaluateResponseV2> {
  /* ===============================
   * 0) INPUTS
   * =============================== */

  const company_id =
    (input as any).company_id ??
    (input as any).companyId ??
    "unknown";

  const plan = (input as any).plan ?? "BASIC";
  const domain = (input as any).domain ?? "supply_chain";
  const intent = (input as any).intent ?? "analyze";

  const coreInput = {
    asOf: new Date().toISOString(),
    orders: (input as any).orders ?? [],
    inventory: (input as any).inventory ?? [],
    movements: (input as any).movements ?? [],
  };

  /* ===============================
   * 1) BASELINE + CORE EVIDENCE
   * =============================== */

  const core = await analyzeCore(coreInput);

  const baseline_snapshot_id =
    (core as any).baseline_snapshot_id ??
    (core as any).baselineSnapshotId ??
    (input as any).baseline_snapshot_id ??
    null;

  const event_id =
    (core as any).event_id ??
    (core as any).eventId ??
    (input as any).event_id ??
    crypto.randomUUID();

  /* ===============================
   * 2) LLM PROVIDER REGISTRY
   * =============================== */

  const budgetConfig = getLlmBudgetConfig(plan);

  const providers = resolveLlmProviders(
    plan,
    budgetConfig.basicMonthlyCapEur
  );

  const providerMap = createProviderMap(env);

  /* ===============================
   * 3) GOVERNANCE / D1 BINDING
   * =============================== */

  const policiesDb =
    (env as any)?.POLICIES_DB as D1Database | undefined;

  const dbForLlm: D1Database = policiesDb as D1Database;

  /* ===============================
   * 4) LLM EXECUTION
   * =============================== */

  const llmExec = await executeWithLlmProviders(
    {
      db: dbForLlm,

      companyId: company_id,
      requestId: event_id,

      plan,
      domain,
      intent,

      baseline: (core as any).baseline ?? core,
      providers,
    },
    providerMap
  );

  /* ===============================
   * 5) NORMALIZE SCENARIOS
   * =============================== */

  const llmScenarios: ScenarioAdvisoryV2[] = (
    llmExec.scenarios ?? []
  ).map((s: any, idx: number) => ({
    scenario_id: s.scenario_id ?? s.id ?? `llm_${idx}`,
    label: s.label ?? `Scenario ${idx + 1}`,
    assumptions: s.assumptions ?? [],
    proposed_actions: s.proposed_actions ?? s.actions ?? [],
    expected_effects: s.expected_effects ?? s.effects ?? null,
    evidence: s.evidence ?? null,
    confidence:
      typeof s.confidence === "number" ? s.confidence : 0.3,
  }));

  /* ===============================
   * 6) DQM RANKING
   * =============================== */

  // DL stub (finché DL v2 non è attivo)
  const dlStub = {
    signals: [],
    constraints: [],
    health: "stub",
  };

  const scored = llmScenarios.map((s) => ({
    scenario: s,
    score: scoreScenario
      ? scoreScenario(s, dlStub)
      : 0,
  }));

  scored.sort((a, b) => b.score - a.score);
  const ranked = scored.map((x) => x.scenario);

  /* ===============================
   * 7) RESPONSE CONTRACT
   * =============================== */

  return {
    ok: true,
    execution_allowed: false,

    event_id,
    baseline_snapshot_id,

    rate: {
      status: "OK",
      reset_at: new Date().toISOString(),
    },

    dl: {
      profile: "signals-v2",
      health: "degraded", // DL non attivo nello STO
    },

    llm: {
      fanout: providers.length,
      models_used:
        (llmExec as any).models_used ??
        ["openrouter:unknown"],
      health: "ok",
    },

    scenarios: ranked,

    ranking: {
      method: "DQM",
      top_ids: ranked
        .slice(0, 3)
        .map((s) => s.scenario_id),
    },

    summary: {
      one_liner:
        ranked.length > 0
          ? `Top scenario: ${ranked[0].label}`
          : "No viable scenarios generated",
      key_tradeoffs: [],
      questions_for_scm: [],
      signals_origin: "synthetic",
    },
  };
}