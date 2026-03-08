// core/src/decision/optimizer/evaluator.ts
// ======================================================
// PlannerAgent — Optimizer v1 Candidate Evaluator
// Canonical Source of Truth
// ======================================================

import type {
  Action,
  CandidatePlan,
  ConstraintsHint,
  ObjectiveWeights,
  OptimizerInput,
} from "./contracts";
import { evaluateActionConstraints, resolveConstraintsHint } from "./constraints";
import { resolveWeights, scoreFromKpis } from "./objective";
import { actionsSignature } from "./actions";

/**
 * v1 evaluation is intentionally "local" and ERP-safe:
 * - It simulates order fulfillment with simple supply buckets.
 * - It penalizes lateness (reschedule), shortages, and action churn/cost.
 *
 * Important: This evaluator does NOT require full APS master data.
 */
export function evaluateCandidate(
  input: OptimizerInput,
  actions: Action[],
  candidateIndex: number
): CandidatePlan {
  const constraintsUsed = resolveConstraintsHint(input.constraints_hint);
  const weightsUsed = resolveWeights(input.weights);

  const cEval = evaluateActionConstraints(actions, constraintsUsed, input.asOf);

  const evalSteps: string[] = [];
  evalSteps.push("eval:v1:start");

  // Build simple per-sku availability from inventory + movements (net)
  const baseSupply = buildBaseSupply(input.inventory, input.movements, evalSteps);

  // Apply actions into supply/demand adjustments
  const adjusted = applyActionsToModel(
    input,
    baseSupply,
    actions,
    constraintsUsed,
    evalSteps
  );

  // Allocate to orders sorted by dueDate then id
  const alloc = allocateOrders(adjusted, input.orders, constraintsUsed, evalSteps);

  // KPIs
  const kpis: Record<string, number> = {};
  kpis.shortageUnits = alloc.totalShortage;
  kpis.latenessDays = alloc.totalLatenessDays;
  kpis.planChurn = estimateChurn(actions);
  kpis.estimatedCost = estimateCost(actions);
  kpis.inventoryDeltaUnits = Math.max(0, adjusted.totalExtraSupply); // proxy
  kpis.serviceShortfall = alloc.serviceShortfall;

  // Hard feasibility rule: must not increase negative availability beyond 0
  let feasibleHard = cEval.feasibleHard;
  if (alloc.hardInfeasible) {
    feasibleHard = false;
    evalSteps.push("hard:allocation_infeasible");
  }

  // Soft violations from constraints + allocation notes
  const soft = [...cEval.softViolations, ...alloc.softViolations];

  // Score
  const score = scoreFromKpis(kpis, weightsUsed);

  const id = `cand_${candidateIndex}_${hashShort(actionsSignature(actions))}`;

  evalSteps.push("eval:v1:done");

  return {
    id,
    actions,
    feasibleHard,
    softViolations: uniq(soft),
    kpis,
    score,
    evidence: {
      constraintsUsed,
      weightsUsed,
      evalSteps,
    },
  };
}

type SupplyModel = {
  // available units per sku
  supplyBySku: Map<string, number>;
  // extra supply injected by actions (proxy KPI)
  totalExtraSupply: number;
};

function buildBaseSupply(inventory: any[], movements: any[], evalSteps: string[]): SupplyModel {
  const supplyBySku = new Map<string, number>();

  // inventory: try common shapes:
  // {sku, qty} or {sku, onHand} or {item, quantity}
  for (const it of inventory ?? []) {
    const sku = String(it?.sku ?? it?.item ?? it?.code ?? "");
    if (!sku) continue;
    const qty = Number(it?.qty ?? it?.onHand ?? it?.quantity ?? 0);
    add(supplyBySku, sku, qty);
  }

  // movements: net IN/OUT
  for (const mv of movements ?? []) {
    const sku = String(mv?.sku ?? mv?.item ?? mv?.code ?? "");
    if (!sku) continue;

    const type = String(mv?.type ?? mv?.direction ?? "").toUpperCase();
    const qty = Number(mv?.qty ?? mv?.quantity ?? 0);

    if (!Number.isFinite(qty) || qty === 0) continue;

    if (type === "IN" || type === "RECEIPT") add(supplyBySku, sku, qty);
    else if (type === "OUT" || type === "ISSUE") add(supplyBySku, sku, -Math.abs(qty));
    else {
      // Unknown type -> treat sign of qty
      add(supplyBySku, sku, qty);
    }
  }

  evalSteps.push(`model:baseSupply:skus=${supplyBySku.size}`);
  return { supplyBySku, totalExtraSupply: 0 };
}

function applyActionsToModel(
  input: OptimizerInput,
  base: SupplyModel,
  actions: Action[],
  hint: Required<ConstraintsHint>,
  evalSteps: string[]
): SupplyModel {
  const supplyBySku = new Map(base.supplyBySku);
  let totalExtraSupply = 0;

  // We do not simulate full time buckets in v1; we model effects locally:
  // - RESCHEDULE_DELIVERY reduces lateness penalty but doesn't create supply
  // - EXPEDITE_SUPPLIER injects supply for a sku
  // - PRODUCTION_ADJUST injects supply for a sku (short term)
  //
  // Note: if allowEarlyRelease=false, we still allow but record soft violation at constraint layer.
  for (const a of actions) {
    if (a.kind === "EXPEDITE_SUPPLIER") {
      const sku = a.sku;
      const qty = Number(a.qty);
      if (sku && Number.isFinite(qty) && qty > 0) {
        add(supplyBySku, sku, qty);
        totalExtraSupply += qty;
        evalSteps.push(`apply:expedite:${sku}:${qty}`);
      }
    }
    if (a.kind === "SHORT_TERM_PRODUCTION_ADJUST") {
      const sku = a.sku;
      const qty = Number(a.qty);
      if (sku && Number.isFinite(qty) && qty > 0) {
        add(supplyBySku, sku, qty);
        totalExtraSupply += qty;
        evalSteps.push(`apply:prod_adj:${sku}:${qty}`);
      }
    }
  }

  // Apply optional hints as implicit constraints effects (v1 limited)
  if (hint.maxExpeditePercent < 1) {
    evalSteps.push(`hint:maxExpeditePercent=${hint.maxExpeditePercent}`);
  }

  return { supplyBySku, totalExtraSupply };
}

function allocateOrders(
  model: SupplyModel,
  orders: any[],
  hint: Required<ConstraintsHint>,
  evalSteps: string[]
): {
  totalShortage: number;
  totalLatenessDays: number;
  serviceShortfall: number;
  hardInfeasible: boolean;
  softViolations: string[];
} {
  // Orders shape expectation:
  // {orderId, id, sku, qty, dueDate}
  const sorted = (orders ?? [])
    .map((o) => ({
      orderId: String(o?.orderId ?? o?.id ?? ""),
      sku: String(o?.sku ?? o?.item ?? o?.code ?? ""),
      qty: Number(o?.qty ?? o?.quantity ?? 0),
      dueDate: String(o?.dueDate ?? o?.due_date ?? ""),
    }))
    .filter((o) => o.orderId && o.sku && Number.isFinite(o.qty) && o.qty > 0)
    .sort((a, b) => {
      const da = a.dueDate || "";
      const db = b.dueDate || "";
      if (da < db) return -1;
      if (da > db) return 1;
      return a.orderId.localeCompare(b.orderId);
    });

  let totalShortage = 0;
  let totalLatenessDays = 0;
  let served = 0;
  let demand = 0;
  let hardInfeasible = false;

  const softViolations: string[] = [];

  for (const o of sorted) {
    demand += o.qty;
    const avail = model.supplyBySku.get(o.sku) ?? 0;
    if (avail >= o.qty) {
      model.supplyBySku.set(o.sku, avail - o.qty);
      served += o.qty;
      continue;
    }

    // partial serve
    if (avail > 0) {
      served += avail;
      model.supplyBySku.set(o.sku, 0);
    }

    const shortage = o.qty - Math.max(0, avail);
    totalShortage += shortage;

    // v1: lateness is not derived from schedule (no time buckets),
    // but we penalize "being inside freeze horizon" as service risk.
    if (hint.freezeHorizonDays > 0) {
      softViolations.push("SOFT:SHORTAGE_IN_FREEZE_HORIZON");
      totalLatenessDays += hint.freezeHorizonDays; // proxy
    }
  }

  // Hard infeasible if we produced negative supply (should not happen)
  for (const [_, v] of model.supplyBySku.entries()) {
    if (!Number.isFinite(v)) {
      hardInfeasible = true;
      break;
    }
  }

  const serviceShortfall = demand > 0 ? (demand - served) / demand : 0;

  evalSteps.push(`alloc:orders=${sorted.length}`);
  evalSteps.push(`kpi:shortage=${totalShortage}`);
  evalSteps.push(`kpi:serviceShortfall=${serviceShortfall.toFixed(6)}`);

  return {
    totalShortage,
    totalLatenessDays,
    serviceShortfall,
    hardInfeasible,
    softViolations: uniq(softViolations),
  };
}

function estimateChurn(actions: Action[]): number {
  // Simple proxy: number of actions + magnitude
  let churn = actions.length;
  for (const a of actions) {
    if (a.kind === "RESCHEDULE_DELIVERY") churn += Math.abs(a.shiftDays) * 0.1;
    if (a.kind === "EXPEDITE_SUPPLIER") churn += 0.2;
    if (a.kind === "SHORT_TERM_PRODUCTION_ADJUST") churn += 0.2;
  }
  return churn;
}

function estimateCost(actions: Action[]): number {
  let cost = 0;
  for (const a of actions) {
    if (a.kind === "EXPEDITE_SUPPLIER") cost += a.qty * (a.costFactor - 1);
    if (a.kind === "SHORT_TERM_PRODUCTION_ADJUST") cost += a.qty * (a.costFactor - 1);
  }
  return cost;
}

function add(m: Map<string, number>, k: string, v: number) {
  const cur = m.get(k) ?? 0;
  const next = cur + (Number.isFinite(v) ? v : 0);
  m.set(k, next);
}

function uniq(xs: string[]): string[] {
  return Array.from(new Set(xs));
}

function hashShort(s: string): string {
  // deterministic short hash for ids
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).slice(0, 8);
}
