// src/sandbox/dl.v2.ts
import type { DlEvidenceV2, Health } from "./contracts.v2";

type Env = {
  DL_ENABLED?: string;
};

function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

// Deterministic evidence generator (v2, providerless)
// Uses only metrics passed (or defaults) and never takes actions.
export async function computeDlEvidenceV2(
  env: Env,
  input: {
    horizonDays: number;
    baselineMetrics?: Record<string, unknown>;
    scenarioMetrics?: Record<string, unknown>;
  }
): Promise<{ health: Health; evidence?: DlEvidenceV2 }> {
  if (env.DL_ENABLED === "false") return { health: "failed" };

  const h = input.horizonDays;

  // Heuristic: try common keys; otherwise stay stable with defaults
  const baseDemand = num(input.baselineMetrics?.demand_p50 ?? input.baselineMetrics?.demand ?? 800, 800);
  const scenDemand = num(input.scenarioMetrics?.demand_p50 ?? input.scenarioMetrics?.demand ?? baseDemand, baseDemand);

  const demandP50 = Math.round(scenDemand);
  const demandP90 = Math.round(scenDemand * 1.2);

  // Lead-time example (supplier_B) with mild risk coupling
  const ltP50 = num(input.scenarioMetrics?.supplier_B_leadtime_p50_days ?? 12, 12);
  const ltP90 = Math.max(ltP50, num(input.scenarioMetrics?.supplier_B_leadtime_p90_days ?? (ltP50 + 6), ltP50 + 6));

  // Risk signals deterministic (0..1) from simple ratios
  const stockBase = num(input.baselineMetrics?.stock ?? 500, 500);
  const stockScen = num(input.scenarioMetrics?.stock ?? stockBase, stockBase);

  const stockoutRisk = clamp01((demandP50 - stockScen) / Math.max(1, demandP50));
  const supplierDependency = clamp01(num(input.scenarioMetrics?.supplier_dependency ?? 0.6, 0.6));

  const anomalies: string[] = [];

anomalies.push(`baseline_stock=${round3(stockBase)}`);
anomalies.push(`scenario_stock=${round3(stockScen)}`);
anomalies.push(`demand_p50=${round3(demandP50)}`);
anomalies.push(`stockout_risk=${round3(stockoutRisk)}`);
anomalies.push(`supplier_dependency=${round3(supplierDependency)}`);

  const evidence: DlEvidenceV2 = {
    source: "syntethic",
    demand_forecast: { horizon_days: h, p50: demandP50, p90: demandP90 },
    lead_time_pred: {
      supplier_B_p50_days: ltP50,
      supplier_B_p90_days: ltP90
    },
    risk_score: {
      stockout_risk: round3(stockoutRisk),
      supplier_dependency: round3(supplierDependency)
    },
    anomaly_signals: anomalies ,
  };

  return { health: "ok", evidence };
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}