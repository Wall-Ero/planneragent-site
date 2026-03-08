// core/src/decision/optimizer/generator.ts
// ======================================================
// PlannerAgent — Optimizer v1 Candidate Generator
// Canonical Source of Truth
// ======================================================

import type { Action, OptimizerInput } from "./contracts";
import { resolveConstraintsHint } from "./constraints";
import { mulberry32, pickInt, seedFromRequestId } from "./seeds";

/**
 * Generates ERP-safe local actions.
 * v1 focuses on:
 * - rescheduling deliveries (later)
 * - expediting supplier receipts (inject supply)
 * - short-term production adjustment (inject supply)
 */
export function generateCandidateActions(input: OptimizerInput): Action[][] {
  const hint = resolveConstraintsHint(input.constraints_hint);
  const seed = seedFromRequestId(input.requestId);
  const rng = mulberry32(seed);

  // Extract shortages per sku from a quick net model:
  const skus = extractSkusFromOrders(input.orders);
  const shortageBySku = estimateShortageBySku(input, skus);

  const candidates: Action[][] = [];

  // Candidate 0: do nothing
  candidates.push([]);

  // Reschedule candidates: for each order, shift within allowed range
  const orders = normalizeOrders(input.orders);
  for (const o of orders.slice(0, 12)) {
    const shift = pickInt(rng, 1, Math.max(1, hint.maxRescheduleDays));
    // Respect freeze horizon: if due very soon, still allow but will be penalized in evaluator
    candidates.push([
      {
        kind: "RESCHEDULE_DELIVERY",
        orderId: o.orderId,
        shiftDays: shift,
        reason: "opt_v1_reschedule_for_feasibility",
      },
    ]);
  }

  // Expedite candidates: inject part of shortage per sku
  for (const [sku, shortage] of shortageBySku.entries()) {
    if (shortage <= 0) continue;
    const cap = shortage * hint.maxExpeditePercent;
    const qty = Math.max(1, Math.floor(Math.min(shortage, cap)));
    candidates.push([
      {
        kind: "EXPEDITE_SUPPLIER",
        sku,
        qty,
        costFactor: 1.4,
        reason: "opt_v1_expedite_to_reduce_shortage",
      },
    ]);
  }

  // Production adjust candidates: similar to expedite, but with small delay
  for (const [sku, shortage] of shortageBySku.entries()) {
    if (shortage <= 0) continue;
    const qty = Math.max(1, Math.floor(shortage * 0.5));
    const days = pickInt(rng, 0, 3);
    candidates.push([
      {
        kind: "SHORT_TERM_PRODUCTION_ADJUST",
        sku,
        qty,
        availableInDays: days,
        costFactor: 1.25,
        reason: "opt_v1_short_term_prod_adjust",
      },
    ]);
  }

  // Mixed candidates (small combos): expedite + reschedule (limited)
  for (let i = 0; i < 8; i++) {
    const o = orders[pickInt(rng, 0, Math.max(0, orders.length - 1))];
    if (!o) break;

    const sku = pickOneSku(rng, shortageBySku);
    if (!sku) continue;

    const shortage = shortageBySku.get(sku) ?? 0;
    if (shortage <= 0) continue;

    const shift = pickInt(rng, 1, Math.max(1, hint.maxRescheduleDays));
    const qty = Math.max(1, Math.floor(shortage * 0.35));

    candidates.push([
      { kind: "RESCHEDULE_DELIVERY", orderId: o.orderId, shiftDays: shift, reason: "opt_v1_mix" },
      { kind: "EXPEDITE_SUPPLIER", sku, qty, costFactor: 1.35, reason: "opt_v1_mix" },
    ]);
  }

  return dedupe(candidates);
}

function normalizeOrders(orders: any[]): { orderId: string; sku: string; qty: number; dueDate: string }[] {
  return (orders ?? [])
    .map((o) => ({
      orderId: String(o?.orderId ?? o?.id ?? ""),
      sku: String(o?.sku ?? o?.item ?? o?.code ?? ""),
      qty: Number(o?.qty ?? o?.quantity ?? 0),
      dueDate: String(o?.dueDate ?? o?.due_date ?? ""),
    }))
    .filter((o) => o.orderId && o.sku && Number.isFinite(o.qty) && o.qty > 0);
}

function extractSkusFromOrders(orders: any[]): string[] {
  const set = new Set<string>();
  for (const o of orders ?? []) {
    const sku = String(o?.sku ?? o?.item ?? o?.code ?? "");
    if (sku) set.add(sku);
  }
  return Array.from(set);
}

function estimateShortageBySku(input: OptimizerInput, skus: string[]): Map<string, number> {
  // Very rough: demand per sku - net supply per sku
  const demandBySku = new Map<string, number>();
  for (const o of normalizeOrders(input.orders)) {
    demandBySku.set(o.sku, (demandBySku.get(o.sku) ?? 0) + o.qty);
  }

  const supplyBySku = new Map<string, number>();
  for (const it of input.inventory ?? []) {
    const sku = String(it?.sku ?? it?.item ?? it?.code ?? "");
    if (!sku) continue;
    const qty = Number(it?.qty ?? it?.onHand ?? it?.quantity ?? 0);
    supplyBySku.set(sku, (supplyBySku.get(sku) ?? 0) + (Number.isFinite(qty) ? qty : 0));
  }
  for (const mv of input.movements ?? []) {
    const sku = String(mv?.sku ?? mv?.item ?? mv?.code ?? "");
    if (!sku) continue;
    const type = String(mv?.type ?? mv?.direction ?? "").toUpperCase();
    const qty = Number(mv?.qty ?? mv?.quantity ?? 0);
    if (!Number.isFinite(qty) || qty === 0) continue;
    if (type === "IN" || type === "RECEIPT") supplyBySku.set(sku, (supplyBySku.get(sku) ?? 0) + qty);
    else if (type === "OUT" || type === "ISSUE") supplyBySku.set(sku, (supplyBySku.get(sku) ?? 0) - Math.abs(qty));
    else supplyBySku.set(sku, (supplyBySku.get(sku) ?? 0) + qty);
  }

  const shortageBySku = new Map<string, number>();
  for (const sku of skus) {
    const d = demandBySku.get(sku) ?? 0;
    const s = supplyBySku.get(sku) ?? 0;
    shortageBySku.set(sku, Math.max(0, d - s));
  }
  return shortageBySku;
}

function pickOneSku(rng: () => number, shortageBySku: Map<string, number>): string | null {
  const skus = Array.from(shortageBySku.entries())
    .filter(([_, sh]) => sh > 0)
    .map(([sku]) => sku);
  if (skus.length === 0) return null;
  const idx = Math.floor(rng() * skus.length);
  return skus[Math.max(0, Math.min(skus.length - 1, idx))] ?? null;
}

function dedupe(list: Action[][]): Action[][] {
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
