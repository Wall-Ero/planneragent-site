// core/src/decision/optimizer/evaluator.ts
// ======================================================
// PlannerAgent — Optimizer v2 Candidate Evaluator
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
import { computeAllocationV2 } from "../allocation/computeAllocation.v2";

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
  evalSteps.push("eval:v2:start");

  // --------------------------------------------------
  // BASE INVENTORY MODEL
  // IMPORTANT:
  // inventory in input is already effective inventory
  // (potentially merged in orchestrator)
  // so we MUST NOT add movements again here
  // --------------------------------------------------

  const baseSupply = buildBaseSupply(input.inventory, evalSteps);

  const adjusted = applyActionsToModel(
    input,
    baseSupply,
    actions,
    constraintsUsed,
    evalSteps
  );

  // --------------------------------------------------
  // DETERMINISTIC ALLOCATION V2
  // --------------------------------------------------

  const normalizedOrders = normalizeOrdersForAllocation(input.orders);
  const normalizedInventory = mapSupplyModelToInventory(adjusted);

  const allocation = computeAllocationV2(
    normalizedOrders,
    normalizedInventory
  );

  const shortageUnits = Object.values(allocation.shortageMap)
    .reduce((a, b) => a + b, 0);

  const totalDemand = normalizedOrders.reduce((sum, o) => sum + num(o.qty), 0);

  const serviceShortfall =
    totalDemand > 0
      ? shortageUnits / totalDemand
      : 0;

  const inventoryDeltaUnits = Object.values(allocation.remainingInventory)
    .reduce((a, b) => a + num(b), 0);

  const totalLatenessDays =
    shortageUnits > 0 && constraintsUsed.freezeHorizonDays > 0
      ? constraintsUsed.freezeHorizonDays
      : 0;

  const hardInfeasible = Object.values(allocation.remainingInventory)
    .some((v) => !Number.isFinite(v));

  const softViolations: string[] = [];

  if (shortageUnits > 0 && constraintsUsed.freezeHorizonDays > 0) {
    softViolations.push("SOFT:SHORTAGE_IN_FREEZE_HORIZON");
  }

  evalSteps.push(`alloc:orders=${normalizedOrders.length}`);
  evalSteps.push(`kpi:shortage=${shortageUnits}`);
  evalSteps.push(`kpi:serviceShortfall=${serviceShortfall.toFixed(6)}`);
  evalSteps.push(`kpi:remainingInventory=${round3(inventoryDeltaUnits)}`);

  console.log("ALLOC_V2_LOG", allocation.allocationLog);
  console.log("ALLOC_V2_SHORTAGE_MAP", allocation.shortageMap);
  console.log("ALLOC_V2_REMAINING_INV", allocation.remainingInventory);

  const kpis: Record<string, number> = {};
  kpis.shortageUnits = shortageUnits;
  kpis.latenessDays = totalLatenessDays;
  kpis.planChurn = estimateChurn(actions);
  kpis.estimatedCost = estimateCost(actions);
  kpis.inventoryDeltaUnits = Math.max(0, inventoryDeltaUnits);
  kpis.serviceShortfall = serviceShortfall;

  const plannerContext = computePlannerContextMetrics(input, actions, evalSteps);
  kpis.contextPenalty = plannerContext.contextPenalty;

  let feasibleHard = cEval.feasibleHard;
  if (hardInfeasible) {
    feasibleHard = false;
    evalSteps.push("hard:allocation_infeasible");
  }

  const soft = [...cEval.softViolations, ...softViolations];

  const score = scoreFromKpis(
    kpis,
    weightsUsed,
    plannerContext
  );

  const id = `cand_${candidateIndex}_${hashShort(actionsSignature(actions))}`;

  evalSteps.push("eval:v2:done");

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

type PlannerContextMetrics = {
  contextPenalty: number;
  singleActionPenalty: number;
  diversityBonus: number;
  assumedSupplyPenalty: number;
  confidenceBonus: number;
};

function scoreFromKpis(
  kpis: Record<string, number>,
  weights: Required<ObjectiveWeights>,
  plannerContext: PlannerContextMetrics
): number {
  const lateness = num(kpis.latenessDays);
  const shortage = num(kpis.shortageUnits);
  const inv = num(kpis.inventoryDeltaUnits);
  const churn = num(kpis.planChurn);
  const cost = num(kpis.estimatedCost);
  const serviceLoss = num(kpis.serviceShortfall);
  const contextPenalty = num(kpis.contextPenalty);

  const baseScore =
    weights.lateness * lateness +
    weights.shortage * shortage +
    weights.inventory * inv +
    weights.stability * churn +
    weights.cost * cost +
    weights.service * serviceLoss +
    weights.context * contextPenalty;

  const plannerPenalty =
    plannerContext.singleActionPenalty +
    plannerContext.assumedSupplyPenalty;

  const plannerBonus =
    plannerContext.diversityBonus +
    plannerContext.confidenceBonus;

  return round3(baseScore + plannerPenalty - plannerBonus);
}

// ------------------------------------------------------
// Planner-aware context
// ------------------------------------------------------

function computePlannerContextMetrics(
  input: OptimizerInput,
  actions: Action[],
  evalSteps: string[]
): PlannerContextMetrics {
  let penalty = 0;

  const assumptions = input.realitySnapshot?.assumptions ?? [];
  const awareness = num(input.realitySnapshot?.awareness_level ?? 0);

  if (assumptions.length > 0) {
    const raw = Math.min(2, assumptions.length * 0.15);
    penalty += raw;
    evalSteps.push(`context:assumptions=${assumptions.length}`);
  }

  const awarenessPenalty =
    awareness <= 0 ? 1.0 :
    awareness === 1 ? 0.6 :
    awareness === 2 ? 0.2 :
    0;

  penalty += awarenessPenalty;
  evalSteps.push(`context:awareness_penalty=${round3(awarenessPenalty)}`);

  const topology = input.operationalTopology;

  let isolatedSkuCount = 0;
  let topologyMissing = false;

  if (!topology || !Array.isArray(topology.nodes) || topology.nodes.length === 0) {
    penalty += 0.5;
    topologyMissing = true;
    evalSteps.push("context:topology_missing");
  } else {
    const nodeIds = new Set(topology.nodes.map((n) => n.id));
    const edgeIndex = buildEdgeIndex(topology.edges ?? []);

    const uniqueSkus = new Set<string>();

    for (const a of actions) {
      const sku = actionSku(a);
      if (!sku) continue;
      uniqueSkus.add(sku);
    }

    for (const sku of uniqueSkus) {
      if (!nodeIds.has(sku)) {
        penalty += 0.4;
        evalSteps.push(`context:sku_not_in_topology:${sku}`);
        continue;
      }

      const degree = edgeIndex.get(sku) ?? 0;
      if (degree === 0) {
        isolatedSkuCount += 1;
        penalty += 0.2;
        evalSteps.push(`context:isolated_topology_node:${sku}`);
      }
    }
  }

  const actionKinds = new Set(actions.map((a) => a.kind));
  const actionCount = actions.length;
  const actionTypeCount = actionKinds.size;

  let singleActionPenalty = 0;
  if (actionCount === 1) {
    singleActionPenalty = 12;
    evalSteps.push("planner:single_action_penalty");
  }

  let diversityBonus = 0;
  if (actionTypeCount >= 2) {
    diversityBonus = 10;
    evalSteps.push(`planner:diversity_bonus=${actionTypeCount}`);
  }

  let assumedSupplyPenalty = 0;
  for (const a of actions) {
    const reason = String((a as any).reason ?? "");
    if (reason.includes("assumed_supply") || reason.includes("isolated_topology")) {
      assumedSupplyPenalty += 4;
    }
  }

  if (assumedSupplyPenalty > 0) {
    evalSteps.push(`planner:assumed_supply_penalty=${round3(assumedSupplyPenalty)}`);
  }

  const confidenceBonus = topologyMissing
    ? 0
    : isolatedSkuCount === 0
      ? 1.0
      : 0;

  if (confidenceBonus > 0) {
    evalSteps.push(`planner:confidence_bonus=${round3(confidenceBonus)}`);
  }

  return {
    contextPenalty: round3(penalty),
    singleActionPenalty: round3(singleActionPenalty),
    diversityBonus: round3(diversityBonus),
    assumedSupplyPenalty: round3(assumedSupplyPenalty),
    confidenceBonus: round3(confidenceBonus),
  };
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

function buildBaseSupply(
  inventory: any[],
  evalSteps: string[]
): SupplyModel {
  const supplyBySku = new Map<string, number>();

  for (const it of inventory ?? []) {
    const sku = String(it?.sku ?? it?.item ?? it?.code ?? "").trim();
    if (!sku) continue;

    const qty = Number(it?.qty ?? it?.onHand ?? it?.on_hand ?? it?.quantity ?? 0);
    add(supplyBySku, sku, qty);
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
// Allocation mapping helpers
// ------------------------------------------------------

function normalizeOrdersForAllocation(orders: any[]): Array<{
  orderId: string;
  sku: string;
  qty: number;
  dueDate?: string;
  priority?: number;
}> {
  return (orders ?? [])
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
        dueDate: dueDate || undefined,
      };
    })
    .filter((o) => o.sku && Number.isFinite(o.qty) && o.qty > 0);
}

function mapSupplyModelToInventory(model: SupplyModel): Array<{
  sku: string;
  qty: number;
}> {
  return Array.from(model.supplyBySku.entries()).map(([sku, qty]) => ({
    sku,
    qty,
  }));
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