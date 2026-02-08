// src/sandbox/orchestrator.v2.ts

// ======================================================
// SANDBOX ORCHESTRATOR — V2 (P3 Authority Bound)
// Canonical Source of Truth
//
// Responsibilities:
// - Enforce Authority via Signed Snapshot (P3)
// - Run deterministic DL layer (truth)
// - Allow LLM fanout only where governance allows
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
import { authoritySandboxGuard } from "./authority/authoritySandbox.guard";

// -----------------------------
// INTERNAL TYPES
// -----------------------------
type Env = {
  DL_ENABLED?: string;
};

// -----------------------------
// GOVERNANCE HELPERS
// -----------------------------
function executionAllowed(plan: string, intent: string): boolean {
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

function llmAllowed(plan: string): boolean {
  // CHARTER never calls LLM
  return plan !== "CHARTER";
}

// -----------------------------
// VISION INTERPRETER (Deterministic explain)
// -----------------------------
function buildVisionAdvisory(
  dl: DlEvidenceV2,
  health: Health
): ScenarioAdvisoryV2 {

  const labels: string[] = [];
  const keySignals: string[] = [];

  if (dl.risk_score.stockout_risk > 0.6) {
    labels.push("STOCKOUT_RISK");
    keySignals.push(`Stockout risk elevated (${dl.risk_score.stockout_risk})`);
  }

  if (dl.risk_score.supplier_dependency > 0.7) {
    labels.push("SUPPLIER_DEPENDENCY");
    keySignals.push(`Supplier dependency high (${dl.risk_score.supplier_dependency})`);
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
    questions: []
  };
}

// -----------------------------
// LLM FANOUT PLACEHOLDER
// -----------------------------
async function runLlmFanout(
  _req: SandboxEvaluateRequestV2,
  dl: DlEvidenceV2
): Promise<ScenarioV2[]> {

  return [
    {
      id: "llm-1",
      title: "Demand vs Stock Imbalance",
      summary: `Demand p50=${dl.demand_forecast.p50} stockoutRisk=${dl.risk_score.stockout_risk}`,
      confidence: Math.min(1, Math.max(0.3, dl.risk_score.stockout_risk + 0.2))
    }
  ];
}

// ======================================================
// MAIN ENTRY
// ======================================================
export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2
): Promise<SandboxEvaluateResponseV2> {

  const env: Env = {
    DL_ENABLED: "true"
  };

  // ======================================================
  // P3 — AUTHORITY GUARD (Snapshot Based)
  // ======================================================

  if (!req.snapshot) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "SNAPSHOT_REQUIRED"
    };
  }

  const auth = authoritySandboxGuard(req.snapshot);

  if (!auth.ok) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: auth.reason
    };
  }

  // ======================================================
  // 1️⃣ Deterministic Layer (Truth)
  // ======================================================

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

  // ======================================================
  // 2️⃣ Governance Decision
  // ======================================================

  const execAllowed = executionAllowed(req.plan, req.intent);
  const allowLlm = llmAllowed(req.plan);

  // ======================================================
  // 3️⃣ VISION MODE (Observation Only)
  // ======================================================

  if (req.plan === "VISION") {

    const advisory = buildVisionAdvisory(dlEvidence, dlResult.health);

    return {
      ok: true,
      request_id: req.request_id,

      plan: req.plan,
      intent: req.intent,
      domain: req.domain,

      scenarios: [],
      advisory,

      governance: {
        execution_allowed: false,
        reason: "OBSERVATION_ONLY"
      },

      issued_at: new Date().toISOString()
    };
  }

  // ======================================================
  // 4️⃣ JUNIOR / SENIOR / PRINCIPAL
  // ======================================================

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