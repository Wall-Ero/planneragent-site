// src/sandbox/visionInterpreter.v1.ts
// ======================================================
// VISION Interpreter v1 — deterministic, audit-friendly
// - Explains deterministic evidence (DL/heuristics)
// - Adds labels, questions, one-liner
// - NEVER proposes actions or scenarios
// ======================================================

import type { DlEvidenceV2, Health, ScenarioAdvisoryV2 } from "./contracts.v2";

export function buildVisionAdvisoryV1(
  dl: DlEvidenceV2,
  health: Health
): ScenarioAdvisoryV2 {
  const labels: string[] = [];
  const keySignals: string[] = [];
  const questions: ScenarioAdvisoryV2["questions"] = [];

  const stockout = dl.risk_score.stockout_risk;
  const dep = dl.risk_score.supplier_dependency;

  if (stockout > 0.6) {
    labels.push("STOCKOUT_RISK");
    keySignals.push(`Stockout risk elevated: ${stockout}`);
  }

  if (dep > 0.7) {
    labels.push("SUPPLIER_DEPENDENCY");
    keySignals.push(`Supplier dependency high: ${dep}`);
  }

  // Clarifying prompts (example)
  if (!Number.isFinite(dl.lead_time_pred.supplier_B_p50_days)) {
    questions.push({
      id: "missing_supplier_B_lt_p50",
      question:
        "Lead time for supplier B (p50) is missing or invalid. Can you confirm the value in days?",
      missing_field: "supplier_B_leadtime_p50_days"
    });
  }

  const one_liner =
    health !== "ok"
      ? "Deterministic layer is degraded — interpretation may be incomplete."
      : labels.includes("STOCKOUT_RISK")
      ? "Projected demand may exceed available stock, indicating stockout risk."
      : labels.includes("SUPPLIER_DEPENDENCY")
      ? "High dependency on a single supplier increases lead-time sensitivity."
      : "Operational signals are within expected ranges with no dominant risk detected.";

  return {
    one_liner,
    key_signals: keySignals.length ? keySignals : dl.anomaly_signals,
    labels,
    questions
  };
}