// core/src/simulation/twin.snapshot.ts
// ======================================================
// PlannerAgent — Twin Snapshot
// Canonical Source of Truth
//
// Purpose
// Define the normalized state snapshot used by the
// simulation layer, scenario runner, and digital twin.
//
// The twin snapshot is descriptive, deterministic,
// and governance-neutral.
// ======================================================

export type TwinInventoryRow = {
  sku: string;
  onHand: number;
};

export type TwinOrderRow = {
  orderId: string;
  sku: string;
  qty: number;
  dueDate?: string;
};

export type TwinSupplyRow = {
  sku: string;
  qty: number;
  etaDate?: string;
  source?: string;
};

export type TwinBomEdge = {
  parent: string;
  component: string;
  ratio: number;
  source: "MASTER" | "PLAN" | "REALITY";
};

export type TwinSnapshot = {
  created_at: string;

  inventory: TwinInventoryRow[];
  orders: TwinOrderRow[];
  supply: TwinSupplyRow[];
  bom: TwinBomEdge[];

  assumptions: Array<{
    id: string;
    category: string;
    value: number | string | boolean;
    source: string;
    reason: string;
    confidence: number;
    created_at: string;
  }>;

  confidence: {
    stock: number;
    demand: number;
    lead_time: number;
    bom: number;
  };

  awareness_level: number;
};

export function createTwinSnapshot(params: {
  inventory?: any[];
  orders?: any[];
  supply?: any[];
  bom?: TwinBomEdge[];
  assumptions?: TwinSnapshot["assumptions"];
  confidence?: TwinSnapshot["confidence"];
  awareness_level?: number;
}): TwinSnapshot {
  return {
    created_at: new Date().toISOString(),

    inventory: normalizeInventory(params.inventory ?? []),
    orders: normalizeOrders(params.orders ?? []),
    supply: normalizeSupply(params.supply ?? []),
    bom: normalizeBom(params.bom ?? []),

    assumptions: [...(params.assumptions ?? [])],

    confidence: {
      stock: num(params.confidence?.stock, 0),
      demand: num(params.confidence?.demand, 0),
      lead_time: num(params.confidence?.lead_time, 0),
      bom: num(params.confidence?.bom, 0),
    },

    awareness_level: clampInt(params.awareness_level ?? 0, 0, 3),
  };
}

function normalizeInventory(rows: any[]): TwinInventoryRow[] {
  return rows
    .map((r) => ({
      sku: String(r?.sku ?? r?.article ?? r?.item ?? "").trim(),
      onHand: num(r?.onHand ?? r?.on_hand ?? r?.qty ?? 0, 0),
    }))
    .filter((r) => r.sku);
}

function normalizeOrders(rows: any[]): TwinOrderRow[] {
  return rows
    .map((r) => ({
      orderId: String(r?.orderId ?? r?.id ?? r?.order ?? "").trim(),
      sku: String(r?.sku ?? r?.article ?? r?.item ?? "").trim(),
      qty: num(r?.qty ?? r?.quantity ?? 0, 0),
      dueDate: r?.dueDate ?? r?.due_date,
    }))
    .filter((r) => r.orderId && r.sku && r.qty > 0);
}

function normalizeSupply(rows: any[]): TwinSupplyRow[] {
  return rows
    .map((r) => ({
      sku: String(r?.sku ?? r?.article ?? r?.item ?? "").trim(),
      qty: num(r?.qty ?? r?.quantity ?? 0, 0),
      etaDate: r?.etaDate ?? r?.eta_date,
      source: r?.source,
    }))
    .filter((r) => r.sku && r.qty > 0);
}

function normalizeBom(rows: TwinBomEdge[]): TwinBomEdge[] {
  return rows
    .map((r) => ({
      parent: String(r?.parent ?? "").trim(),
      component: String(r?.component ?? "").trim(),
      ratio: num(r?.ratio, 0),
      source: r?.source ?? "PLAN",
    }))
    .filter((r) => r.parent && r.component && r.ratio > 0);
}

function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(x: number, lo: number, hi: number): number {
  const n = Math.round(x);
  if (!Number.isFinite(n)) return lo;
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
