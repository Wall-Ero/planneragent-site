// src/sandbox/orchestrator.v2.ts
// ======================================================
// SANDBOX ORCHESTRATOR — V2 (P3 Authority Bound)
// Canonical Snapshot
// Source of Truth
//
// Responsibilities:
// - Enforce Authority via Signed Snapshot (P3)
// - Run deterministic DL layer
// - Run Optimizer v1
// - Pass inferred BOM to optimizer
// - Allow LLM fanout where governance allows
// - Emit cockpit signals
// ======================================================

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioV2,
  ScenarioAdvisoryV2,
  DlEvidenceV2,
  Health,
  PlanTier,
} from "./contracts.v2";

import { computeDlEvidenceV2 } from "./dl.v2";
import { authoritySandboxGuard } from "./authority/authoritySandbox.guard";
import { buildUiSignalsV1 } from "./signal.engine.v1";

import { runOptimizerV1 } from "../decision/optimizer";

// ------------------------------------------------------
// ENV
// ------------------------------------------------------

type Env = {
  DL_ENABLED?: string;
};

// ------------------------------------------------------
// RESPONSE EXTENSION
// ------------------------------------------------------

type OptimizerResponseBlock = {
  best_score: number | null;
  actions: unknown[];
  candidates: number;
};

type SandboxEvaluateResponseV2WithOptimizer =
  SandboxEvaluateResponseV2 & {
    optimizer?: OptimizerResponseBlock;
  };

// ------------------------------------------------------
// GOVERNANCE
// ------------------------------------------------------

function executionAllowed(plan: PlanTier, intent: string): boolean {

  if (intent !== "EXECUTE") return false;

  switch (plan) {

    case "JUNIOR":
    case "SENIOR":
    case "PRINCIPAL":
      return true;

    default:
      return false;

  }

}

function llmAllowed(plan: PlanTier): boolean {

  return plan !== "CHARTER";

}

// ------------------------------------------------------
// VISION INTERPRETER
// ------------------------------------------------------

function buildVisionAdvisory(
  dl: DlEvidenceV2,
  health: Health
): ScenarioAdvisoryV2 {

  const labels: string[] = [];
  const keySignals: string[] = [];

  if (dl.risk_score.stockout_risk > 0.6) {

    labels.push("STOCKOUT_RISK");

    keySignals.push(
      `Stockout risk elevated (${dl.risk_score.stockout_risk})`
    );

  }

  if (dl.risk_score.supplier_dependency > 0.7) {

    labels.push("SUPPLIER_DEPENDENCY");

    keySignals.push(
      `Supplier dependency high (${dl.risk_score.supplier_dependency})`
    );

  }

  const one_liner =
    health !== "ok"
      ? "Deterministic layer degraded."
      : labels.includes("STOCKOUT_RISK")
      ? "Demand may exceed stock → stockout risk."
      : labels.includes("SUPPLIER_DEPENDENCY")
      ? "High dependency on single supplier."
      : "System stable — no dominant risk detected.";

  return {
    one_liner,
    key_signals: keySignals.length ? keySignals : dl.anomaly_signals,
    labels,
    questions: [],
  };

}

// ------------------------------------------------------
// LLM FANOUT
// ------------------------------------------------------

async function runLlmFanout(
  _req: SandboxEvaluateRequestV2,
  dl: DlEvidenceV2
): Promise<ScenarioV2[]> {

  return [
    {
      id: "llm-1",
      title: "Demand vs Stock Imbalance",
      summary: `Demand p50=${dl.demand_forecast.p50} stockoutRisk=${dl.risk_score.stockout_risk}`,
      confidence: Math.min(
        1,
        Math.max(0.3, dl.risk_score.stockout_risk + 0.2)
      ),
    },
  ];

}

// ======================================================
// MAIN ENTRY
// ======================================================

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2
): Promise<SandboxEvaluateResponseV2WithOptimizer> {

  const env: Env = { DL_ENABLED: "true" };

  // ====================================================
  // AUTHORITY GUARD
  // ====================================================

  if (!req.snapshot) {

    return {
      ok: false,
      request_id: req.request_id,
      reason: "SNAPSHOT_REQUIRED",
    };

  }

  const auth = authoritySandboxGuard(req.snapshot);

  if (!auth.ok) {

    return {
      ok: false,
      request_id: req.request_id,
      reason: auth.reason,
    };

  }

  // ====================================================
  // DL LAYER
  // ====================================================

  const dlResult = await computeDlEvidenceV2(env, {

    horizonDays: 30,

    baselineMetrics: req.baseline_metrics as Record<string, number>,

    scenarioMetrics: undefined,

    movord: (req as any).movord ?? [],

    movmag: (req as any).movmag ?? [],

  });

  if (dlResult.health !== "ok" || !dlResult.evidence) {

    return {
      ok: false,
      request_id: req.request_id,
      reason: "DL_LAYER_FAILED",
    };

  }

  const dlEvidence = dlResult.evidence;

  // ====================================================
  // SIGNALS
  // ====================================================

  const { signals } = buildUiSignalsV1({

    dl: dlEvidence,

    dataset_descriptor: req.dataset_descriptor,

  });

  // ====================================================
  // GOVERNANCE
  // ====================================================

  const execAllowed = executionAllowed(req.plan, req.intent);

  const allowLlm = llmAllowed(req.plan);

  // ====================================================
  // VISION MODE
  // ====================================================

  if (req.plan === "VISION") {

    const advisory = buildVisionAdvisory(dlEvidence, dlResult.health);

    return {

      ok: true,

      request_id: req.request_id,

      plan: req.plan,

      intent: req.intent,

      domain: req.domain,

      signals,

      scenarios: [],

      advisory,

      governance: {
        execution_allowed: false,
        reason: "OBSERVATION_ONLY",
      },

      issued_at: new Date().toISOString(),

    };

  }

  // ====================================================
  // OPTIMIZER
  // ====================================================

  let optimizerOutput: any = null;

  try {

    const optimizerPlan: PlanTier =
      req.plan === "BASIC"
        ? "VISION"
        : req.plan;

    optimizerOutput = await runOptimizerV1({

      requestId: req.request_id,

      plan: optimizerPlan,

      asOf: new Date().toISOString(),

      orders: (req as any).orders ?? [],

      inventory: (req as any).inventory ?? [],

      movements: (req as any).movements ?? [],

      baseline_metrics:
        (req.baseline_metrics ?? {}) as Record<string, number>,

      scenario_metrics: {},

      constraints_hint: {},

      dlSignals: dlEvidence.risk_score ?? {},

      inferredBom:
        (dlEvidence as any).inferred_bom ?? [],

    });

  } catch {

    optimizerOutput = null;

  }

  // ====================================================
  // SCENARIOS
  // ====================================================

  let scenarios: ScenarioV2[] = [];

  if (allowLlm) {

    scenarios =
      await runLlmFanout(req, dlEvidence);

  }

  // ====================================================
  // RESPONSE
  // ====================================================

  return {

    ok: true,

    request_id: req.request_id,

    plan: req.plan,

    intent: req.intent,

    domain: req.domain,

    signals,

    optimizer: optimizerOutput
      ? {
          best_score:
            optimizerOutput.best?.score ?? null,

          actions:
            optimizerOutput.best?.actions ?? [],

          candidates:
            optimizerOutput.candidates?.length ?? 0,
        }
      : undefined,

    scenarios,

    governance: {
      execution_allowed: execAllowed,
      reason: execAllowed
        ? "DELEGATED_OR_BUDGETED_AUTHORITY"
        : "ADVISORY_ONLY",
    },

    issued_at: new Date().toISOString(),

  };

}