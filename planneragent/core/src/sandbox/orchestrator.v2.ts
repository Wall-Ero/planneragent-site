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

import { resolveLlmProviders } from "./llm/registry";
import { executeWithLlmProviders } from "./llm/executeWithLlmProviders";
import { getLlmBudgetConfig } from "./budget";

// ==============================
// GOVERNANCE / BOUNDARY
// ==============================
import {
  enforceBoundary,
  BoundaryResult,
  BoundaryViolationError,
} from "../governance/boundary.policy";
import { resolveBoundaryResponse } from "../governance/boundary.responses";

/**
 * MAIN ENTRY — Sandbox V2
 * - Core analyze -> baseline + evidence
 * - Governance boundary enforcement
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
   * 4) GOVERNANCE BOUNDARY ENFORCEMENT
   * =============================== */

  let boundary: BoundaryResult | undefined;

  try {
    boundary = enforceBoundary(
  plan,
  intent,
  {
    requestId: event_id,
    userId: undefined,
    companyId: company_id,

    timestamp: new Date().toISOString(),
    source: "system",

    domain,
    budgetCap: budgetConfig.basicMonthlyCapEur,
    baseline: core,
  }
);

    if (!boundary.allowed) {
      const response = resolveBoundaryResponse(boundary);

      return {
        ok: false,
        execution_allowed: false,

        event_id,
        baseline_snapshot_id,

        rate: {
          status: "OK",
          reset_at: new Date().toISOString(),
        },

        dl: {
          profile: "signals-v2",
          health: "degraded",
        },

        llm: {
          fanout: 0,
          models_used: [],
          health: "degraded",
        },

        scenarios: [],

        ranking: {
          method: "DQM",
          top_ids: [],
        },

        summary: {
  one_liner: boundary?.reason ?? "Governance boundary evaluation completed",
  key_tradeoffs: [],
  questions_for_scm: [],
  signals_origin: "synthetic",
},
      };
    }
  } catch (err: unknown) {
  if (err instanceof BoundaryViolationError) {
    const response = resolveBoundaryResponse(err.boundary);

    // Governance stays INTERNAL (log/audit), API stays OPERATIONAL
    console.warn("[GOVERNANCE][BOUNDARY]", {
      event_id,
      boundary: err.boundary,
      context: err.context,
    });

    return {
      ok: false,
      execution_allowed: false,

      event_id,
      baseline_snapshot_id,

      rate: {
        status: "OK",
        reset_at: new Date().toISOString(),
      },

      dl: {
        profile: "signals-v2",
        health: "degraded",
      },

      llm: {
        fanout: 0,
        models_used: [],
        health: "degraded",
      },

      scenarios: [],

      ranking: {
        method: "DQM",
        top_ids: [],
      },

      summary: {
        one_liner: response.message,
        key_tradeoffs: [],
        questions_for_scm: [],
        signals_origin: "synthetic",
      },
    };
  }

  throw err;
}

  /* ===============================
   * 5) LLM EXECUTION
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
   * 6) NORMALIZE SCENARIOS
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
   * 7) DQM RANKING
   * =============================== */

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
   * 8) RESPONSE CONTRACT
   * =============================== */

  return {
  ok: false,
  execution_allowed: false,

  event_id,
  baseline_snapshot_id,

  rate: {
    status: "OK",
    reset_at: new Date().toISOString(),
  },

  dl: {
    profile: "signals-v2",
    health: "degraded",
  },

  llm: {
    fanout: 0,
    models_used: [],
    health: "degraded",
  },

  scenarios: [],

  ranking: {
    method: "DQM",
    top_ids: [],
  },

  summary: {
    one_liner: boundary.reason,
    key_tradeoffs: [],
    questions_for_scm: [],
    signals_origin: "synthetic",
  },
};
}