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
  input: SandboxEvaluateRequestV2, env: Record<string, unknown>
): Promise<SandboxEvaluateResponseV2> {
  // 0) inputs
  const company_id = (input as any).company_id ?? (input as any).companyId ?? "unknown";
  const plan = (input as any).plan ?? "BASIC";
  const domain = (input as any).domain ?? "supply_chain";
  const intent = (input as any).intent ?? "analyze";

  const coreInput = {
  asOf: new Date().toISOString(),
  orders: (input as any).orders ?? [],
  inventory: (input as any).inventory ?? [],
  movements: (input as any).movements ?? [],
};

  // 1) baseline + core evidence
  const core = await analyzeCore(coreInput);

  // baseline snapshot id (keep existing if analyzeCore already provides it)
  const baseline_snapshot_id =
    (core as any).baseline_snapshot_id ??
    (core as any).baselineSnapshotId ??
    (input as any).baseline_snapshot_id ??
    null;

  // event id (optional)
  const event_id =
    (core as any).event_id ??
    (core as any).eventId ??
    (input as any).event_id ??
    null;

  // 2) LLM provider list from registry (budget config here is policy-only)
  const budgetConfig = getLlmBudgetConfig(plan);
  const providers = resolveLlmProviders(plan, budgetConfig.basicMonthlyCapEur);

  const providerMap = createProviderMap(env);

  const llmInput = {
  companyId: company_id,
  requestId: event_id ?? crypto.randomUUID(),
  plan,
  domain,
  intent,
  baseline: (core as any).baseline ?? core,
};

const llmExec = await executeWithLlmProviders(
  {
    db: null as any, // stub temporaneo
    companyId: company_id,
    requestId: event_id ?? crypto.randomUUID(),
    plan,
    domain,
    intent,
    baseline: (core as any).baseline ?? core,
    providers,
  },
providerMap
);

  // executor returns scenarios in provider format; we normalize to ScenarioAdvisoryV2
  const llmScenarios: ScenarioAdvisoryV2[] = (llmExec.scenarios ?? []).map((s: any, idx: number) => ({
    scenario_id: s.scenario_id ?? s.id ?? `llm_${idx}`,
    label: s.label ?? `Scenario ${idx + 1}`,
    assumptions: s.assumptions ?? [],
    proposed_actions: s.proposed_actions ?? s.actions ?? [],
    expected_effects: s.expected_effects ?? s.effects ?? null,
    // evidence is added later by DL/DQM
    evidence: s.evidence ?? null,

   confidence: typeof s.confidence === "number" ? s.confidence : 0.3

  }));

  // 4) Decision Layer (DL v2) — generates evidence signals / constraints
  // const dlResult = await runDecisionLayer({
  // input,
  //  baseline: (core as any).baseline ?? core,
  // scenarios: llmScenarios);

  // 5) Rank with DQM (uses scenario + DL evidence)
  const scored = llmScenarios.map((s) => ({
    scenario: s,
    score: 0,
  }));

  scored.sort((a, b) => b.score - a.score);
  const ranked = scored.map((x) => x.scenario);

  // 6) RESPONSE (keep contract minimal & valid)
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
  fanout: 1,
  models_used: ["openrouter:gpt-4o-mini"],
  health: "ok",
},

    scenarios: ranked,

    ranking: {
      method: "DQM",
      top_ids: ranked.slice(0, 3).map((s) => s.scenario_id),
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