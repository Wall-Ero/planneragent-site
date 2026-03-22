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
import { actionsSignature } from "./actions";

// ------------------------------------------------------
// Weight resolution
// ------------------------------------------------------

function resolveWeights(w?: Partial<ObjectiveWeights>): Required<ObjectiveWeights> {
  return {
    lateness: clamp(w?.lateness ?? 3.0, 0, 10),
    shortage: clamp(w?.shortage ?? 10.0, 0, 100),
    inventory: clamp(w?.inventory ?? 0.7, 0, 10),
    stability: clamp(w?.stability ?? 1.2, 0, 10),
    cost: clamp(w?.cost ?? 1.5, 0, 10),
    service: clamp(w?.service ?? 4.0, 0, 20),
    context: clamp(w?.context ?? 2.0, 0, 20),
  };
}

// ------------------------------------------------------
// Main evaluator
// ------------------------------------------------------

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

  const baseSupply = buildBaseSupply(input.inventory, input.movements, evalSteps);

  const adjusted = applyActionsToModel(
    input,
    baseSupply,
    actions,
    constraintsUsed,
    evalSteps
  );

  const alloc = allocateOrders(adjusted, input.orders, constraintsUsed, evalSteps);

  const kpis: Record<string, number> = {};
  kpis.shortageUnits = alloc.totalShortage;
  kpis.latenessDays = alloc.totalLatenessDays;
  kpis.planChurn = estimateChurn(actions);
  kpis.estimatedCost = estimateCost(actions);
  kpis.inventoryDeltaUnits = Math.max(0, adjusted.totalExtraSupply);
  kpis.serviceShortfall = alloc.serviceShortfall;

  const contextPenalty = computeContextPenalty(input, actions, evalSteps);
  kpis.contextPenalty = contextPenalty;

  let feasibleHard = cEval.feasibleHard;
  if (alloc.hardInfeasible) {
    feasibleHard = false;
    evalSteps.push("hard:allocation_infeasible");
  }

  const soft = [...cEval.softViolations, ...alloc.softViolations];

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

// ------------------------------------------------------
// Scoring
// ------------------------------------------------------

function scoreFromKpis(
  kpis: Record<string, number>,
  weights: Required<ObjectiveWeights>
): number {
  const lateness = num(kpis.latenessDays);
  const shortage = num(kpis.shortageUnits);
  const inv = num(kpis.inventoryDeltaUnits);
  const churn = num(kpis.planChurn);
  const cost = num(kpis.estimatedCost);
  const serviceLoss = num(kpis.serviceShortfall);
  const contextPenalty = num(kpis.contextPenalty);

  return (
    weights.lateness * lateness +
    weights.shortage * shortage +
    weights.inventory * inv +
    weights.stability * churn +
    weights.cost * cost +
    weights.service * serviceLoss +
    weights.context * contextPenalty
  );
}

// ------------------------------------------------------
// Context penalty
// ------------------------------------------------------

function computeContextPenalty(
  input: OptimizerInput,
  actions: Action[],
  evalSteps: string[]
): number {
  let penalty = 0;

  const assumptions = input.realitySnapshot?.assumptions ?? [];
  const awareness = num(input.realitySnapshot?.awareness_level ?? 0);

  if (assumptions.length > 0) {
    const raw = Math.min(2, assumptions.length * 0.15);
    penalty += raw;
    evalSteps.push(`context:assumptions=${assumptions.length}`);
  }

  const awarenessPenalty = awareness <= 0 ? 1.0 : awareness === 1 ? 0.6 : awareness === 2 ? 0.2 : 0;
  penalty += awarenessPenalty;
  evalSteps.push(`context:awareness_penalty=${round3(awarenessPenalty)}`);

  const topology = input.operationalTopology;
  if (!topology || !Array.isArray(topology.nodes) || topology.nodes.length === 0) {
    penalty += 0.5;
    evalSteps.push("context:topology_missing");
    return round3(penalty);
  }

  const nodeIds = new Set(topology.nodes.map((n) => n.id));
  const edgeIndex = buildEdgeIndex(topology.edges ?? []);

  for (const a of actions) {
    const sku = actionSku(a);
    if (!sku) continue;

    if (!nodeIds.has(sku)) {
      penalty += 0.4;
      evalSteps.push(`context:sku_not_in_topology:${sku}`);
      continue;
    }

    const degree = edgeIndex.get(sku) ?? 0;
    if (degree === 0) {
      penalty += 0.2;
      evalSteps.push(`context:isolated_topology_node:${sku}`);
    }
  }

  return round3(penalty);
}

function buildEdgeIndex(
  edges: Array<{ from: string; to: string; relation: string; weight?: number }>
): Map<string, number> {
  const out = new Map<string, number>();

  for (const e of edges ?? []) {
    out.set(e.from, (out.get(e.from) ?? 0) + 1);
    out.set(e.to, (out.get(e.to) ?? 0) + 1);
  }

  return out;
}

function actionSku(a: Action): string | undefined {
  if (a.kind === "EXPEDITE_SUPPLIER") return a.sku;
  if (a.kind === "SHORT_TERM_PRODUCTION_ADJUST") return a.sku;
  return undefined;
}

// ------------------------------------------------------
// Supply model
// ------------------------------------------------------

type SupplyModel = {
  supplyBySku: Map<string, number>;
  totalExtraSupply: number;
};

function buildBaseSupply(inventory: any[], movements: any[], evalSteps: string[]): SupplyModel {
  const supplyBySku = new Map<string, number>();

  for (const it of inventory ?? []) {
    const sku = String(it?.sku ?? it?.item ?? it?.code ?? "");
    if (!sku) continue;
    const qty = Number(it?.qty ?? it?.onHand ?? it?.on_hand ?? it?.quantity ?? 0);
    add(supplyBySku, sku, qty);
  }

  for (const mv of movements ?? []) {
    const sku = String(mv?.sku ?? mv?.item ?? mv?.code ?? "");
    if (!sku) continue;

    const type = String(mv?.type ?? mv?.direction ?? "").toUpperCase();
    const qty = Number(mv?.qty ?? mv?.quantity ?? 0);

    if (!Number.isFinite(qty) || qty === 0) continue;

    if (type === "IN" || type === "RECEIPT") add(supplyBySku, sku, qty);
    else if (type === "OUT" || type === "ISSUE") add(supplyBySku, sku, -Math.abs(qty));
    else add(supplyBySku, sku, qty);
  }

  evalSteps.push(`model:baseSupply:skus=${supplyBySku.size}`);
  return { supplyBySku, totalExtraSupply: 0 };
}

function applyActionsToModel(
  _input: OptimizerInput,
  base: SupplyModel,
  actions: Action[],
  hint: Required<ConstraintsHint>,
  evalSteps: string[]
): SupplyModel {
  const supplyBySku = new Map(base.supplyBySku);
  let totalExtraSupply = 0;

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

  if (hint.maxExpeditePercent < 1) {
    evalSteps.push(`hint:maxExpeditePercent=${hint.maxExpeditePercent}`);
  }

  return { supplyBySku, totalExtraSupply };
}

// ------------------------------------------------------
// Allocation
// ------------------------------------------------------

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
  const sorted = (orders ?? [])
    .map((o, index) => {
      const orderIdRaw = String(o?.orderId ?? o?.id ?? "").trim();
      const sku = String(o?.sku ?? o?.item ?? o?.code ?? "").trim();
      const qty = Number(o?.qty ?? o?.quantity ?? 0);

      const dueDateRaw =
        o?.dueDate ??
        o?.due_date ??
        o?.deliveryDate ??
        o?.delivery_date ??
        "";

      const dueDate = String(dueDateRaw ?? "").trim();

      return {
        orderId: orderIdRaw || `AUTO_ORDER_${index + 1}_${sku || "UNKNOWN"}`,
        sku,
        qty,
        dueDate,
      };
    })
    .filter((o) => o.sku && Number.isFinite(o.qty) && o.qty > 0)
    .sort((a, b) => {
      const aHasDue = a.dueDate.length > 0;
      const bHasDue = b.dueDate.length > 0;

      if (aHasDue && bHasDue) {
        if (a.dueDate < b.dueDate) return -1;
        if (a.dueDate > b.dueDate) return 1;
      } else if (aHasDue !== bHasDue) {
        return aHasDue ? -1 : 1;
      }

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

    if (avail > 0) {
      served += avail;
      model.supplyBySku.set(o.sku, 0);
    }

    const shortage = o.qty - Math.max(0, avail);
    totalShortage += shortage;

    if (hint.freezeHorizonDays > 0) {
      softViolations.push("SOFT:SHORTAGE_IN_FREEZE_HORIZON");
      totalLatenessDays += hint.freezeHorizonDays;
    }
  }

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

// ------------------------------------------------------
// KPI helpers
// ------------------------------------------------------

function estimateChurn(actions: Action[]): number {
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

// ------------------------------------------------------
// Utilities
// ------------------------------------------------------

function add(m: Map<string, number>, k: string, v: number) {
  const cur = m.get(k) ?? 0;
  const next = cur + (Number.isFinite(v) ? v : 0);
  m.set(k, next);
}

function uniq(xs: string[]): string[] {
  return Array.from(new Set(xs));
}

function hashShort(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).slice(0, 8);
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}