// core/src/execution/action.builder.v2.ts
// ======================================================
// PlannerAgent — Action Builder V2
// Canonical Source of Truth
//
// Purpose
// Build deterministic candidate actions from operational reality
// before optimizer scoring.
//
// Rules
// - No LLM
// - No execution
// - Uses shortage, topology, movements, confidence
// - Produces only action kinds supported by action.router.ts
// ======================================================

import type { Action, OptimizerInput } from "../decision/optimizer/contracts";

// ======================================================
// TYPES
// ======================================================

type ShortageRow = {
  sku: string;
  demand: number;
  supply: number;
  shortage: number;
};

type TopologyInfo = {
  degree: number;
  exists: boolean;
};

type LeadTimeInfo = {
  days: number;
  known: boolean;
};

// ======================================================
// ENTRY
// ======================================================

export function buildActionsFromRealityV2(
  input: OptimizerInput
): Action[] {
  const shortages = computeShortages(input);
  const actions: Action[] = [];

  const maxExpeditePct = clamp01(input.constraints_hint?.maxExpeditePercent ?? 1);
  const allowEarlyRelease = input.constraints_hint?.allowEarlyRelease ?? true;

  const behavior = input.behaviorProfile;

  for (const row of shortages) {
    if (row.shortage <= 0) continue;

    const topology = getTopologyInfo(input, row.sku);
    const leadTime = getLeadTimeInfo(input, row.sku);
    const confidence = getRealityConfidence(input, row.sku);

    const expediteQty = Math.max(
      1,
      Math.ceil(row.shortage * expediteRatio({
        topology,
        leadTime,
        confidence,
        maxExpeditePct
      }))
    );

 // --------------------------------------------------
// 🔥 BEHAVIOR-DRIVEN GENERATION (QTY + TIMING)
// --------------------------------------------------

const riskProfile = behavior?.preferences?.riskProfile ?? "BALANCED";
const avoidSystemic = behavior?.preferences?.avoidSystemicActions === true;
const preferSingle = behavior?.preferences?.preferSingleAction === true;

// --------------------------------------------------
// 🎯 QTY MODIFIER (quanto spingo)
// --------------------------------------------------

const qtyMultiplier =
  riskProfile === "AGGRESSIVE"
    ? 1.2
    : riskProfile === "CONSERVATIVE"
    ? 0.7
    : 1.0;

const adjustedExpediteQty = Math.max(
  1,
  Math.ceil(expediteQty * qtyMultiplier)
);

// --------------------------------------------------
// ⏱️ TIMING MODIFIER (quanto anticipo)
// --------------------------------------------------

const expediteDays =
  riskProfile === "AGGRESSIVE"
    ? 0
    : riskProfile === "CONSERVATIVE"
    ? Math.max(1, Math.ceil(leadTime.days * 0.3))
    : 0;

// 👉 SEMPRE possibile
const expediteAction = {
  kind: "EXPEDITE_SUPPLIER" as const,
  sku: row.sku,
  qty: adjustedExpediteQty,
  availableInDays: expediteDays,
  costFactor: expediteCostFactor(leadTime.days, topology.degree, confidence),
  reason: buildExpediteReason(topology, leadTime, confidence)
};

// --------------------------------------------------
// 🧠 ACTION STRATEGY
// --------------------------------------------------

if (riskProfile === "CONSERVATIVE") {
  // 👉 UNA SOLA AZIONE, più prudente
  actions.push(expediteAction);

} else if (riskProfile === "AGGRESSIVE") {
  // 👉 MULTI ACTION SPINTA + OVER-COVER

  actions.push(expediteAction);

  if (topology.exists || allowEarlyRelease) {

    const adjustQty = Math.max(
      1,
      Math.ceil((row.shortage - adjustedExpediteQty) * 1.2) // 🔥 over-production
    );

    if (adjustQty > 0) {
      actions.push({
        kind: "SHORT_TERM_PRODUCTION_ADJUST",
        sku: row.sku,
        qty: adjustQty,
        availableInDays: Math.max(
          0,
          productionAvailabilityDays(leadTime.days, confidence) - 1 // 🔥 anticipo
        ),
        costFactor: productionCostFactor(confidence) * 1.1, // 🔥 paga di più
        reason: buildProductionReason(topology, leadTime, confidence)
      });
    }
  }

} else {
  // 👉 BALANCED (adattivo)

  actions.push(expediteAction);

  if ((topology.exists && !avoidSystemic && !preferSingle) || allowEarlyRelease) {

    const adjustQty = Math.max(
      1,
      Math.ceil(row.shortage - adjustedExpediteQty)
    );

    if (adjustQty > 0) {
      actions.push({
        kind: "SHORT_TERM_PRODUCTION_ADJUST",
        sku: row.sku,
        qty: adjustQty,
        availableInDays: productionAvailabilityDays(leadTime.days, confidence),
        costFactor: productionCostFactor(confidence),
        reason: buildProductionReason(topology, leadTime, confidence)
      });
    }
  }
}
  }

  return dedupeActions(actions);


// ======================================================
// SHORTAGE
// ======================================================

function computeShortages(input: OptimizerInput): ShortageRow[] {
  const demand = new Map<string, number>();
  const supply = new Map<string, number>();

  for (const o of input.orders ?? []) {
    const sku = normalizeSku(o?.sku ?? o?.item ?? o?.code);
    const qty = num(o?.qty ?? o?.quantity);
    if (!sku || qty <= 0) continue;
    demand.set(sku, (demand.get(sku) ?? 0) + qty);
  }

  for (const i of input.inventory ?? []) {
    const sku = normalizeSku(i?.sku ?? i?.item ?? i?.code);
    const qty = num(i?.qty ?? i?.onHand ?? i?.on_hand ?? i?.quantity);
    if (!sku || qty === 0) continue;
    supply.set(sku, (supply.get(sku) ?? 0) + qty);
  }

  for (const m of input.movements ?? []) {
    const sku = normalizeSku(m?.sku ?? m?.item ?? m?.code);
    const qty = movementQty(m);
    if (!sku || qty === 0) continue;
    supply.set(sku, (supply.get(sku) ?? 0) + qty);
  }

  const out: ShortageRow[] = [];

  for (const [sku, d] of demand.entries()) {
    const s = supply.get(sku) ?? 0;
    const shortage = Math.max(0, d - s);

    out.push({
      sku,
      demand: d,
      supply: s,
      shortage
    });
  }

  return out.sort((a, b) => b.shortage - a.shortage);
}

// ======================================================
// TOPOLOGY / CONFIDENCE / LEAD TIME
// ======================================================

function getTopologyInfo(input: OptimizerInput, sku: string): TopologyInfo {
  const topology = input.operationalTopology;
  if (!topology?.nodes?.length) {
    return { degree: 0, exists: false };
  }

  let degree = 0;
  let exists = false;

  for (const n of topology.nodes) {
    if (String(n.id) === sku) {
      exists = true;
      break;
    }
  }

  for (const e of topology.edges ?? []) {
    if (String(e.from) === sku || String(e.to) === sku) {
      degree++;
    }
  }

  return { degree, exists };
}

function getLeadTimeInfo(input: OptimizerInput, sku: string): LeadTimeInfo {
  for (const m of input.movements ?? []) {
    const rowSku = normalizeSku(m?.sku ?? m?.item ?? m?.code);
    if (rowSku !== sku) continue;

    const lt = num(m?.lead_time ?? m?.leadTime ?? m?.supplier_lead_time_days);
    if (lt > 0) {
      return { days: lt, known: true };
    }
  }

  return { days: 7, known: false };
}

function getRealityConfidence(input: OptimizerInput, _sku: string): number {
  const c = input.realitySnapshot?.confidence;
  if (!c) return 0.5;

  const vals = [num(c.stock), num(c.demand), num(c.lead_time), num(c.bom)]
    .filter((x) => x > 0);

  if (!vals.length) return 0.5;

  return clamp01(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ======================================================
// ACTION HEURISTICS
// ======================================================

function expediteRatio(params: {
  topology: TopologyInfo;
  leadTime: LeadTimeInfo;
  confidence: number;
  maxExpeditePct: number;
}): number {
  let ratio =
  behavior?.preferences?.riskProfile === "AGGRESSIVE"
    ? 0.85
    : behavior?.preferences?.riskProfile === "CONSERVATIVE"
    ? 0.5
    : 0.7;

  if (!params.topology.exists) ratio += 0.1;
  if (params.topology.degree === 0) ratio += 0.1;
  if (params.leadTime.days > 10) ratio += 0.05;
  if (params.confidence < 0.5) ratio -= 0.15;

  ratio = Math.min(ratio, params.maxExpeditePct);
  ratio = Math.max(0.2, ratio);

  return ratio;
}

function expediteCostFactor(
  leadDays: number,
  degree: number,
  confidence: number
): number {
  let out = 1.3;

  if (leadDays > 10) out += 0.2;
  if (degree === 0) out += 0.1;
  if (confidence < 0.5) out += 0.05;

  return round2(out);
}

function productionAvailabilityDays(
  leadDays: number,
  confidence: number
): number {
  let days = leadDays > 10 ? 3 : 1;
  if (confidence < 0.5) days += 1;
  return Math.max(0, days);
}

function productionCostFactor(confidence: number): number {
  return round2(confidence < 0.5 ? 1.3 : 1.2);
}

function buildExpediteReason(
  topology: TopologyInfo,
  leadTime: LeadTimeInfo,
  confidence: number
): string {
  if (!topology.exists) return "builder_v2_expedite_assumed_supply";
  if (topology.degree === 0) return "builder_v2_expedite_isolated_topology";
  if (!leadTime.known) return "builder_v2_expedite_unknown_leadtime";
  if (confidence < 0.5) return "builder_v2_expedite_low_confidence";
  return "builder_v2_expedite_topology_guided";
}

function buildProductionReason(
  topology: TopologyInfo,
  leadTime: LeadTimeInfo,
  confidence: number
): string {
  if (!topology.exists) return "builder_v2_prod_adjust_assumed";
  if (leadTime.days > 10) return "builder_v2_prod_adjust_long_leadtime";
  if (confidence < 0.5) return "builder_v2_prod_adjust_low_confidence";
  return "builder_v2_prod_adjust_topology_guided";
}

// ======================================================
// HELPERS
// ======================================================

function movementQty(m: any): number {
  const rawQty = num(m?.qty ?? m?.quantity);
  const type = String(m?.type ?? m?.direction ?? "").toUpperCase();

  if (type === "OUT" || type === "ISSUE") return -Math.abs(rawQty);
  return rawQty;
}

function normalizeSku(v: unknown): string {
  return String(v ?? "").trim();
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function dedupeActions(actions: Action[]): Action[] {
  const seen = new Set<string>();
  const out: Action[] = [];

  for (const a of actions) {
    const key = JSON.stringify(a);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }

  return out;
}
}