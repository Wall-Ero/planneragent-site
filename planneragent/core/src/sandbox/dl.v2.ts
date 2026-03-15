// core/src/sandbox/dl.v2.ts
// ======================================================
// PlannerAgent — Deterministic Evidence Layer v2
// Canonical Source of Truth
// ======================================================

import type { DlEvidenceV2, Health } from "./contracts.v2";
import {
  normalizeOrders,
  normalizeInventory,
  normalizeMovements,
  normalizeMovOrd,
  normalizeMovMag
} from "../../../core/datasets/dlci/adapters";

type Env = {
  DL_ENABLED?: string;
};

type DlEvidenceExtended = DlEvidenceV2 & {
  source?: "real" | "synthetic";
};

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

/* =====================================================
 MAIN
===================================================== */

export async function computeDlEvidenceV2(
  env: Env,
  input: {
    horizonDays: number;
    baselineMetrics?: Record<string, number>;
    scenarioMetrics?: Record<string, number>;
    orders?: unknown[];
    inventory?: unknown[];
    movements?: unknown[];
    movord?: unknown[];
    movmag?: unknown[];
  }
): Promise<{ health: Health; evidence?: DlEvidenceExtended }> {

  if (env.DL_ENABLED === "false") {
    return { health: "failed" };
  }

  const orders = normalizeOrders(input.orders ?? []);
  const inventory = normalizeInventory(input.inventory ?? []);
  const movements = normalizeMovements(input.movements ?? []);
  const movord = normalizeMovOrd(input.movord ?? []);
  const movmag = normalizeMovMag(input.movmag ?? []);

  const anomalies: string[] = [];

  const hasOrders = orders.length > 0;
  const hasInventory = inventory.length > 0;

  /* =====================================================
   DEMAND
  ===================================================== */

  const demandFromOrders = orders.reduce((a, r) => a + r.qty, 0);

  const baseDemand = hasOrders
    ? demandFromOrders
    : num(
        input.baselineMetrics?.demand ??
        input.baselineMetrics?.demand_p50 ??
        800,
        800
      );

  const scenDemand = num(
    input.scenarioMetrics?.demand ??
    input.scenarioMetrics?.demand_p50 ??
    baseDemand,
    baseDemand
  );

  const demandP50 = Math.round(scenDemand);
  const demandP90 = Math.round(scenDemand * 1.2);

  anomalies.push(`demand_p50=${demandP50}`);

  /* =====================================================
   STOCK
  ===================================================== */

  const stockFromInventory = inventory.reduce((a, r) => a + r.qty, 0);

  const stockBase = hasInventory
    ? stockFromInventory
    : num(input.baselineMetrics?.stock ?? 500, 500);

  const stockScen = num(
    input.scenarioMetrics?.stock ?? stockBase,
    stockBase
  );

  anomalies.push(`stock=${stockScen}`);

  /* =====================================================
   RISK
  ===================================================== */

  const stockoutRisk = clamp01(
    (demandP50 - stockScen) / Math.max(1, demandP50)
  );

  const supplierDependency = clamp01(
    num(input.scenarioMetrics?.supplier_dependency ?? 0.6, 0.6)
  );

  anomalies.push(`stockout_risk=${round3(stockoutRisk)}`);
  anomalies.push(`supplier_dependency=${round3(supplierDependency)}`);

  /* =====================================================
   SKU SHORTAGE DETECTION
  ===================================================== */

  if (hasOrders && hasInventory) {

    const demandBySku = new Map<string, number>();
    const stockBySku = new Map<string, number>();

    for (const o of orders) {

      const sku = o.sku;
      const qty = num(o.qty, 0);

      demandBySku.set(
        sku,
        (demandBySku.get(sku) ?? 0) + qty
      );

    }

    for (const s of inventory) {

      const sku = s.sku;
      const qty = num(s.qty, 0);

      stockBySku.set(
        sku,
        (stockBySku.get(sku) ?? 0) + qty
      );

    }

    for (const [sku, demand] of demandBySku.entries()) {

      const stock = stockBySku.get(sku) ?? 0;
      const shortage = demand - stock;

      if (shortage > 0) {

        anomalies.push(
          `shortage:${sku}=${round3(shortage)}`
        );

      }

    }

  }

  /* =====================================================
   DATASET SIGNALS
  ===================================================== */

  anomalies.push(`orders_rows=${orders.length}`);
  anomalies.push(`inventory_rows=${inventory.length}`);
  anomalies.push(`movements_rows=${movements.length}`);
  anomalies.push(`movord_rows=${movord.length}`);
  anomalies.push(`movmag_rows=${movmag.length}`);

  /* =====================================================
   FINAL EVIDENCE
  ===================================================== */

  const evidence: DlEvidenceExtended = {

    demand_forecast: {
      p50: demandP50,
      p90: demandP90
    },

    risk_score: {
      stockout_risk: round3(stockoutRisk),
      supplier_dependency: round3(supplierDependency)
    },

    anomaly_signals: anomalies,

    source: hasOrders || hasInventory ? "real" : "synthetic"
  };

  return {
    health: "ok",
    evidence
  };
}