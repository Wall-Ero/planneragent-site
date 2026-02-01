// src/sandbox/orchestrator.v2.ts

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioAdvisoryV2,
} from "./contracts.v2";
import type {
  AuthorityLevel,
  SemanticIntent,
} from "../governance/boundary.policy";
import type { D1Database } from "@cloudflare/workers-types";

import { analyzeCore } from "../analyzeCore";
import { scoreScenario } from "./dqm";
import { createProviderMap } from "./llm/providerMap";
import { resolveLlmProviders } from "./llm/registry";
import {
  executeWithLlmProviders,
  LlmExecutionResultV2,
} from "./llm/executeWithLlmProviders";
import { getLlmBudgetConfig, getBasicBudgetRemainingEur } from "./budget";
import { logLlmFanoutV2 } from "./LogLlmUsage";
import { resolveSovereigntyPolicyV1 } from "./llm/sovereignty";

// ==============================
// GOVERNANCE / BOUNDARY
// ==============================
import {
  enforceBoundary,
  BoundaryResult,
  BoundaryViolationError,
} from "../governance/boundary.policy";
import { resolveBoundaryResponse } from "../governance/boundary.responses";

/* ============================================================
 * Helpers
 * ============================================================ */
/**
 * PLAN → Semantic Intent ladder
 */
function deriveIntentFromPlan(
  plan: "BASIC" | "JUNIOR" | "SENIOR"
): SemanticIntent {
  switch (plan) {
    case "BASIC":
      return "INFORM";
    case "JUNIOR":
      return "PROPOSE";
    case "SENIOR":
      return "PACKAGE_DECISION";
    default:
      return "INFORM";
  }
}

import type { Intent as PublicIntent } from "./contracts.v2";

function mapPublicIntentToSemantic(
  intent: PublicIntent
): SemanticIntent {
  switch (intent) {
    case "INFORM":
    case "SENSE":
      return "INFORM";
    case "ADVISE":
      return "PROPOSE";
    case "EXECUTE":
      return "PACKAGE_DECISION";
    default:
      return "INFORM";
  }
}

/* ============================================================
 * MAIN ENTRY — Sandbox V2
 * ============================================================ */
export async function evaluateSandboxV2(
  input: SandboxEvaluateRequestV2,
  env: Record<string, unknown>
): Promise<SandboxEvaluateResponseV2> {
  /* ===============================
   * 0) INPUTS (normalized)
   * =============================== */
  const company_id =
    (input as any).company_id ??
    (input as any).companyId ??
    "unknown";

  const plan = ((input as any).plan ?? "BASIC") as
    | "BASIC"
    | "JUNIOR"
    | "SENIOR";

  const domain = ((input as any).domain ?? "supply_chain") as any;

  const publicIntent: PublicIntent =
    ((input as any).intent as PublicIntent) ??
    (plan === "BASIC"
      ? "INFORM"
      : plan === "JUNIOR"
      ? "ADVISE"
      : "EXECUTE");

  const intent: SemanticIntent =
    mapPublicIntentToSemantic(publicIntent);

  /* ==============================
   * AUTHORITY (Governance Plane)
   * ============================== */
  const authorityLevel: AuthorityLevel =
    plan === "BASIC"
      ? "VISION"
      : plan === "JUNIOR"
      ? "JUNIOR"
      : "SENIOR";

  /* ==============================
   * MODE (LLM Language Plane)
   * ============================== */
  const mode: "sense" | "advise" =
    plan === "BASIC" ? "sense" : "advise";

  const baseline_snapshot_id_raw =
    (input as any).baseline_snapshot_id ??
    (input as any).baselineSnapshotId ??
    "snap-unknown";

  const coreInput = {
    asOf: new Date().toISOString(),
    orders: (input as any).orders ?? [],
    inventory: (input as any).inventory ?? [],
    movements: (input as any).movements ?? [],
    baseline_metrics:
      (input as any).baseline_metrics ?? {},
    scenario_metrics:
      (input as any).scenario_metrics ?? {},
  };

  /* ===============================
   * 1) BASELINE + CORE EVIDENCE
   * =============================== */
  const core = await analyzeCore(coreInput);

  const baseline_snapshot_id: string =
    (core as any)?.baseline_snapshot_id ??
    (core as any)?.baselineSnapshotId ??
    baseline_snapshot_id_raw ??
    "snap-unknown";

  const event_id: string =
    (core as any)?.event_id ??
    (core as any)?.eventId ??
    (input as any)?.event_id ??
    crypto.randomUUID();

  /* ===============================
   * 2) LLM PROVIDER REGISTRY + SOVEREIGNTY
   * =============================== */
  const budgetConfig = getLlmBudgetConfig(plan);

  const policiesDb = (env as any)?.POLICIES_DB as
    | D1Database
    | undefined;

  const dbForLlm: D1Database | undefined = policiesDb;

  // Remaining budget logic (BASIC only)
  let budgetRemainingEur = Number.POSITIVE_INFINITY;

  if (plan === "BASIC" && dbForLlm) {
    budgetRemainingEur =
      await getBasicBudgetRemainingEur(
        dbForLlm,
        budgetConfig
      );
  } else if (plan === "BASIC" && !dbForLlm) {
    // No DB = cannot prove remaining budget → safest = force free/oss
    budgetRemainingEur = 0;
  }

  const sovereignty = resolveSovereigntyPolicyV1({
    plan,
    budgetRemainingEur: Number.isFinite(
      budgetRemainingEur
    )
      ? budgetRemainingEur
      : 999999,
  });

  const providers = resolveLlmProviders(
    plan,
    Number.isFinite(budgetRemainingEur)
      ? budgetRemainingEur
      : 999999,
    sovereignty
  );

  const providerMap = createProviderMap(env);

  // Model injection (v1 rule)
  const injectedModel =
    sovereignty.preferred === "paid"
      ? "openai/gpt-4o-mini"
      : undefined;

  /* ===============================
   * 3) GOVERNANCE BOUNDARY
   * =============================== */
  let boundary: BoundaryResult | undefined;
  try {
    boundary = enforceBoundary(
      authorityLevel,
      intent,
      {
        requestId: event_id,
        userId: undefined,
        companyId: company_id,
        timestamp: new Date().toISOString(),
        source: "system",
        domain,
        budgetCap:
          budgetConfig.basicMonthlyCapEur,
        baseline: core,
      }
    );

    const allowSense =
      authorityLevel === "VISION" &&
      intent === "INFORM";

    if (!boundary.allowed && !allowSense) {
      const response =
        resolveBoundaryResponse(boundary);

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
          mode,
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
          one_liner:
            authorityLevel === "VISION"
              ? "I am observing system signals and governance state. No advice or actions are being prepared."
              : response.message ??
                boundary.reason ??
                "Boundary blocked",
          key_tradeoffs: [],
          questions_for_scm: [],
          signals_origin: "synthetic",
        },
      };
    }
  } catch (err: unknown) {
    if (err instanceof BoundaryViolationError) {
      const response =
        resolveBoundaryResponse(err.boundary);

      console.warn(
        "[GOVERNANCE][BOUNDARY]",
        {
          event_id,
          boundary: err.boundary,
          context: err.context,
        }
      );

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
          mode,
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
          one_liner:
            authorityLevel === "VISION"
              ? "I am observing system signals and governance state. No advice or actions are being prepared."
              : response.message ??
                err.boundary.reason ??
                "Boundary blocked",
          key_tradeoffs: [],
          questions_for_scm: [],
          signals_origin: "synthetic",
        },
      };
    }
    throw err;
  }

  /* ===============================
   * 4) CORE SCENARIOS (Deterministic)
   * =============================== */
  const coreScenariosRaw: any[] =
    (core as any)?.scenarios ?? [];

  const coreScenarios: ScenarioAdvisoryV2[] =
    coreScenariosRaw.map(
      (s: any, idx: number) => ({
        scenario_id:
          s.scenario_id ??
          s.id ??
          `core_${idx}`,
        label:
          s.label ??
          `Core scenario ${idx + 1}`,
        assumptions: s.assumptions ?? [],
        proposed_actions:
          s.proposed_actions ??
          s.actions ??
          [],
        dl_evidence:
          s.dl_evidence ??
          s.evidence ??
          undefined,
        expected_effects:
          s.expected_effects ??
          s.effects ??
          undefined,
        confidence:
          typeof s.confidence === "number"
            ? s.confidence
            : 0.6,
        evidence_missing:
          !!s.evidence_missing,
      })
    );

  /* ===============================
   * 5) LLM GOVERNED EXECUTION
   * =============================== */
  const allowLlmForSense =
    plan === "BASIC";
  const allowLlmForAdvise =
    plan !== "BASIC";

  let llmExec: LlmExecutionResultV2 | null =
    null;
  let llmResults: any[] = [];
  let llmScenarios: ScenarioAdvisoryV2[] =
    [];

  if (
    allowLlmForSense ||
    allowLlmForAdvise
  ) {
    llmExec =
      await executeWithLlmProviders(
        {
          db: dbForLlm,
          companyId: company_id,
          requestId: event_id,
          mode: allowLlmForAdvise
            ? "advise"
            : "sense",
          domain,
          intent,
          baseline:
            (core as any).baseline ??
            core,
          providers,
          model: injectedModel,
        },
        providerMap,
        { plan }
      );

    llmResults =
      llmExec?.llmResults ?? [];

    if (allowLlmForAdvise) {
      llmScenarios = (
        llmExec?.scenarios ?? []
      ).map(
        (s: any, idx: number) => ({
          scenario_id:
            s.scenario_id ??
            s.id ??
            `llm_${idx}`,
          label:
            s.label ??
            `Scenario ${idx + 1}`,
          assumptions:
            s.assumptions ?? [],
          proposed_actions:
            s.proposed_actions ??
            s.actions ??
            [],
          dl_evidence:
            s.dl_evidence ??
            s.evidence ??
            undefined,
          expected_effects:
            s.expected_effects ??
            s.effects ??
            undefined,
          confidence:
            typeof s.confidence ===
            "number"
              ? s.confidence
              : 0.3,
          evidence_missing:
            !!s.evidence_missing,
        })
      );
    }
  }

  /* ===============================
   * 6) LLM USAGE LOG
   * =============================== */
  if (
    dbForLlm &&
    llmResults.length > 0
  ) {
    await logLlmFanoutV2(
      dbForLlm,
      {
        companyId: company_id,
        plan,
        domain,
        intent,
        mode,
      },
      llmResults
    );
  }

  /* ===============================
   * 7) SCENARIO SOURCE RULE
   * =============================== */
  const scenariosToRank:
    ScenarioAdvisoryV2[] =
    plan === "BASIC"
      ? coreScenarios
      : llmScenarios;

  /* ===============================
   * 8) DQM RANKING
   * =============================== */
  const dlStub = {
    signals: [],
    constraints: [],
    health: "stub",
  };

  const scored = scenariosToRank.map(
    (s) => ({
      scenario: s,
      score: scoreScenario
        ? scoreScenario(s, dlStub)
        : 0,
    })
  );

  scored.sort(
    (a, b) => b.score - a.score
  );

  const ranked = scored.map(
    (x) => x.scenario
  );
  const top_ids = ranked.map(
    (s) => s.scenario_id
  );

  /* ===============================
   * 9) RESPONSE
   * =============================== */
  const models_used = llmResults
    .map((r: any) => r?.model)
    .filter(
      (m: any) =>
        typeof m === "string"
    );

  const llmHealth:
    | "ok"
    | "degraded"
    | "failed" =
    llmResults.length > 0
      ? "ok"
      : allowLlmForSense ||
        allowLlmForAdvise
      ? "degraded"
      : "failed";

  const oneLiner =
    plan === "BASIC"
      ? llmResults?.[0]?.text ??
        "I am observing system signals and governance state. No advice or actions are being prepared."
      : (llmExec as any)
          ?.summary?.one_liner ??
        "Advisory scenarios generated under governance.";

  const questions_for_scm: string[] =
    (llmExec as any)
      ?.summary?.questions_for_scm ??
    (plan === "BASIC"
      ? [
          "What changed vs last snapshot?",
          "Where is the next operational risk?",
          "Which signals look unstable or incomplete?",
        ]
      : []);

  const key_tradeoffs: string[] =
    (llmExec as any)
      ?.summary?.key_tradeoffs ??
    [];

  return {
    ok: true,
    execution_allowed: false,
    event_id,
    baseline_snapshot_id,
    rate: {
      status: "OK",
      reset_at:
        new Date().toISOString(),
    },
    dl: {
      profile: "signals-v2",
      health: "degraded",
    },
    llm: {
      mode,
      fanout:
        llmResults.length,
      models_used,
      health: llmHealth,
    },
    scenarios: ranked,
    ranking: {
      method: "DQM",
      top_ids,
    },
    summary: {
      one_liner: oneLiner,
      key_tradeoffs,
      questions_for_scm,
      signals_origin: "synthetic",
    },
  };
}