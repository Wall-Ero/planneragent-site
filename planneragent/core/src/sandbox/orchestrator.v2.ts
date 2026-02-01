// src/sandbox/orchestrator.v2.ts
// ======================================================
// SANDBOX ORCHESTRATOR — V2
// Constitutional Core Worker
//
// Responsibilities:
// - Enforce PLAN + INTENT governance
// - Run deterministic DL layer (truth)
// - Allow LLM fanout only where allowed
// - Separate:
//     * Evidence (DL)
//     * Understanding (VISION Interpreter)
//     * Scenarios (LLM / Hypotheses)
// ======================================================

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioV2,
  ScenarioAdvisoryV2,
  DlEvidenceV2,
  Health
} from "./contracts.v2";

import { computeDlEvidenceV2 } from "./dl.v2";

// -----------------------------
// INTERNAL TYPES
// -----------------------------
type Env = {
  DL_ENABLED?: string;
};

// -----------------------------
// GOVERNANCE MATRIX
// -----------------------------
function executionAllowed(plan: string, intent: string): boolean {
  if (intent !== "EXECUTE") return false;

  switch (plan) {
    case "JUNIOR":
      // Execution only after explicit human approval (not enforced here)
      return true;
    case "SENIOR":
      // Execution by delegation
      return true;
    case "PRINCIPAL":
      // Execution within budget authority
      return true;
    default:
      return false;
  }
}

function llmAllowed(plan: string): boolean {
  // LLM is NOT allowed to imagine reality in VISION
  // It is allowed to narrate / explain only
  return plan !== "CHARTER";
}

// -----------------------------
// VISION INTERPRETER (LLM-FREE)
// -----------------------------
function buildVisionAdvisory(
  dl: DlEvidenceV2,
  health: Health
): ScenarioAdvisoryV2 {
  const labels: string[] = [];
  const keySignals: string[] = [];

  const { risk_score, demand_forecast, lead_time_pred, anomaly_signals } = dl;

  if (risk_score.stockout_risk > 0.6) {
    labels.push("STOCKOUT_RISK");
    keySignals.push(
      `Stockout risk is elevated (${risk_score.stockout_risk})`
    );
  }

  if (risk_score.supplier_dependency > 0.7) {
    labels.push("SUPPLIER_DEPENDENCY");
    keySignals.push(
      `High dependency on supplier B (${risk_score.supplier_dependency})`
    );
  }

  const questions: ScenarioAdvisoryV2["questions"] = [];

  if (!lead_time_pred.supplier_B_p50_days) {
    questions.push({
      id: "missing_lt_b",
      question: "Lead time for supplier B is missing. Can you confirm p50 days?",
      missing_field: "supplier_B_leadtime_p50_days"
    });
  }

  if (!demand_forecast.p50) {
    questions.push({
      id: "missing_demand",
      question: "Baseline demand forecast is missing. Can you confirm p50?",
      missing_field: "demand_p50"
    });
  }

  const one_liner =
    health !== "ok"
      ? "Deterministic layer is degraded — interpretation may be incomplete."
      : labels.includes("STOCKOUT_RISK")
      ? "Demand is projected to exceed available stock, indicating a potential stockout risk."
      : labels.includes("SUPPLIER_DEPENDENCY")
      ? "System shows elevated dependency on a single supplier, increasing lead-time sensitivity."
      : "Operational signals are within expected ranges with no dominant risk detected.";

  return {
    one_liner,
    key_signals: keySignals.length ? keySignals : anomaly_signals,
    labels,
    questions
  };
}

// -----------------------------
// LLM FANOUT (PLACEHOLDER)
// -----------------------------
// This is intentionally dumb.
// Governance decides WHEN this may be called.
// Providers / budget / audit live elsewhere.
async function runLlmFanout(
  _req: SandboxEvaluateRequestV2,
  dl: DlEvidenceV2
): Promise<ScenarioV2[]> {
  return [
    {
      id: "llm-1",
      title: "Demand vs Stock Imbalance",
      summary: `Observed demand p50=${dl.demand_forecast.p50} exceeds stock with stockout risk=${dl.risk_score.stockout_risk}.`,
      confidence: Math.min(1, Math.max(0.3, dl.risk_score.stockout_risk + 0.2))
    }
  ];
}

// -----------------------------
// MAIN ENTRY
// -----------------------------
export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2
): Promise<SandboxEvaluateResponseV2> {
  const env: Env = {
    DL_ENABLED: "true"
  };

  // -----------------------------
  // 1. Deterministic Layer (Truth)
  // -----------------------------
  const dlResult = await computeDlEvidenceV2(env, {
    horizonDays: 30,
    baselineMetrics: req.baseline_metrics,
    scenarioMetrics: undefined
  });

  if (dlResult.health !== "ok" || !dlResult.evidence) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "DL_LAYER_FAILED"
    };
  }

  const dlEvidence = dlResult.evidence;

  // -----------------------------
  // 2. Governance
  // -----------------------------
  const execAllowed = executionAllowed(req.plan, req.intent);
  const allowLlm = llmAllowed(req.plan);

  // -----------------------------
  // 3. VISION MODE
  // -----------------------------
  if (req.plan === "VISION") {
    const advisory = buildVisionAdvisory(dlEvidence, dlResult.health);

    return {
      ok: true,
      request_id: req.request_id,

      plan: req.plan,
      intent: req.intent,
      domain: req.domain,

      scenarios: [], // VISION never produces scenarios
      advisory,

      governance: {
        execution_allowed: false,
        reason: "OBSERVATION_ONLY"
      },

      issued_at: new Date().toISOString()
    };
  }

  // -----------------------------
  // 4. NON-VISION (JUNIOR+)
  // -----------------------------
  let scenarios: ScenarioV2[] = [];

  if (allowLlm) {
    scenarios = await runLlmFanout(req, dlEvidence);
  }

  return {
    ok: true,
    request_id: req.request_id,

    plan: req.plan,
    intent: req.intent,
    domain: req.domain,

    scenarios,

    governance: {
      execution_allowed: execAllowed,
      reason: execAllowed
        ? "DELEGATED_OR_BUDGETED_AUTHORITY"
        : "ADVISORY_ONLY"
    },

    issued_at: new Date().toISOString()
  };
}