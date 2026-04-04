// PATH: core/src/decision/optimizer/generator.ts
// ======================================================
// PlannerAgent — Optimizer Candidate Generator v7
// Canonical Source of Truth
//
// v7 improvements
// - builder-first architecture
// - deterministic candidate injection
// - preserves v6 logic as exploration layer
// - eliminates semantic mismatch risk
// - removes legacy double-count shortage logic
// ======================================================

import type { Action, OptimizerInput } from "./contracts";

import { resolveConstraintsHint } from "./constraints";
import { mulberry32, pickInt, seedFromRequestId } from "./seeds";

import { buildActionsFromRealityV2 } from "../../execution/action.builder.v2";

// ======================================================
// ENTRY
// ======================================================

export function generateCandidateActions(input: OptimizerInput): Action[][] {
  console.log("GENERATOR_V7_ACTIVE");

  const hint = resolveConstraintsHint(input.constraints_hint);

  const seed = seedFromRequestId(input.requestId);
  const rng = mulberry32(seed);

  // --------------------------------------------------
  // INPUTS
  // IMPORTANT:
  // orders / inventory / movements are already normalized
  // and aligned upstream by orchestrator.
  // DO NOT re-normalize and DO NOT re-interpret here.
  // --------------------------------------------------

  const orders = normalizeOrdersForGenerator(input.orders ?? []);
  const inventory = normalizeInventoryForGenerator(input.inventory ?? []);
  const movements = normalizeMovementsForGenerator(input.movements ?? []);

  const skus = extractSkusFromOrders(orders);

  // --------------------------------------------------
  // SHORTAGE (light exploration only)
  // IMPORTANT:
  // generator must not double count movements into supply,
  // because inventory in input is already effective inventory.
  // --------------------------------------------------

  const shortageBySku = estimateShortageBySku(
    orders,
    inventory,
    skus
  );

  // --------------------------------------------------
  // DEBUG
  // --------------------------------------------------

  console.log(
    "[OPT] ORDERS_SEEN",
    orders.map((o) => ({
      orderId: o.orderId,
      sku: o.sku,
      qty: o.qty
    }))
  );

  console.log(
    "[OPT] INVENTORY_SEEN",
    inventory.map((i) => ({
      sku: i.sku,
      qty: i.qty
    }))
  );

  console.log(
    "[OPT] SHORTAGE_MAP",
    Array.from(shortageBySku.entries()).map(([sku, shortage]) => ({
      sku,
      shortage
    }))
  );

  // --------------------------------------------------
  // TOPOLOGY / LEADTIME
  // --------------------------------------------------

  const topology = buildTopologyDegreeMap(input);
  const leadTimes = extractLeadTimes(movements);

  const candidates: Action[][] = [];

  // ==================================================
  // BUILDER FIRST (CORE CHANGE V7)
  // ==================================================

  const builderActions = buildActionsFromRealityV2(input);

  if (builderActions.length > 0) {
    console.log("[GENERATOR] BUILDER_INJECTED", builderActions);
    candidates.push(builderActions);
  }

  // --------------------------------------------------
  // BASELINE
  // --------------------------------------------------

  candidates.push([]);

  // --------------------------------------------------
  // RESCHEDULE
  // --------------------------------------------------

  for (const o of orders.slice(0, 12)) {
    const shift = pickInt(
      rng,
      1,
      Math.max(1, hint.maxRescheduleDays)
    );

    candidates.push([
      {
        kind: "RESCHEDULE_DELIVERY",
        orderId: o.orderId,
        shiftDays: shift,
        reason: "opt_v7_reschedule",
      },
    ]);
  }

  // --------------------------------------------------
  // SHORTAGE ACTIONS (exploration layer)
  // --------------------------------------------------

  for (const [sku, shortage] of shortageBySku.entries()) {
    if (shortage <= 0) continue;

    const degree = topology.get(sku) ?? 0;
    const leadTime = leadTimes.get(sku) ?? 7;

    const qty = Math.max(
      1,
      Math.floor(shortage * hint.maxExpeditePercent)
    );

    candidates.push([
      {
        kind: "EXPEDITE_SUPPLIER",
        sku,
        qty,
        costFactor: leadTime > 10 ? 1.6 : 1.3,
        reason:
          degree === 0
            ? "opt_v7_expedite_assumed_supply"
            : "opt_v7_expedite_topology",
      },
    ]);

    if (degree > 0) {
      const adjustQty = Math.max(
        1,
        Math.floor(shortage * 0.5)
      );

      candidates.push([
        {
          kind: "SHORT_TERM_PRODUCTION_ADJUST",
          sku,
          qty: adjustQty,
          availableInDays: pickInt(rng, 0, 3),
          costFactor: 1.25,
          reason: "opt_v7_prod_adjust",
        },
      ]);
    }
  }

  // --------------------------------------------------
  // MIXED
  // --------------------------------------------------

  for (let i = 0; i < 6; i++) {
    const o = orders[
      pickInt(
        rng,
        0,
        Math.max(0, orders.length - 1)
      )
    ];

    if (!o) break;

    const sku = o.sku;
    const shortage = shortageBySku.get(sku) ?? 0;

    if (shortage <= 0) continue;

    const shift = pickInt(rng, 1, 3);
    const qty = Math.max(1, Math.floor(shortage * 0.3));

    candidates.push([
      {
        kind: "RESCHEDULE_DELIVERY",
        orderId: o.orderId,
        shiftDays: shift,
        reason: "opt_v7_mix",
      },
      {
        kind: "EXPEDITE_SUPPLIER",
        sku,
        qty,
        costFactor: 1.4,
        reason: "opt_v7_mix",
      },
    ]);
  }

  return dedupe(candidates);
}

// ======================================================
// SHORTAGE
// ======================================================

function estimateShortageBySku(
  orders: Array<{ orderId: string; sku: string; qty: number }>,
  inventory: Array<{ sku: string; qty: number }>,
  skus: string[]
) {
  const demand = new Map<string, number>();
  const supply = new Map<string, number>();

  for (const o of orders) {
    demand.set(o.sku, (demand.get(o.sku) ?? 0) + o.qty);
  }

  // IMPORTANT:
  // inventory here is already effective inventory
  // (snapshot + reconstruction handled upstream)
  for (const i of inventory) {
    supply.set(i.sku, (supply.get(i.sku) ?? 0) + i.qty);
  }

  const shortage = new Map<string, number>();

  for (const sku of skus) {
    const d = demand.get(sku) ?? 0;
    const s = supply.get(sku) ?? 0;
    shortage.set(sku, Math.max(0, d - s));
  }

  return shortage;
}

// ======================================================
// LEAD TIMES
// ======================================================

function extractLeadTimes(
  movements: Array<{ sku: string; lead_time?: number }>
) {
  const map = new Map<string, number>();

  for (const m of movements) {
    if (!m.sku) continue;

    const lt = Number(m.lead_time ?? 0);

    if (lt > 0) {
      map.set(m.sku, lt);
    }
  }

  return map;
}

// ======================================================
// TOPOLOGY
// ======================================================

function buildTopologyDegreeMap(input: OptimizerInput) {
  const map = new Map<string, number>();
  const topology = input.operationalTopology;

  if (!topology) return map;

  for (const e of topology.edges ?? []) {
    map.set(e.from, (map.get(e.from) ?? 0) + 1);
    map.set(e.to, (map.get(e.to) ?? 0) + 1);
  }

  return map;
}

// ======================================================
// INPUT NORMALIZATION FOR GENERATOR
// ======================================================

function normalizeOrdersForGenerator(
  orders: any[]
): Array<{ orderId: string; sku: string; qty: number }> {
  return (orders ?? [])
    .map((o, index) => {
      const orderId = String(o?.orderId ?? o?.id ?? `AUTO_ORDER_${index + 1}`).trim();
      const sku = String(o?.sku ?? o?.item ?? o?.code ?? "").trim();
      const qty = Number(o?.qty ?? o?.quantity ?? 0);

      return { orderId, sku, qty };
    })
    .filter((o) => o.sku && Number.isFinite(o.qty) && o.qty > 0);
}

function normalizeInventoryForGenerator(
  inventory: any[]
): Array<{ sku: string; qty: number }> {
  return (inventory ?? [])
    .map((i) => {
      const sku = String(i?.sku ?? i?.item ?? i?.code ?? "").trim();
      const qty = Number(i?.qty ?? i?.quantity ?? i?.onHand ?? i?.on_hand ?? 0);

      return { sku, qty };
    })
    .filter((i) => i.sku && Number.isFinite(i.qty));
}

function normalizeMovementsForGenerator(
  movements: any[]
): Array<{ sku: string; qty: number; type?: string; date?: string; lead_time?: number }> {
  return (movements ?? [])
    .map((m) => ({
      sku: String(m?.sku ?? m?.item ?? m?.code ?? "").trim(),
      qty: Number(m?.qty ?? m?.quantity ?? 0),
      type: m?.type,
      date: m?.date,
      lead_time: Number(m?.lead_time ?? 0),
    }))
    .filter((m) => m.sku && Number.isFinite(m.qty));
}

// ======================================================
// HELPERS
// ======================================================

function extractSkusFromOrders(orders: Array<{ sku: string }>) {
  const set = new Set<string>();

  for (const o of orders) {
    if (o.sku) set.add(o.sku);
  }

  return Array.from(set);
}

function dedupe(list: Action[][]) {
  const seen = new Set<string>();
  const out: Action[][] = [];

  for (const a of list) {
    const key = JSON.stringify(a);

    if (seen.has(key)) continue;

    seen.add(key);
    out.push(a);
  }

  return out;
}