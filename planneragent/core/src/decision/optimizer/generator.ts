// core/src/decision/optimizer/generator.ts
// ======================================================
// PlannerAgent — Optimizer v1 Candidate Generator
// Canonical Source of Truth
//
// v2 improvements:
// - topology aware
// - reality awareness aware
// - assumption aware
// - deterministic
// ======================================================

import type { Action, OptimizerInput } from "./contracts";
import { resolveConstraintsHint } from "./constraints";
import { mulberry32, pickInt, seedFromRequestId } from "./seeds";

export function generateCandidateActions(input: OptimizerInput): Action[][] {

  const hint = resolveConstraintsHint(input.constraints_hint);

  const seed = seedFromRequestId(input.requestId);
  const rng = mulberry32(seed);

  const orders = normalizeOrders(input.orders);

  const skus = extractSkusFromOrders(input.orders);

  const shortageBySku = estimateShortageBySku(input, skus);

  const topology = buildTopologyDegreeMap(input);

  const awarenessPenalty = computeAwarenessPenalty(input);

  const candidates: Action[][] = [];

  // --------------------------------------------------
  // Candidate 0 — baseline
  // --------------------------------------------------

  candidates.push([]);

  // --------------------------------------------------
  // RESCHEDULE CANDIDATES
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
        reason: "opt_v1_reschedule_for_feasibility",
      },
    ]);
  }

  // --------------------------------------------------
  // EXPEDITE CANDIDATES
  // --------------------------------------------------

  for (const [sku, shortage] of shortageBySku.entries()) {

    if (shortage <= 0) continue;

    const degree = topology.get(sku) ?? 0;

    // skip completely isolated SKUs
    if (degree === 0) continue;

    const cap = shortage * hint.maxExpeditePercent;

    let qty = Math.max(1, Math.floor(Math.min(shortage, cap)));

    // reduce aggressiveness if low awareness
    if (awarenessPenalty > 1) {
      qty = Math.floor(qty * 0.6);
    }

    candidates.push([
      {
        kind: "EXPEDITE_SUPPLIER",
        sku,
        qty,
        costFactor: 1.4,
        reason: "opt_v2_expedite_topology_aware",
      },
    ]);
  }

  // --------------------------------------------------
  // PRODUCTION ADJUST CANDIDATES
  // --------------------------------------------------

  for (const [sku, shortage] of shortageBySku.entries()) {

    if (shortage <= 0) continue;

    const degree = topology.get(sku) ?? 0;

    if (degree === 0) continue;

    let qty = Math.max(1, Math.floor(shortage * 0.5));

    if (awarenessPenalty > 1) {
      qty = Math.floor(qty * 0.7);
    }

    const days = pickInt(rng, 0, 3);

    candidates.push([
      {
        kind: "SHORT_TERM_PRODUCTION_ADJUST",
        sku,
        qty,
        availableInDays: days,
        costFactor: 1.25,
        reason: "opt_v2_short_term_prod_adjust",
      },
    ]);
  }

  // --------------------------------------------------
  // MIXED CANDIDATES
  // --------------------------------------------------

  for (let i = 0; i < 8; i++) {

    const o = orders[
      pickInt(
        rng,
        0,
        Math.max(0, orders.length - 1)
      )
    ];

    if (!o) break;

    const sku = pickOneSku(rng, shortageBySku);

    if (!sku) continue;

    const shortage = shortageBySku.get(sku) ?? 0;

    if (shortage <= 0) continue;

    const degree = topology.get(sku) ?? 0;

    if (degree === 0) continue;

    const shift = pickInt(
      rng,
      1,
      Math.max(1, hint.maxRescheduleDays)
    );

    let qty = Math.max(1, Math.floor(shortage * 0.35));

    if (awarenessPenalty > 1) {
      qty = Math.floor(qty * 0.7);
    }

    candidates.push([
      {
        kind: "RESCHEDULE_DELIVERY",
        orderId: o.orderId,
        shiftDays: shift,
        reason: "opt_v2_mix",
      },
      {
        kind: "EXPEDITE_SUPPLIER",
        sku,
        qty,
        costFactor: 1.35,
        reason: "opt_v2_mix",
      },
    ]);
  }

  return dedupe(candidates);
}

// --------------------------------------------------
// ORDER NORMALIZATION
// --------------------------------------------------

function normalizeOrders(orders: any[]) {

  return (orders ?? [])
    .map((o) => ({
      orderId: String(o?.orderId ?? o?.id ?? ""),
      sku: String(o?.sku ?? o?.item ?? o?.code ?? ""),
      qty: Number(o?.qty ?? o?.quantity ?? 0),
      dueDate: String(o?.dueDate ?? o?.due_date ?? ""),
    }))
    .filter(
      (o) =>
        o.orderId &&
        o.sku &&
        Number.isFinite(o.qty) &&
        o.qty > 0
    );
}

// --------------------------------------------------
// SKU EXTRACTION
// --------------------------------------------------

function extractSkusFromOrders(orders: any[]) {

  const set = new Set<string>();

  for (const o of orders ?? []) {

    const sku = String(
      o?.sku ??
      o?.item ??
      o?.code ??
      ""
    );

    if (sku) set.add(sku);
  }

  return Array.from(set);
}

// --------------------------------------------------
// SHORTAGE ESTIMATION
// --------------------------------------------------

function estimateShortageBySku(
  input: OptimizerInput,
  skus: string[]
) {

  const demandBySku = new Map<string, number>();

  for (const o of normalizeOrders(input.orders)) {

    demandBySku.set(
      o.sku,
      (demandBySku.get(o.sku) ?? 0) + o.qty
    );
  }

  const supplyBySku = new Map<string, number>();

  for (const it of input.inventory ?? []) {

    const sku = String(
      it?.sku ??
      it?.item ??
      it?.code ??
      ""
    );

    if (!sku) continue;

    const qty = Number(
      it?.qty ??
      it?.onHand ??
      it?.quantity ??
      0
    );

    supplyBySku.set(
      sku,
      (supplyBySku.get(sku) ?? 0) +
        (Number.isFinite(qty) ? qty : 0)
    );
  }

  for (const mv of input.movements ?? []) {

    const sku = String(
      mv?.sku ??
      mv?.item ??
      mv?.code ??
      ""
    );

    if (!sku) continue;

    const type = String(
      mv?.type ??
      mv?.direction ??
      ""
    ).toUpperCase();

    const qty = Number(
      mv?.qty ??
      mv?.quantity ??
      0
    );

    if (!Number.isFinite(qty) || qty === 0) continue;

    if (type === "IN" || type === "RECEIPT") {

      supplyBySku.set(
        sku,
        (supplyBySku.get(sku) ?? 0) + qty
      );

    } else if (type === "OUT" || type === "ISSUE") {

      supplyBySku.set(
        sku,
        (supplyBySku.get(sku) ?? 0) - Math.abs(qty)
      );

    }
  }

  const shortageBySku = new Map<string, number>();

  for (const sku of skus) {

    const d = demandBySku.get(sku) ?? 0;
    const s = supplyBySku.get(sku) ?? 0;

    shortageBySku.set(
      sku,
      Math.max(0, d - s)
    );
  }

  return shortageBySku;
}

// --------------------------------------------------
// TOPOLOGY
// --------------------------------------------------

function buildTopologyDegreeMap(input: OptimizerInput) {

  const map = new Map<string, number>();

  const topology = input.operationalTopology;

  if (!topology) return map;

  for (const e of topology.edges ?? []) {

    map.set(
      e.from,
      (map.get(e.from) ?? 0) + 1
    );

    map.set(
      e.to,
      (map.get(e.to) ?? 0) + 1
    );
  }

  return map;
}

// --------------------------------------------------
// AWARENESS
// --------------------------------------------------

function computeAwarenessPenalty(input: OptimizerInput) {

  const assumptions =
    input.realitySnapshot?.assumptions ?? [];

  const awareness =
    Number(
      input.realitySnapshot?.awareness_level ?? 0
    );

  let penalty = 0;

  penalty += Math.min(
    1.5,
    assumptions.length * 0.15
  );

  if (awareness <= 0) penalty += 1;
  else if (awareness === 1) penalty += 0.6;
  else if (awareness === 2) penalty += 0.2;

  return penalty;
}

// --------------------------------------------------
// RANDOM SKU PICK
// --------------------------------------------------

function pickOneSku(
  rng: () => number,
  shortageBySku: Map<string, number>
) {

  const skus = Array.from(shortageBySku.entries())
    .filter(([_, sh]) => sh > 0)
    .map(([sku]) => sku);

  if (skus.length === 0) return null;

  const idx = Math.floor(
    rng() * skus.length
  );

  return skus[
    Math.max(
      0,
      Math.min(skus.length - 1, idx)
    )
  ] ?? null;
}

// --------------------------------------------------
// DEDUPE
// --------------------------------------------------

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