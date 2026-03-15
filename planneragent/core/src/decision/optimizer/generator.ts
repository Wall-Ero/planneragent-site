// PATH: core/src/decision/optimizer/generator.ts
// ======================================================
// PlannerAgent — Optimizer Candidate Generator v6
// Canonical Source of Truth
//
// v6 improvements
// - deterministic debug logs
// - canonical dataset usage
// - shortage-driven candidates
// ======================================================

import type { Action, OptimizerInput } from "./contracts";

import { resolveConstraintsHint } from "./constraints";
import { mulberry32, pickInt, seedFromRequestId } from "./seeds";

import {
  normalizeOrders,
  normalizeInventory,
  normalizeMovements,
} from "../../../datasets/dlci/adapters";

// ======================================================
// ENTRY
// ======================================================

export function generateCandidateActions(input: OptimizerInput): Action[][] {

  console.log("GENERATOR_V6_ACTIVE");

  const hint = resolveConstraintsHint(input.constraints_hint);

  const seed = seedFromRequestId(input.requestId);
  const rng = mulberry32(seed);

  const orders = normalizeOrders(input.orders ?? []);
  const inventory = normalizeInventory(input.inventory ?? []);
  const movements = normalizeMovements(input.movements ?? []);

  const skus = extractSkusFromOrders(orders);

  const shortageBySku = estimateShortageBySku(
    orders,
    inventory,
    movements,
    skus
  );

  // --------------------------------------------------
  // DETERMINISTIC DEBUG LOGS
  // --------------------------------------------------

  console.log(
    "[OPT] ORDERS_SEEN",
    orders.map(o => ({
      orderId: o.orderId,
      sku: o.sku,
      qty: o.qty
    }))
  );

  console.log(
    "[OPT] INVENTORY_SEEN",
    inventory.map(i => ({
      sku: i.sku,
      qty: i.qty
    }))
  );

  console.log(
    "[OPT] SHORTAGE_MAP",
    Array.from(shortageBySku.entries())
      .map(([sku, shortage]) => ({
        sku,
        shortage
      }))
  );

  // --------------------------------------------------
  // TOPOLOGY
  // --------------------------------------------------

  const topology = buildTopologyDegreeMap(input);

  const leadTimes = extractLeadTimes(movements);

  const candidates: Action[][] = [];

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
        reason: "opt_v6_reschedule",
      },
    ]);

  }

  // --------------------------------------------------
  // SHORTAGE ACTIONS
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
            ? "opt_v6_expedite_assumed_supply"
            : "opt_v6_expedite_topology",
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
          reason: "opt_v6_prod_adjust",
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
        reason: "opt_v6_mix",
      },
      {
        kind: "EXPEDITE_SUPPLIER",
        sku,
        qty,
        costFactor: 1.4,
        reason: "opt_v6_mix",
      },
    ]);

  }

  return dedupe(candidates);

}

// ======================================================
// SHORTAGE
// ======================================================

function estimateShortageBySku(
  orders: any[],
  inventory: any[],
  movements: any[],
  skus: string[]
) {

  const demand = new Map<string, number>();
  const supply = new Map<string, number>();

  for (const o of orders) {

    demand.set(
      o.sku,
      (demand.get(o.sku) ?? 0) + o.qty
    );

  }

  for (const i of inventory) {

    supply.set(
      i.sku,
      (supply.get(i.sku) ?? 0) + i.qty
    );

  }

  for (const m of movements) {

    supply.set(
      m.sku,
      (supply.get(m.sku) ?? 0) + m.qty
    );

  }

  const shortage = new Map<string, number>();

  for (const sku of skus) {

    const d = demand.get(sku) ?? 0;
    const s = supply.get(sku) ?? 0;

    shortage.set(
      sku,
      Math.max(0, d - s)
    );

  }

  return shortage;

}

// ======================================================
// LEAD TIMES
// ======================================================

function extractLeadTimes(movements: any[]) {

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
// HELPERS
// ======================================================

function extractSkusFromOrders(orders: any[]) {

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