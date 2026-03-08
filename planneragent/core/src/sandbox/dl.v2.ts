// src/sandbox/dl.v2.ts
// ======================================================
// PlannerAgent — Deterministic Evidence Layer v2
// Canonical Snapshot
// Source of Truth
//
// Responsibilities:
// - Generate deterministic operational evidence
// - Never take actions
// - Never call LLMs
// - Use baseline/scenario metrics when available
// - Reconstruct BOM evidence from production reality when
//   MOVORD + MOVMAG are provided
// ======================================================

import type { DlEvidenceV2, Health } from "./contracts.v2";
import { inferBomFromProduction } from "./reality/inferBomFromProduction.v1";

type Env = {
  DL_ENABLED?: string;
};

type MovOrdRow = {
  order: string;
  article: string;
  quantity: number;
  date?: string;
};

type MovMagRow = {
  order?: string;
  article: string;
  quantity: number;
  causale?: string;
  type?: string;
  date?: string;
};

export type DlEvidenceV2Extended = DlEvidenceV2 & {
  inferred_bom?: {
    bom: Array<{
      parent: string;
      components: Array<{
        component: string;
        median_ratio: number;
        mean_ratio: number;
        variance: number;
        samples: number;
      }>;
      confidence: number;
    }>;
    signals: string[];
  };
};

// ------------------------------------------------------
// Utilities
// ------------------------------------------------------

function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

// ------------------------------------------------------
// Normalization
// ------------------------------------------------------

function normalizeMovOrd(rows?: MovOrdRow[]): MovOrdRow[] {
  return (rows ?? [])
    .map((r) => ({
      order: String(r?.order ?? "").trim(),
      article: String(r?.article ?? "").trim(),
      quantity: Math.max(0, Math.round(num(r?.quantity, 0))),
      date: r?.date,
    }))
    .filter((r) => r.order && r.article && r.quantity > 0);
}

function normalizeMovMag(rows?: MovMagRow[]): MovMagRow[] {
  return (rows ?? [])
    .map((r) => ({
      order: r?.order ? String(r.order).trim() : undefined,
      article: String(r?.article ?? "").trim(),
      quantity: num(r?.quantity, 0),
      causale: r?.causale ? String(r.causale).trim() : undefined,
      type: r?.type ? String(r.type).trim().toUpperCase() : undefined,
      date: r?.date,
    }))
    .filter((r) => {
      if (!r.article) return false;
      if (!Number.isFinite(r.quantity)) return false;
      if (r.quantity === 0) return false;

      // prefer movements tied to production orders
      if (r.order) return true;

      // fallback if causale explicitly indicates production consumption
      if (r.causale && r.causale.toLowerCase().includes("produz")) return true;

      return false;
    });
}

// ------------------------------------------------------
// Main deterministic evidence generator
// ------------------------------------------------------

export async function computeDlEvidenceV2(
  env: Env,
  input: {
    horizonDays: number;
    baselineMetrics?: Record<string, unknown>;
    scenarioMetrics?: Record<string, unknown>;
    movord?: MovOrdRow[];
    movmag?: MovMagRow[];
  }
): Promise<{ health: Health; evidence?: DlEvidenceV2Extended }> {

  if (env.DL_ENABLED === "false") {
    return { health: "failed" };
  }

  const h = Math.max(1, Math.round(num(input.horizonDays, 30)));

  // --------------------------------------------------
  // Metric-based deterministic evidence
  // --------------------------------------------------

  const baseDemand = num(
    input.baselineMetrics?.demand_p50 ??
      input.baselineMetrics?.demand ??
      800,
    800
  );

  const scenDemand = num(
    input.scenarioMetrics?.demand_p50 ??
      input.scenarioMetrics?.demand ??
      baseDemand,
    baseDemand
  );

  const demandP50 = Math.round(scenDemand);
  const demandP90 = Math.round(scenDemand * 1.2);

  const ltP50 = num(
    input.scenarioMetrics?.supplier_B_leadtime_p50_days ?? 12,
    12
  );

  const ltP90 = Math.max(
    ltP50,
    num(
      input.scenarioMetrics?.supplier_B_leadtime_p90_days ??
        ltP50 + 6,
      ltP50 + 6
    )
  );

  const stockBase = num(
    input.baselineMetrics?.stock ?? 500,
    500
  );

  const stockScen = num(
    input.scenarioMetrics?.stock ?? stockBase,
    stockBase
  );

  const stockoutRisk = clamp01(
    (demandP50 - stockScen) / Math.max(1, demandP50)
  );

  const supplierDependency = clamp01(
    num(
      input.scenarioMetrics?.supplier_dependency ?? 0.6,
      0.6
    )
  );

  const anomalies: string[] = [];

  anomalies.push(`baseline_stock=${round3(stockBase)}`);
  anomalies.push(`scenario_stock=${round3(stockScen)}`);
  anomalies.push(`demand_p50=${round3(demandP50)}`);
  anomalies.push(`stockout_risk=${round3(stockoutRisk)}`);
  anomalies.push(`supplier_dependency=${round3(supplierDependency)}`);

  // --------------------------------------------------
  // Production reality reconstruction (BOM inference)
  // --------------------------------------------------

  const movord = normalizeMovOrd(input.movord);
  const movmag = normalizeMovMag(input.movmag);

  let bomEvidence:
    | ReturnType<typeof inferBomFromProduction>
    | undefined;

  if (movord.length > 0 && movmag.length > 0) {

    bomEvidence = inferBomFromProduction(movord, movmag);

    if (bomEvidence.bom.length > 0) {

      anomalies.push(`bom_parents=${bomEvidence.bom.length}`);

      for (const inferred of bomEvidence.bom) {

        anomalies.push(
          `bom_confidence:${inferred.parent}=${round3(
            inferred.confidence
          )}`
        );

        for (const component of inferred.components) {

          anomalies.push(
            `real_consumption_ratio:${inferred.parent}->${component.component}=${round3(
              component.median_ratio
            )}`
          );

          anomalies.push(
            `component_variance:${inferred.parent}->${component.component}=${round3(
              component.variance
            )}`
          );

        }

      }

      for (const signal of bomEvidence.signals) {
        anomalies.push(signal);
      }

    }

  }

  // --------------------------------------------------
  // Compose deterministic evidence
  // --------------------------------------------------

  const evidence: DlEvidenceV2Extended = {
    source: "synthetic",
    demand_forecast: {
      horizon_days: h,
      p50: demandP50,
      p90: demandP90,
    },
    lead_time_pred: {
      supplier_B_p50_days: ltP50,
      supplier_B_p90_days: ltP90,
    },
    risk_score: {
      stockout_risk: round3(stockoutRisk),
      supplier_dependency: round3(supplierDependency),
    },
    anomaly_signals: anomalies,
    inferred_bom:
      bomEvidence && bomEvidence.bom.length > 0
        ? {
            bom: bomEvidence.bom,
            signals: bomEvidence.signals,
          }
        : undefined,
  };

  return { health: "ok", evidence };

}
