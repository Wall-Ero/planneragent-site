// core/src/sandbox/orchestrator.v2.ts
// ======================================================
// PlannerAgent — Sandbox Orchestrator V2
// Canonical Source of Truth
// CLEAN + STABLE + TOPOLOGY + CORRECTION EFFECT + AUTO-HEAL GOVERNANCE
// + IMPROVE INTENT (PRINCIPAL)
// + CAPABILITY PLAYER BRIDGE (capability-first, runtime-fallback)
// ======================================================

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  GovernanceResult,
  PlanTier,
  DatasetDescriptor,
} from "./contracts.v2";

import { authoritySandboxGuard } from "./authority/authoritySandbox.guard";
import { computeDlEvidenceV2 } from "./dl.v2";
import { buildUiSignalsV1 } from "./signal.engine.v1";

import { buildReality } from "../reality/reality.builder";
import { buildOperationalTopology } from "../topology/topology.builder.v2";

import { runOptimizerV1 } from "../decision/optimizer";

import { explainDecision } from "../decision/explainer/decision.explainer.v1";
import { applyPolicy } from "../decision/policy/policy.engine.v1";
import { resolvePolicy } from "../decision/policy/policy.resolver.v1";
import { applyPolicyConstraints } from "../decision/policy/policy.enforcer.v1";

import { buildActionsFromRealityV2 } from "../execution/action.builder.v2";
import { mapActionToExecutionIntent } from "../execution/execution.bridge.v1";
import { executeRuntimeV1 } from "../executor/executor.runtime.v1";

// 🔥 NEW — capability player bridge

import { executeCapability } from "../execution/execution.orchestrator";

import {
  getDecisionHistory,
  recordDecision,
} from "../decision-memory/decision.memory";

import { validateDecisionOutcome } from "../decision/decision.outcome.validator";
import { detectDecisionAnomalyV2 } from "../decision/decision.anomaly.guard.v2";

import { normalizeOrders } from "../../datasets/dlci/adapters";

import {
  enrichAnomalyActions,
  type EnrichedAction,
} from "../decision/anomaly.action.enricher";

import {
  mergeInventoryWithReconstruction,
} from "../reconstruction/inventory.reconstruction";

import { normalizeInventory } from "../normalization/inventory.normalizer";
import {
  normalizeMovements,
} from "../normalization/movements.normalizer";

import {
  reconcileInventory,
  type InventoryReconciliationResult,
} from "../reality/inventory.reconciliation";

import { detectInventoryAnomalies } from "../reality/anomaly.detector";
import { generateCorrectionActions } from "../execution/correction.engine";
import { adaptInventoryReconciliation } from "../reality/reconciliation.adapter";

import { computeExpectedConsumption } from "../decision/expected/expected.consumption.engine";
import { computeExecutionGap } from "../decision/expected/execution.gap.engine";

import { simulateCorrectionsOnInventory } from "../simulation/correction.simulator.v1";

import type { CapabilityLevel } from "../execution/capability.types";
import type { ResolutionContext } from "../execution/resolveCapability.final";
import { resolveCapabilityFinal } from "../execution/resolveCapability.final";

import { resolveBehaviorProfile } from "../decision/decision.behavior";

import {resolveManagerBehavior} from "../decision/manager.behavior";

import {overlayPolicyWithManagerBehavior} from "../decision/policy/policy.overlay.v1";

import { mergeBehaviorProfiles } from "../decision/decision.behavior.merge";

import type { SignedSnapshotV1 } from "./contracts.v2";

import { buildTopologyLayers } from "../topology/topology.layers.builder";
import { compareTopologyLayers } from "../topology/topology.compare";

import { computePlanCoherence } from "../topology/plan.coherence";

import { computeDecisionPressureV2 } from "../decision/decision.pressure.v2";

import { computePlanQuality } from "../topology/plan.quality";

import type { ExpectedConsumption } from "../decision/expected/expected.consumption.engine";

import { autoHealTopologyInput } from "../topology/topology.autoheal";

import { learnCapability } from "../execution/capability.memory";

import { flattenRealityBomForTopology } from "../reality/reality.builder";

import { buildOrdDecisionTrace } from "../decision/ord/ord.trace";
import { buildDecisionTraceFromOrd } from "../decision/decision.trace.builder";

import { replayDecision } from "../decision/decision.replay.engine";

import { D1DecisionStoreAdapter } from "../decision-memory/decision.store";
import { buildDecisionMemorySnapshotV1 } from "../decision-memory/snapshot/snapshot.builder";

import type { Env } from "../types/env";

import {
  appendMemoryRecord
} from "../memory/memory.write";

import {
  createRuntimeIntelligenceCollector
} from "../memory/intelligence.runtime.collector";

import {
  buildPlannerNarrativeState
} from "./narrative/plannerNarrative";

import {
  deriveRealityState,
} from "../reality/reality.state";

import {
  buildPlannerCognition,
} from "../cognition/planner.cognition";

import {
  renderPlannerNarrative,
} from "../sandbox/narrative/planner.narrative.render";

import {
  applyPlannerNarrativePolicy,
} from "../sandbox/narrative/planner.narrative.policy";

import {
  buildPlannerNarrativeUiState,
} from "../sandbox/narrative/planner.narrative.ui";

import {
  buildGovernanceEmergence,
} from "../governance/emergence/governance.emergence.adapter";

import {
  buildRuntimeCognition
} from "../cognition/runtime/runtime.cognition.integrator";

import type {
  CognitiveExperienceRecord
} from "../cognition/synthesis/cognition.experience.timeline";




// ======================================================
// TYPES / CONSTANTS
// ======================================================

type CorrectionEffect = "FULL" | "PARTIAL" | "NONE";

type ProblemType = "PLAN" | "REALITY" | "NONE";

type CapabilityExecutionRecord = {
  action_index: number;
  action_type: string;
  capability_id?: string;
  status:
    | "EXECUTED"
    | "PENDING_APPROVAL"
    | "SKIPPED"
    | "FALLBACK_TO_RUNTIME"
    | "FAILED";
  provider?: string;
  result?: unknown;
  error?: string;
};

type ExecutionOutcome =
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "BLOCKED";

const CRITICAL_ANOMALIES = [
  "LOW_TOPOLOGY_CONFIDENCE",
] as const;

// ======================================================
// HELPERS
// ======================================================

function executionAllowedByPlan(plan: PlanTier, intent: string): boolean {
  if (intent !== "EXECUTE") return false;
  return plan === "JUNIOR" || plan === "SENIOR" || plan === "PRINCIPAL";
}

function isImprove(intent: string): boolean {
  return intent === "IMPROVE";
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeDatasetDescriptor(input: unknown): DatasetDescriptor {
  if (
    input &&
    typeof input === "object" &&
    "hasSnapshot" in input &&
    "hasBehavioralEvents" in input &&
    "hasStructuralData" in input
  ) {
    return input as DatasetDescriptor;
  }

  return {
    hasSnapshot: true,
    hasBehavioralEvents: false,
    hasStructuralData: false,
  };
}

function buildTopologyEvidenceFromTopology(topology: {
  nodes: Array<{ id: string }>;
  edges: Array<{ from: string; to: string }>;
}) {
  const connectedNodeIds = new Set<string>();

  for (const edge of topology.edges ?? []) {
    if (edge.from) connectedNodeIds.add(edge.from);
    if (edge.to) connectedNodeIds.add(edge.to);
  }

  const isolatedNodes = (topology.nodes ?? [])
    .filter((node) => !connectedNodeIds.has(node.id))
    .map((node) => node.id);

  const nodesCount = topology.nodes?.length ?? 0;
  const edgesCount = topology.edges?.length ?? 0;

  const topologyConfidence =
    nodesCount === 0
      ? 0
      : Math.max(0, Math.min(1, (edgesCount + 1) / (nodesCount + 1)));

  return {
    nodes: nodesCount,
    edges: edgesCount,
    isolatedNodes,
    topologyConfidence,
    signals: [
      `topology_nodes=${nodesCount}`,
      `topology_edges=${edgesCount}`,
      `topology_isolated=${isolatedNodes.length}`,
      `topology_confidence=${topologyConfidence.toFixed(3)}`,
    ],
  };
}

function deriveCorrectionEffect(
  pre: InventoryReconciliationResult,
  post: InventoryReconciliationResult
): CorrectionEffect {
  if (post.majorMismatchCount === 0) return "FULL";

  if (post.totalAbsoluteDelta < pre.totalAbsoluteDelta) {
    return "PARTIAL";
  }

  return "NONE";
}



// --------------------------------------------------
// EXECUTION TYPE (CANONICAL)
// --------------------------------------------------

type ExecutionType =
  | "DATA_REPAIR"
  | "PLAN_REPAIR"
  | "OPERATIONAL_EXECUTION";

function mapExecutionType(action: string): ExecutionType {

  // -------------------------
  // DATA REPAIR
  // -------------------------
 if (
  action === "POST_PRODUCTION_RECEIPT" ||
  action === "POST_COMPONENT_CONSUMPTION" ||
  action === "INVESTIGATE_MISSING_CONSUMPTION" ||
  action === "VERIFY_COMPONENT_CONSUMPTION" ||
  action === "RESTORE_MOVEMENT_CHAIN"
) return "DATA_REPAIR";

  // -------------------------
  // PLAN REPAIR
  // -------------------------
  if (
    action === "REBUILD_PLAN_STRUCTURE" ||
    action === "REBUILD_BOM_GRAPH" ||
    action === "DEFINE_PLAN_STRUCTURE" ||
    action === "ALIGN_BOM_AND_ORDERS"
  ) return "PLAN_REPAIR";

  // -------------------------
  // DEFAULT
  // -------------------------
  return "OPERATIONAL_EXECUTION";
}


// ======================================================
// PROBLEM CLASSIFIER v1 — FINAL (Hybrid Plan + Reality)
// ======================================================

type PlanState = "VALID" | "MISSING" | "BROKEN";

function classifyProblemType(params: {
  planCoherence: { coherent: boolean; score: number; metrics?: any };
  topologyConfidence: number;
  topologyComparison: {
    alignmentScore: number;
    bomDrift: boolean;
    orderBomDrift: boolean;
  };
  inventoryReconciliation?: {
    hasBlockingMismatch?: boolean;
  } | null;
  correctionEffect: "FULL" | "PARTIAL" | "NONE";
  realityScore?: number | null;
  movementsCount: number;
  movementQualityScore: number;
}): {
  problemType: ProblemType;
  planState: PlanState;
} {

  const {
    planCoherence,
    topologyConfidence,
    topologyComparison,
    inventoryReconciliation,
    correctionEffect,
    realityScore,
    movementsCount,
    movementQualityScore,
  } = params;

  const metrics = (planCoherence as any)?.metrics ?? {};

  const planExists =
  (metrics.orderCount ?? 0) > 0 &&
  (
    (metrics.bomEdges ?? 0) > 0 ||
    (metrics.orderEdges ?? 0) > 0
  );

  // -------------------------
  // PLAN STATE
  // -------------------------
  const planState: PlanState =
  !planExists
    ? "MISSING"
    : !planCoherence.coherent
    ? "BROKEN"
    : "VALID";

  // -------------------------
  // REALITY
  // -------------------------
  
  const strongReality =
  movementsCount > 0 &&
  movementQualityScore > 0.6 &&
  topologyConfidence > 0.7 &&
  typeof realityScore === "number" &&
  realityScore > 0.7;

  const severeMisalignment =
    topologyComparison.alignmentScore < 0.5 ||
    topologyComparison.bomDrift ||
    topologyComparison.orderBomDrift;

  const hasBlockingMismatch =
    inventoryReconciliation?.hasBlockingMismatch === true;


  // -------------------------
  // CLASSIFICATION
  // -------------------------

  // 🔴 PLAN BROKEN → sempre PLAN
  if (planState === "BROKEN") {
    return { problemType: "PLAN", planState };
  }

  // 🟠 PLAN MISSING
  if (planState === "MISSING") {
    if (strongReality) {
      return { problemType: "REALITY", planState };
    }
    return { problemType: "PLAN", planState };
  }

  // 🟢 PLAN VALID

  if (severeMisalignment) {
    if (strongReality) {
      return { problemType: "REALITY", planState };
    }
    return { problemType: "PLAN", planState };
  }

 if (hasBlockingMismatch) {
  return { problemType: "REALITY", planState };
}

return { problemType: "NONE", planState };
}


function dedupeRequiredActions(actions: EnrichedAction[]): EnrichedAction[] {
  const map = new Map<string, EnrichedAction>();

  for (const action of actions ?? []) {
    const key = `${action.action}__${action.priority}__${action.blocking}`;

    if (!map.has(key)) {
      map.set(key, action);
      continue;
    }

    const existing = map.get(key)!;
    map.set(key, {
      ...existing,
      blocking: existing.blocking || action.blocking,
      priority:
        existing.priority === "HIGH" || action.priority === "HIGH"
          ? "HIGH"
          : existing.priority === "MEDIUM" || action.priority === "MEDIUM"
          ? "MEDIUM"
          : "LOW",
    });
  }

  return Array.from(map.values());
}

function hasCriticalAnomaly(anomalyReasons: string[]): boolean {
  return (
    Array.isArray(anomalyReasons) &&
    anomalyReasons.some((r) => CRITICAL_ANOMALIES.includes(r as any))
  );
}

function hasRuntimeExecutablePlanActions(selectedBest: any): boolean {
  return Array.isArray(selectedBest?.actions) && selectedBest.actions.length > 0;
}

function normalizeGovernanceReason(
  executionAllowed: boolean,
  req: SandboxEvaluateRequestV2
): string {
  if (isImprove(req.intent)) {
    if (req.plan !== "PRINCIPAL") return "PRINCIPAL_REQUIRED_FOR_IMPROVEMENT";
    return "IMPROVEMENT_AUTHORITY";
  }

  return executionAllowed
    ? "DELEGATED_OR_BUDGETED_AUTHORITY"
    : "ADVISORY_ONLY";
}

function safeActionType(action: any): string {
  return String(
    action?.type ??
    action?.action ??
    action?.kind ??
    "UNKNOWN_ACTION"
  );
}

function normalizeActionType(action: any): string {
  return safeActionType(action)
    .trim()
    .toUpperCase();
}

function buildPlanRepairStrategies(params: {
  topologyConfidence: number;
  executionGap: any[];
  topologyLayers: any;
}) {
  const { topologyConfidence, executionGap, topologyLayers } = params;

  const strategies: { type: string }[] = [];

  if (topologyConfidence < 0.6) {
    strategies.push({ type: "REBUILD_BOM_GRAPH" });
  }

  if (executionGap.some((g: any) => g.type !== "OK")) {
    strategies.push({ type: "RESTORE_MOVEMENT_CHAIN" });
  }

  if ((topologyLayers?.fromOrders?.edges?.length ?? 0) === 0) {
    strategies.push({ type: "RECONSTRUCT_ORDER_FLOW" });
  }

  strategies.push({ type: "REBUILD_PLAN_STRUCTURE" });

  return strategies;
}

function applyMemoryBias(
  actions: any[],
  memory: { action: string }[]
): any[] {
  return [...actions].sort((a: any, b: any) => {
    const aHit = memory.some((m) => m.action === a.action);
    const bHit = memory.some((m) => m.action === b.action);

    if (aHit && !bHit) return -1;
    if (!aHit && bHit) return 1;
    return 0;
  });
}

// ======================================================
// MAIN
// ======================================================

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2,
  env?: Env
): Promise<SandboxEvaluateResponseV2> {

  try {

    if (!env?.POLICIES_DB) {
  return {
    ok: false,
    error: "DB_NOT_CONFIGURED",
    request_id: req.request_id ?? "unknown"
  };
}

const store = new D1DecisionStoreAdapter(env.POLICIES_DB);

const intelligenceCollector =
  createRuntimeIntelligenceCollector();

  // ----------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------

  if (!req.request_id || !req.company_id) {
    return {
      ok: false,
      request_id: req.request_id ?? "unknown",
      reason: "MISSING_FIELDS",
    } as any;
  }

  if (!(req as any).baseline_snapshot_id) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "MISSING_SNAPSHOT_ID",
    } as any;
  }

  if (!req.snapshot) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "SNAPSHOT_REQUIRED",
    } as any;
  }

  const snapshot = req.snapshot as SignedSnapshotV1;
  const auth = authoritySandboxGuard(snapshot);
  if (!auth.ok) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: auth.reason,
    } as any;
  }

  // ----------------------------------------------------
// MOVEMENT QUALITY ENGINE (CANONICAL)
// ----------------------------------------------------

type MovementQuality = {
  total: number;
  valid: number;
  nonZero: number;
  knownType: number;
  qualityScore: number;   // 0 → 1
};

function computeMovementQuality(
  movements: {
    sku?: string;
    qty?: number;
    event?: string;
  }[]
): MovementQuality {

  const total = movements.length;

  if (total === 0) {
    return {
      total: 0,
      valid: 0,
      nonZero: 0,
      knownType: 0,
      qualityScore: 0,
    };
  }

  let valid = 0;
  let nonZero = 0;
  let knownType = 0;

  for (const m of movements) {

    const hasSku =
      typeof m.sku === "string" && m.sku.length > 0;

    const hasQty =
      Number.isFinite(m.qty);

    const isNonZero =
      Number.isFinite(m.qty) && m.qty !== 0;

    const isKnown =
      m.event && m.event !== "UNKNOWN";

    if (hasSku && hasQty) valid++;
    if (isNonZero) nonZero++;
    if (isKnown) knownType++;
  }

  const qualityScore =
    (valid / total) * 0.4 +
    (nonZero / total) * 0.3 +
    (knownType / total) * 0.3;

  return {
    total,
    valid,
    nonZero,
    knownType,
    qualityScore: Number(qualityScore.toFixed(3)),
  };
}
 
// ----------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------

const orders = normalizeOrders(req.orders ?? []);
const movements = normalizeMovements(req.movements ?? []);

// ----------------------------------------------------
// MOVEMENT QUALITY (CANONICAL)
// ----------------------------------------------------

const totalMovements = movements.length;

const validMovements = movements.filter(
  (m) =>
    typeof m.sku === "string" &&
    m.sku.length > 0 &&
    Number.isFinite(m.qty) &&
    m.qty !== 0 &&
    m.event !== "UNKNOWN"
);

const validRatio =
  totalMovements > 0
    ? validMovements.length / totalMovements
    : 0;

const hasProduction = validMovements.some(
  (m) => m.event === "PRODUCTION_LOAD"
);

const hasConsumption = validMovements.some(
  (m) => m.event === "COMPONENT_CONSUMPTION"
);

const flowConsistency =
  hasProduction && hasConsumption ? 1 : 0.5;

const movementQuality = {
  qualityScore: Number(
    (validRatio * 0.7 + flowConsistency * 0.3).toFixed(3)
  ),
  validRatio,
  flowConsistency,
  total: totalMovements,
  valid: validMovements.length,
};

// 👉 QUESTO è il tuo strict reale
const strictMovements = validMovements;

const normalizedInventory = normalizeInventory(req.inventory ?? []);

  // ----------------------------------------------------
  // INVENTORY RECONSTRUCTION
  // ----------------------------------------------------

  const inventory = mergeInventoryWithReconstruction(
    normalizedInventory,
    movements
  );

  console.log("ORCH_INVENTORY_NORMALIZED", normalizedInventory);
  console.log("ORCH_INVENTORY_EFFECTIVE", inventory);
  console.log("ORCH_MOVEMENTS", movements);

  // ----------------------------------------------------
  // RECONCILIATION
  // ----------------------------------------------------

  const inventoryReconciliation = reconcileInventory(
    normalizedInventory,
    inventory
  );

  const hasBlockingMismatch =
    inventoryReconciliation?.hasBlockingMismatch === true;

  console.log("ORCH_INVENTORY_RECONCILIATION", inventoryReconciliation);

  const anomalyDiagnosis = detectInventoryAnomalies(
  inventoryReconciliation.rows,
  strictMovements
);

  console.log("ORCH_INVENTORY_ANOMALY_DIAGNOSIS", anomalyDiagnosis);

  const adaptedReconciliation = adaptInventoryReconciliation(
    inventoryReconciliation
  );

  // ----------------------------------------------------
  // REALITY
  // ----------------------------------------------------

  const reality = buildReality({
    orders,
    inventory,
    movements,
    movord: (req.movord ?? []) as any[],
    movmag: (req.movmag ?? []) as any[],
    masterBom: (req.masterBom ?? []) as any[],
  });

  const realityBom =
  (reality as any)?.reconstructed?.reality_bom ?? [];

const inferredBomFromReality =
  flattenRealityBomForTopology(realityBom);

 const rawBom =
  (reality as any)?.reconstructed?.plan_bom?.length
    ? (reality as any).reconstructed.plan_bom
    : (req.masterBom ?? []);

const inferredBom = (rawBom ?? []).flatMap((b: any) => {
  if (Array.isArray(b.components)) {
    return b.components.map((c: any) => ({
      parentSku: b.parent,
      componentSku: c.component,
      qtyPer: c.ratio ?? c.qty ?? 1,
    }));
  }

  return [{
    parentSku: b.parentSku ?? b.parent,
    componentSku: b.componentSku ?? b.component,
    qtyPer: b.qtyPer ?? b.ratio ?? b.qty ?? 1,
  }];
}).filter((b: any) => b.parentSku && b.componentSku);

const inferredBomQuality =
  (reality as any)?.reconstructed?.plan_bom_quality ?? null;
  // ----------------------------------------------------
  // EXPECTED CONSUMPTION
  // ----------------------------------------------------

  let expectedConsumption = computeExpectedConsumption(
  orders,
  inferredBom
);

// 🔥 FIX: garantisci expected minimo
if (!expectedConsumption || expectedConsumption.length === 0) {
 expectedConsumption = (orders ?? [])
  .map((o: any): ExpectedConsumption => ({
    sku: String(o.sku ?? "").trim(),
    expectedQty: Number(o.qty ?? 0),
    source: "ORDER_BOM" as const, // 🔥 FIX TYPESCRIPT
  }))
    .filter((x) => x.sku && x.expectedQty > 0);

  console.log("EXPECTED_FALLBACK_FROM_ORDERS", expectedConsumption);
}

console.log("EXPECTED_CONSUMPTION_FINAL", expectedConsumption);

  // ----------------------------------------------------
  // EXECUTION GAP
  // ----------------------------------------------------

const executionGap = computeExecutionGap(
  expectedConsumption,
  strictMovements
);

  console.log("EXECUTION_GAP", executionGap);

  // ----------------------------------------------------
  // CORRECTION ENGINE
  // ----------------------------------------------------

  const correction = generateCorrectionActions(
    adaptedReconciliation,
    anomalyDiagnosis,
    executionGap
  );

  console.log("ORCH_CORRECTION_ACTIONS", correction);

  // ----------------------------------------------------
// CORRECTION SIMULATION
// ----------------------------------------------------

const preCorrectionReconciliation = inventoryReconciliation;

// Canonical rule:
// correction actions simulate ERP alignment,
// not another movement reconstruction.
const postCorrectionReconciliation: InventoryReconciliationResult = {
  rows: inventoryReconciliation.rows.map((r: any) => ({
    ...r,
    erpQty: r.reconstructedQty,
    delta: 0,
    absDelta: 0,
    status: "MATCH",
  })),
  mismatchCount: 0,
  majorMismatchCount: 0,
  totalAbsoluteDelta: 0,
  hasBlockingMismatch: false,
};

console.log(
  "POST_CORRECTION_RECONCILIATION",
  postCorrectionReconciliation
);

const correctionEffect = deriveCorrectionEffect(
  preCorrectionReconciliation,
  postCorrectionReconciliation
);

console.log("CORRECTION_EFFECTIVENESS", {
  effect: correctionEffect,
});

  const realityScore: number | null =
    typeof (reality as any)?.reality_score === "number"
      ? (reality as any).reality_score
      : null;

  // ----------------------------------------------------
  // DL
  // ----------------------------------------------------

  const dlResult = await computeDlEvidenceV2(
    { DL_ENABLED: env?.DL_ENABLED ?? "true" },
    {
      horizonDays: 30,
      baselineMetrics: req.baseline_metrics ?? {},
      orders,
      inventory,
      movements,
    }
  );

  if (dlResult.health !== "ok" || !dlResult.evidence) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "DL_FAILED",
    } as any;
  }

  const dl = dlResult.evidence;

  // =====================================================
// 🔥 TOPOLOGY NORMALIZATION (REQUIRED FOR V2)
// =====================================================

// ---------- ORDERS ----------
const topologyOrders = (orders ?? []).map((o: any) => ({
  orderId: String(o.orderId ?? o.id ?? "").trim(),
  sku: String(o.sku ?? o.item ?? "").trim(),
  commessa: String(o.commessa ?? "").trim(),
})).filter((o: any) => o.orderId || o.sku);


// ---------- INVENTORY ----------
const topologyInventory = (inventory ?? []).map((i: any) => ({
  sku: String(i.sku ?? i.item ?? "").trim(),
  qty: Number(i.qty ?? i.quantity ?? 0),
  warehouse: String(i.warehouse ?? "").trim(),
})).filter((i: any) => i.sku);


// ---------- MOVEMENTS ----------
const topologyMovements = (movements ?? []).map((m: any) => ({
  sku: String(m.sku ?? m.item ?? "").trim(),

  qty: Number(m.qty ?? m.quantity ?? 0),

  type: String(m.type ?? m.movementType ?? "").trim(),
  event: String(m.event ?? "").trim(),

  orderId: String(m.orderId ?? m.id ?? "").trim(),
  commessa: String(m.commessa ?? "").trim(),

  parentSku: String(
    m.parentSku ?? m.producedSku ?? ""
  ).trim(),

  consumedSku: String(
    m.consumedSku ?? m.component ?? ""
  ).trim(),

  batch: String(m.batch ?? "").trim(),
})).filter((m: any) => m.sku || m.parentSku);


// ---------- BOM ----------
const topologyBom = (inferredBom ?? []).map((b: any) => ({
  parent: String(b.parentSku ?? b.parent ?? "").trim(),
  component: String(b.componentSku ?? b.component ?? "").trim(),
  qty: Number(b.qtyPer ?? b.ratio ?? b.qty ?? 1),
})).filter((b: any) => b.parent && b.component);


// =====================================================
// 🚀 BUILD TOPOLOGY V2
// =====================================================

// =====================================================
// 🔥 AUTO-HEAL TOPOLOGY INPUT
// =====================================================

const healed = autoHealTopologyInput({
  orders: topologyOrders,
  inventory: topologyInventory,
  movements: topologyMovements,
  inferredBom: topologyBom,
});

// 🔥 DATA QUALITY SIGNAL
if (healed.warnings.length > 0) {
  console.log("⚠️ DATA QUALITY ISSUES", {
    count: healed.warnings.length,
    warnings: healed.warnings,
  });
}

console.log("TOPOLOGY_AUTO_HEAL_WARNINGS", healed.warnings);

// =====================================================
// 🚀 BUILD TOPOLOGY (HEALED)
// =====================================================

const topology = buildOperationalTopology({
  orders: healed.orders,
  inventory: healed.inventory,
  movements: healed.movements,
  movmag: (req.movmag ?? []) as any[],
  inferredBom: healed.inferredBom,
});

  const topologyEvidence = buildTopologyEvidenceFromTopology(topology);
  const topologyConfidence = topologyEvidence.topologyConfidence ?? 0.5;

 const topologyLayers = buildTopologyLayers({
  inventory: healed.inventory,
  movements: healed.movements,
  orders: healed.orders,
  inferredBom: healed.inferredBom, // PLAN
  inferredBomFromReality,          // 🔥 REALITY
});

const topologyComparison = compareTopologyLayers(topologyLayers);


// ----------------------------------------------------
// PROBLEM CLASSIFIER (CANONICAL)
// ----------------------------------------------------

const planCoherence = computePlanCoherence({
  orders,
  inferredBom,
  inferredBomQuality,
  topologyLayers,
});

// ----------------------------------------------------
// PROBLEM TYPE (MOVE UP)
// ----------------------------------------------------

const { problemType, planState } = classifyProblemType({
  planCoherence,
  topologyConfidence,
  topologyComparison,
  inventoryReconciliation,
  correctionEffect,
  realityScore,
  movementsCount: strictMovements.length,
  movementQualityScore: movementQuality.qualityScore,
});

const isPlanRepairMode = problemType === "PLAN";

const metrics = (planCoherence as any)?.metrics ?? {};

// ----------------------------------------------------
// PLAN SOURCE (CANONICAL)
// ----------------------------------------------------

let planSource: "MASTER" | "ORDERS_INFERRED" | "REALITY_INFERRED" | "ASSUMED";

const hasMasterBom =
  Array.isArray(req.masterBom) && req.masterBom.length > 0;

const hasOrdersBom =
  Array.isArray(inferredBom) && inferredBom.length > 0;

const hasBehavioralData =
  (req.movord?.length ?? 0) > 0 ||
  (req.movmag?.length ?? 0) > 0 ||
  movements.length > 0;

if (hasMasterBom) {
  planSource = "MASTER";
}
else if (hasOrdersBom) {
  planSource = "ORDERS_INFERRED";
}
else if (hasBehavioralData) {
  planSource = "REALITY_INFERRED";
}
else {
  planSource = "ASSUMED";
}

let planConfidence = planCoherence.score;

// penalità su fonti deboli
if (planSource === "ASSUMED") {
  planConfidence *= 0.5;
}
else if (planSource === "REALITY_INFERRED") {
  planConfidence *= 0.7;
}

const isPlanCoherent = planCoherence.coherent;

let planningMode: string;

if (problemType === "REALITY" && planState === "MISSING") {
  planningMode = "REALITY_EXECUTION";
} else if (problemType === "PLAN") {
  planningMode = "PLAN_REPAIR";
} else {
  planningMode = "REALITY_CORRECTION";
}

console.log("PROBLEM_CLASSIFIER", {
  problemType,
  isPlanCoherent,
  planningMode,
  topologyConfidence,
  alignmentScore: topologyComparison.alignmentScore,
  bomDrift: topologyComparison.bomDrift,
  orderBomDrift: topologyComparison.orderBomDrift,
  hasBlockingMismatch:
    inventoryReconciliation?.hasBlockingMismatch === true,
});

console.log("PLANNING_MODE_SPLIT", {
  problemType,
  isPlanCoherent,
  planningMode,

  topologyConfidence,
  alignmentScore: topologyComparison.alignmentScore,

  bomDrift: topologyComparison.bomDrift,
  orderBomDrift: topologyComparison.orderBomDrift,

  hasBlockingMismatch:
    inventoryReconciliation?.hasBlockingMismatch === true,
});

  // ----------------------------------------------------
  // SIGNALS
  // ----------------------------------------------------

  const datasetDescriptor = normalizeDatasetDescriptor(req.dataset_descriptor);

  const { signals } = buildUiSignalsV1({
    dl,
    dataset_descriptor: datasetDescriptor,
  });


  // ----------------------------------------------------
  // ACTION BUILDER
  // ----------------------------------------------------

  const behaviorProfile = resolveBehaviorProfile({
  company_id: req.company_id
});

  const builtActions = buildActionsFromRealityV2({
  requestId: req.request_id,
  plan: req.plan,
  asOf: nowIso(),
  orders,
  inventory,
  movements,
  baseline_metrics: req.baseline_metrics ?? {},
  dlSignals: dl?.risk_score ?? {},
  inferredBom,
  realitySnapshot: reality,
  operationalTopology: topology,
  topologyConfidence,

  // 🔥 QUI
  behaviorProfile

} as any);

  // ----------------------------------------------------
  // OPTIMIZER
  // ----------------------------------------------------

  let optimizerOutput: any = null;

  if (!hasBlockingMismatch) {
    try {
      optimizerOutput = await runOptimizerV1({
        requestId: req.request_id,
        plan: req.plan,
        asOf: nowIso(),
        orders,
        inventory,
        movements,
        baseline_metrics: req.baseline_metrics ?? {},
        dlSignals: dl.risk_score ?? {},
        inferredBom,
        realitySnapshot: reality,
        operationalTopology: topology,
        topologyConfidence,
        mode: planningMode
      } as any);

      intelligenceCollector.collect({
  provider: "RULE_ENGINE",

  role: "OPTIMIZATION",

  authority_layer: req.plan,

  operational_scope: req.domain,

  company_id: req.company_id,

  context_id: "supply_chain",

  policy_scope: "ADVISORY",

  execution_scope: planningMode,

  execution_contribution: "INDIRECT",

  metadata: {
    source: "optimizer.v1"
  }
});
    } catch {
      optimizerOutput = null;
    }
  } else {
    console.log("OPTIMIZER_SKIPPED_DUE_TO_INVENTORY_MISMATCH");
  }

  if (!optimizerOutput && hasBlockingMismatch) {
    optimizerOutput = {
      best: {
        actions: builtActions,
        score: 0,
      },
      candidates: [],
    };
  }

  if (
    optimizerOutput &&
    (!optimizerOutput.best?.actions ||
      optimizerOutput.best.actions.length === 0)
  ) {
    optimizerOutput.best.actions = builtActions;
  }

// ----------------------------------------------------
// POLICY
// ----------------------------------------------------

let history: any[] = [];

try {
  history = getDecisionHistory();
} catch {
  history = [];
}

const companyPolicy = resolvePolicy({ history });

const managerBehavior = resolveManagerBehavior({
  actor_id: req.actor_id,
  override: req.behavior_override
});

const policy = overlayPolicyWithManagerBehavior({
  basePolicy: companyPolicy,
  managerBehavior,
});

// 🔥 DEBUG LOGS
console.log("BEHAVIOR_OVERRIDE_RAW", req.behavior_override);
console.log("COMPANY_POLICY_USED", companyPolicy);
console.log("MANAGER_BEHAVIOR_USED", managerBehavior);
console.log("EFFECTIVE_POLICY_USED", policy);

// ----------------------------------------------------
// POLICY APPLICATION (CANONICAL FIX)
// ----------------------------------------------------

let selectedBest = optimizerOutput?.best ?? null;

// --------------------------------------------------
// MEMORY BIAS (NEW)
// --------------------------------------------------

let memory: any[] = [];

try {
  memory = getDecisionHistory();
} catch {
  memory = [];
}

if (selectedBest?.actions?.length && memory.length > 0) {
  selectedBest.actions = applyMemoryBias(
    selectedBest.actions,
    memory
  );
}


// ----------------------------------------------------
// DECISION PRESSURE (MOVED UP FOR PLAN QUALITY)
// ----------------------------------------------------

const dp = computeDecisionPressureV2({
  problemType,
  correctionEffect,
  realityScore,

  // 🔥 NUOVI INPUT REALI (FONDAMENTALE)
  shortageUnits: selectedBest?.kpis?.shortageUnits ?? 0,

  demandUnits: (orders ?? []).reduce(
    (sum, o) => sum + Number(o.qty ?? 0),
    0
  ),

  inventoryLevel: (inventory ?? []).reduce(
    (sum, i) => sum + Number(i.qty ?? 0),
    0
  ),

  executionGap,
});


let selectedCandidates = optimizerOutput?.candidates ?? [];

// ======================================================
// 🧠 MEMORY SIGNAL EXTRACTION (CANONICAL)
// ======================================================

function getMemoryScoreForAction(actionType: string): number {
  try {
    const memory = getDecisionHistory?.() ?? [];

    const matches = memory.filter((m: any) =>
      m?.action === actionType && m?.success === true
    );

    if (matches.length === 0) return 0;

    // più successi → più peso (log scale per evitare dominance)
    return Math.min(1, Math.log10(matches.length + 1));
  } catch {
    return 0;
  }
}

// ----------------------------------------------------
// APPLY MEMORY BIAS TO CANDIDATES
// ----------------------------------------------------

selectedCandidates = selectedCandidates.map((c: any) => {

  const actions = c.actions ?? [];

  const memoryScores = actions.map((a: any) =>
    getMemoryScoreForAction(
      safeActionType(a)
    )
  );

  const avgMemoryScore =
    memoryScores.length > 0
      ? memoryScores.reduce((s: number, x: number) => s + x, 0) / memoryScores.length
      : 0;

  return {
    ...c,
    memoryScore: avgMemoryScore,
  };
});

const planQualityFinal = computePlanQuality({
  selectedBest,
  topologyConfidence,
  dlRisk: dl?.risk_score?.stockout_risk,
  planCoherence,
  decisionPressure: dp.final, // 🔥 NEW
});

// debug only
let policyDebug: any[] = [];

if (optimizerOutput?.candidates?.length) {
  const weighted = applyPolicy(optimizerOutput.candidates, policy);

  const enforced = applyPolicyConstraints(weighted, {
    primary_focus: policy.primary_focus,
    weights: policy.weights,
    prefer_multi_action: policy.prefer_multi_action,
    allow_single_lever: policy.allow_single_lever,
    max_plan_churn: policy.max_plan_churn,
    risk_profile:
      policy.risk_profile === "CONSERVATIVE"
        ? "LOW"
        : policy.risk_profile === "AGGRESSIVE"
        ? "HIGH"
        : "BALANCED",
  });

  policyDebug = enforced.debug ?? [];

  const baselineShortage =
    Number(req.baseline_metrics?.shortageUnits ?? 0) || 0;

  const hardFiltered = (enforced.debug ?? []).filter((c: any) => {

  // 🔥 FIX 1
  if (Array.isArray(c.violations) && c.violations.includes("HARD_BLOCK")) return false;

  const kpis = c.kpis ?? {};
  const shortage = Number(kpis.shortageUnits ?? 0);
  const serviceShortfall = Number(kpis.serviceShortfall ?? 0);

  // 🔥 FIX 2
  const evalSteps = Array.isArray(c.evidence?.evalSteps)
    ? c.evidence.evalSteps
    : [];

  const actions = Array.isArray(c.actions)
    ? c.actions
    : [];

  const isAssumedSupply =
    evalSteps.some((s: string) =>
      s.includes("assumed_supply") || s.includes("assumption")
    ) ||
    actions.some((a: any) =>
      String(a?.reason ?? "").includes("assumed_supply")
    ) ||
    Number(c.kpis?.contextPenalty ?? 0) > 0.5;

  if (policy.risk_profile === "CONSERVATIVE" && shortage > 0) {
    return false;
  }

  if (baselineShortage === 0 && shortage > 0) {
    return false;
  }

  if (serviceShortfall >= 1) {
    return false;
  }

  if (policy.risk_profile === "CONSERVATIVE" && isAssumedSupply) {
    return false;
  }

  return true;
});

  selectedCandidates = hardFiltered.sort((a: any, b: any) => {
    const aK = a.kpis ?? {};
    const bK = b.kpis ?? {};

    const aShort = Number(aK.shortageUnits ?? 0);
    const bShort = Number(bK.shortageUnits ?? 0);

    const aServ = Number(aK.serviceShortfall ?? 0);
    const bServ = Number(bK.serviceShortfall ?? 0);

    const aScore = Number(a.adjustedScore ?? a.score ?? 0);
    const bScore = Number(b.adjustedScore ?? b.score ?? 0);

    if (aShort !== bShort) return aShort - bShort;
    if (aServ !== bServ) return aServ - bServ;

    return selectedCandidates.sort((a: any, b: any) => {

  const aK = a.kpis ?? {};
  const bK = b.kpis ?? {};

  const aShort = Number(aK.shortageUnits ?? 0);
  const bShort = Number(bK.shortageUnits ?? 0);

  const aServ = Number(aK.serviceShortfall ?? 0);
  const bServ = Number(bK.serviceShortfall ?? 0);

  const aScore = Number(a.adjustedScore ?? a.score ?? 0);
  const bScore = Number(b.adjustedScore ?? b.score ?? 0);

  const aMem = Number(a.memoryScore ?? 0);
  const bMem = Number(b.memoryScore ?? 0);

  // 1️⃣ PRIORITÀ OPERATIVA
  if (aShort !== bShort) return aShort - bShort;
  if (aServ !== bServ) return aServ - bServ;

  // 2️⃣ MEMORIA (🔥 NUOVO LIVELLO)
  if (aMem !== bMem) return bMem - aMem;

  // 3️⃣ SCORE CLASSICO
  return bScore - aScore;
});
console.log("MEMORY_RANKING", selectedCandidates.map((c: any) => ({
  actions: (c.actions ?? []).map((a: any) => safeActionType(a)),
  memoryScore: c.memoryScore,
  score: c.score,
})));
  });

  selectedBest =
    selectedCandidates[0] ??
    null;
}

// ----------------------------------------------------
// 🔁 FALLBACK BEST (ADVISORY ONLY)
// ----------------------------------------------------

if (!selectedBest && optimizerOutput?.best?.actions?.length) {
  selectedBest = optimizerOutput.best;

  console.log("FALLBACK_TO_OPTIMIZER_BEST", {
    reason: "NO_POLICY_COMPLIANT_PLAN",
    actions: selectedBest.actions,
  });
}
 

// ----------------------------------------------------
// ANOMALY + GOVERNANCE
// ----------------------------------------------------

let anomaly = false;
let anomalyReasons: string[] = [];
let requiredActions: EnrichedAction[] = [];

let executionAllowed = false;
let governanceReason = "ADVISORY_ONLY";
let improvementMode = false;

let governanceLocked = false;

// --------------------------------------------------
// IMPROVE MODE
// --------------------------------------------------

if (isImprove(req.intent)) {
  governanceLocked = true;
  executionAllowed = false;

  if (req.plan !== "PRINCIPAL") {
    improvementMode = false;
    governanceReason = "PRINCIPAL_REQUIRED_FOR_IMPROVEMENT";
  } else {
    improvementMode = true;
    governanceReason = "IMPROVEMENT_AUTHORITY";
  }
}

// --------------------------------------------------
// SAFETY DERIVATIONS (GLOBAL SCOPE)
// --------------------------------------------------

const hasInventoryBlocking =
  correction.actions?.some((a) => a.blocking) ?? false;

const hasExecutionGap =
  executionGap.some(
    (g) =>
      g.type === "UNDERCONSUMPTION" ||
      g.type === "OVERCONSUMPTION"
  );

const weakReality =
  typeof realityScore === "number" && realityScore < 0.5;

const hasTopologyBlocking =
  topologyComparison.bomDrift &&
  policy.risk_profile === "CONSERVATIVE";

const runtimeExecutablePlanActions =
  hasRuntimeExecutablePlanActions(selectedBest);

const outcome = selectedBest
  ? validateDecisionOutcome(selectedBest)
  : null;

// --------------------------------------------------
// MAIN GOVERNANCE
// --------------------------------------------------

if (selectedBest) {
  // --------------------------------------------------
  // PLAN REPAIR GOVERNANCE — CANONICAL
  // --------------------------------------------------

  if (isPlanRepairMode) {
    anomaly = true;

    anomalyReasons = [
      "PLAN_INCOHERENT",
      "STRUCTURAL_REPAIR_REQUIRED",
    ];

    const repairActions: EnrichedAction[] = [];

    if ((topologyConfidence ?? 1) < 0.6) {
      repairActions.push({
        action: "REBUILD_BOM_GRAPH",
        priority: "HIGH",
        blocking: true,
        effort: "HIGH",
      });
    }

    if (executionGap.some((g) => g.type !== "OK")) {
      repairActions.push({
        action: "RESTORE_MOVEMENT_CHAIN",
        priority: "HIGH",
        blocking: true,
        effort: "MEDIUM",
      });
    }

    if (topologyLayers.fromOrders.edges.length === 0) {
      repairActions.push({
        action: "RECONSTRUCT_ORDER_FLOW",
        priority: "HIGH",
        blocking: true,
        effort: "MEDIUM",
      });
    }

    if (topologyComparison.bomDrift || topologyComparison.orderBomDrift) {
      repairActions.push({
        action: "ALIGN_BOM_AND_ORDERS",
        priority: "HIGH",
        blocking: true,
        effort: "MEDIUM",
      });
    }

    if (planState === "MISSING") {
      repairActions.push({
        action: "DEFINE_PLAN_STRUCTURE",
        priority: "MEDIUM",
        blocking: false,
        effort: "MEDIUM",
      });
    }

    repairActions.push({
      action: "REBUILD_PLAN_STRUCTURE",
      priority: "HIGH",
      blocking: true,
      effort: "HIGH",
    });

    requiredActions = dedupeRequiredActions(repairActions);

    selectedBest.actions = requiredActions;
  }

  // --------------------------------------------------
  // REALITY / EXECUTION GOVERNANCE
  // only when not repairing plan
  // --------------------------------------------------

  if (!isPlanRepairMode) {
    if (problemType === "REALITY") {
      console.log("GOVERNANCE_REALITY_ISSUE_DETECTED");
    }

    if (planState === "MISSING") {
      requiredActions.push({
        action: "DEFINE_PLAN_STRUCTURE",
        priority: "MEDIUM",
        blocking: false,
        effort: "MEDIUM",
      });
    }

    if (hasExecutionGap) {
      anomaly = true;
      anomalyReasons.push("EXECUTION_MISMATCH");
    }

    const anomalyResult = detectDecisionAnomalyV2({
      candidate: selectedBest,
      dl: {
        risk_score: dl?.risk_score?.stockout_risk,
        anomaly_signals: dl?.anomaly_signals,
      },
      topology: {
        confidence: topologyConfidence,
        comparison: topologyComparison,
      },
      policy: {
        primary_focus: policy.primary_focus,
        risk_profile: policy.risk_profile,
      },
    });

    anomaly = anomaly || anomalyResult.anomaly;

    anomalyReasons = Array.from(
      new Set([
        ...anomalyReasons,
        ...(anomalyResult.reasons ?? []),
      ])
    );

    if (anomaly) {
      requiredActions = enrichAnomalyActions(anomalyReasons);
    }

    if (correction.actions?.length) {
      const correctionEnriched: EnrichedAction[] =
        correction.actions.map((a) => ({
          action: a.action,
          priority: a.blocking ? "HIGH" : "MEDIUM",
          blocking: a.blocking,
          effort: "MEDIUM",
        }));

      requiredActions = [
        ...requiredActions,
        ...correctionEnriched,
      ];
    }

    if (topologyComparison.bomDrift) {
      anomaly = true;
      anomalyReasons.push(
        policy.risk_profile === "CONSERVATIVE"
          ? "BOM_DRIFT_BLOCKING"
          : "BOM_DRIFT"
      );

      requiredActions.push({
        action: "ALIGN_BOM_AND_ORDERS",
        priority: "HIGH",
        blocking: true,
        effort: "MEDIUM",
      });
    }

    if (topologyComparison.missingConsumption) {
      requiredActions.push({
        action: "VERIFY_COMPONENT_CONSUMPTION",
        priority: "HIGH",
        blocking: true,
        effort: "MEDIUM",
      });
    }

    if (topologyComparison.unexpectedConsumption) {
      requiredActions.push({
        action: "VERIFY_UNEXPECTED_COMPONENT_USAGE",
        priority: "HIGH",
        blocking: true,
        effort: "MEDIUM",
      });
    }

    requiredActions = dedupeRequiredActions(requiredActions);

    selectedBest.actions = dedupeRequiredActions([
      ...(selectedBest.actions ?? []),
      ...requiredActions,
    ]);
  }

  // --------------------------------------------------
  // EXECUTION TYPE — SINGLE POINT
  // --------------------------------------------------

  if (selectedBest?.actions?.length) {
    selectedBest.actions = selectedBest.actions.map((a: any) => ({
      ...a,
      executionType: mapExecutionType(
        a?.type ?? a?.action ?? a?.kind ?? "UNKNOWN"
      ),
    }));
  }

  const criticalAnomaly = hasCriticalAnomaly(anomalyReasons);

  // --------------------------------------------------
  // EXECUTION TYPE GOVERNANCE
  // --------------------------------------------------

  let allowedExecutionTypes: ExecutionType[] | null = null;

  if (movementQuality.qualityScore < 0.5) {
    executionAllowed = true;
    governanceReason = "DATA_REPAIR_ONLY";
    allowedExecutionTypes = ["DATA_REPAIR"];
  } else if (isPlanRepairMode) {
    executionAllowed =
      req.plan === "SENIOR" &&
      req.intent === "EXECUTE";

    governanceReason = executionAllowed
      ? "PLAN_REPAIR_DELEGATED_EXECUTION"
      : req.plan === "JUNIOR"
      ? "PLAN_REPAIR_APPROVAL_REQUIRED"
      : req.plan === "VISION"
      ? "PLAN_REPAIR_REQUIRED_OBSERVATION_ONLY"
      : req.plan === "PRINCIPAL" && req.intent === "IMPROVE"
      ? "PLAN_REPAIR_IMPROVEMENT_AUTHORITY"
      : "PLAN_REPAIR_REQUIRED";

    allowedExecutionTypes = ["PLAN_REPAIR"];
  } else {
    executionAllowed = executionAllowedByPlan(req.plan, req.intent);
    governanceReason = normalizeGovernanceReason(executionAllowed, req);
    allowedExecutionTypes = null;
  }

 if (
  executionAllowed &&
  allowedExecutionTypes &&
  selectedBest?.actions?.length
) 

if (allowedExecutionTypes) {
  requiredActions = requiredActions.filter(
    (a: any) =>
      allowedExecutionTypes!.includes(
        mapExecutionType(a.action)
      )
  );

  selectedBest.actions = selectedBest.actions.filter(
    (a: any) => allowedExecutionTypes!.includes(a.executionType)
  );
}

  if (
    executionAllowed &&
    (!selectedBest?.actions || selectedBest.actions.length === 0)
  ) {
    executionAllowed = false;
    governanceReason = "NO_ALLOWED_ACTIONS";
  }

  // --------------------------------------------------
  // HARD BLOCKS
  // --------------------------------------------------

  if (hasInventoryBlocking && correctionEffect === "NONE") {
    executionAllowed = false;
    governanceReason = "BLOCKED_BY_INVENTORY_MISMATCH";

  } else if (criticalAnomaly) {
    executionAllowed = false;
    governanceReason = "BLOCKED_BY_SYSTEM_UNCERTAINTY";

  } else if (hasTopologyBlocking) {
    executionAllowed = false;
    governanceReason = "BLOCKED_BY_BOM_DRIFT";

  } else if (weakReality && correctionEffect === "NONE") {
    executionAllowed = false;
    governanceReason = "BLOCKED_BY_LOW_REALITY_SCORE";

  } else if (correctionEffect === "PARTIAL") {
    executionAllowed = false;
    governanceReason = "EXECUTION_WITH_WARNINGS";
  }

  recordDecision({
    decision_id: req.request_id,
    policy_used: policy,
    outcome: outcome ?? (executionAllowed ? "SUCCESS" : "FAIL"),
    anomaly,
  });

} else if (!governanceLocked) {
  executionAllowed = false;

  if (problemType !== "PLAN") {
    governanceReason = requiredActions.length
      ? "ACTION_REQUIRED_NO_SAFE_PLAN"
      : "NO_ACTIONABLE_PLAN";
  }
}
  // ----------------------------------------------------
  // SIGNAL FINALIZATION
  // ----------------------------------------------------

 if (signals && typeof signals === "object") {

const realityState = deriveRealityState({
  realityScore:
    reality?.reality_score,

  topologyConfidence:
    topologyConfidence,

  assumptions:
    reality?.assumptions,

  processInstability:
    reality?.process_instability,

  bomDivergence:
    reality?.bom_divergence,

  reconciliation:
  adaptedReconciliation,
});

(signals as any).reality =
  realityState.realityState;

  (signals as any).realityEvidence =
  realityState;


// --------------------------------------------------
// MODE (UI DRIVER)
// --------------------------------------------------

(signals as any).mode = planningMode;

// --------------------------------------------------
// CORRECTION EFFECT (NO SHORT-CIRCUIT SU PLAN)
// --------------------------------------------------

(signals as any).correction_effect = correctionEffect;

// --------------------------------------------------
// TOPOLOGY SIGNALS
// --------------------------------------------------

(signals as any).bom_drift = topologyComparison.bomDrift;
(signals as any).topology_alignment =
  topologyComparison.alignmentScore;

  // --------------------------------------------------
// PLAN (CANONICAL)
// --------------------------------------------------

  (signals as any).plan = {
level: isPlanCoherent
  ? "COHERENT"
  : planCoherence.score >= 0.5
  ? "SOME_GAPS"
  : "INCOHERENT",

  source: planSource,
  confidence: Number(planConfidence.toFixed(3)),
  score: Number(planCoherence.score.toFixed(3)),

  quality: planQualityFinal.level,
  quality_score: planQualityFinal.score,
};

// --------------------------------------------------
// DECISION PRESSURE (CANONICAL ENGINE)
// --------------------------------------------------

(signals as any).decision_pressure = dp.final;

// --------------------------------------------------
// DECISION PRESSURE TYPE (CANONICAL)
// --------------------------------------------------

if (movementQuality.qualityScore < 0.5) {

  (signals as any).decision_pressure_type = "DATA_QUALITY";

  // 🔥 QUESTO È IL PUNTO CHIAVE
  (signals as any).decision_blocked_reason = "UNRELIABLE_REALITY";

} else {

  if (problemType === "PLAN") {
    (signals as any).decision_pressure_type = "PLAN";
  } else if (problemType === "REALITY") {
    (signals as any).decision_pressure_type = "EXECUTION";
  } else {
    (signals as any).decision_pressure_type = "NONE";
  }

}

  // --------------------------------------------------
  // DATA AWARENESS (OPTIONAL BUT POTENTE)
  // --------------------------------------------------

  (signals as any).data_awareness =
    topologyConfidence < 0.5
      ? "LOW"
      : topologyConfidence < 0.75
      ? "MEDIUM"
      : "HIGH";

      // --------------------------------------------------
// PLAN STATE (STRUCTURAL SIGNAL)
// --------------------------------------------------

(signals as any).plan_state = planState;

// --------------------------------------------------
// UNSTRUCTURED EXECUTION SIGNAL
// --------------------------------------------------

if (problemType === "REALITY" && planState === "MISSING") {
  (signals as any).unstructured_execution = true;
}

}

  // ----------------------------------------------------
  // EXPLAINER
  // ----------------------------------------------------

  const explanation =
  !isPlanCoherent
    ? {
        summary: "Execution continues on reality. Plan reconstruction required.",
        whyChosen: [
          "PLAN_INCOHERENT",
          "EXECUTION_CONTINUES_ON_REALITY"    
        ],
        tradeoffs: [],
        risks: [
          "PLAN_STRUCTURE_NOT_RELIABLE"
        ],
        whyBlocked:
          "Plan structure is weak, execution continues on observed reality",
        nextSteps: requiredActions.map((a) => a.action),
      }
    : selectedBest
    ? explainDecision(selectedBest as any, selectedCandidates as any, {
        anomaly,
        anomalyReasons,
        requiredActions,
        correctionEffect,
        problemType,
      })
    : null;
    

  // ----------------------------------------------------
// EXECUTION
// ----------------------------------------------------
//
// Canonical behavior:
// 1) resolve capability from action through decision engine
// 2) execute capability first
// 3) fallback to legacy runtime only if capability resolution/execution fails
// 4) IMPROVE never executes here
// ----------------------------------------------------

let execution: {
  capabilities?: CapabilityExecutionRecord[];
  intents: any[];
  results: any[];
  trace: any[];
  engine?: "CAPABILITY" | "RUNTIME" | "HYBRID";
  outcome?: ExecutionOutcome;
} | null = null;

if (!improvementMode && executionAllowed && selectedBest?.actions?.length) {
  const capabilityTrace: CapabilityExecutionRecord[] = [];
  const fallbackActions: any[] = [];

  const resolutionContext: ResolutionContext = {
    decisionPressure: (signals as any)?.decision_pressure ?? "MEDIUM",
    riskScore:
      typeof dl?.risk_score?.stockout_risk === "number"
        ? dl.risk_score.stockout_risk
        : 0.5,
    topologyConfidence:
      typeof topologyConfidence === "number" ? topologyConfidence : 0.7,
    correctionEffect,
    anomaly,
  };

   const companyBehavior = resolveBehaviorProfile({
  company_id: req.company_id
});

const behaviorProfile = mergeBehaviorProfiles({
  companyBehavior,
  managerBehavior
});

      console.log("BEHAVIOR_PROFILE_USED", behaviorProfile);

  for (let i = 0; i < selectedBest.actions.length; i++) {
    const action = selectedBest.actions[i];
    const actionType = normalizeActionType(action);

    try {
      const resolution = await resolveCapabilityFinal({
  action: {
    ...action,
    type: action?.type ?? action?.action ?? action?.kind ?? "UNKNOWN"
  },
  plan: req.plan as CapabilityLevel,
  context: {
    ...resolutionContext,
    behaviorProfile
  },
});

// --------------------------------------------------
// EXECUTION OUTCOME FALLBACK
// --------------------------------------------------

if (!execution) {
  execution = {
    capabilities: [],
    intents: [],
    results: [],
    trace: [],
    engine: "CAPABILITY",
    outcome: executionAllowed ? "FAILED" : "BLOCKED",
  };
}

     if (!resolution.capabilityId) {

  const informationalActions = [
    "EXECUTION_MISMATCH",
    "NO_ACTIONS",
    "DL_SIGNAL_ANOMALY"
  ];

  // 🟢 SIGNAL → NO OP (non è errore)
  if (informationalActions.includes(actionType)) {
    capabilityTrace.push({
      action_index: i,
      action_type: actionType,
      status: "SKIPPED",
      result: "INFORMATIONAL_SIGNAL"
    });
    continue;
  }

  // 🔴 DATA REPAIR → deve avere capability
  if (action.executionType === "DATA_REPAIR") {
    capabilityTrace.push({
      action_index: i,
      action_type: actionType,
      status: "FAILED",
      error: "DATA_REPAIR_REQUIRES_CAPABILITY",
    });
    continue;
  }

  // 🟡 tutto il resto → fallback runtime
  capabilityTrace.push({
    action_index: i,
    action_type: actionType,
    status: "FALLBACK_TO_RUNTIME",
    error: "CAPABILITY_NOT_RESOLVED",
  });

  fallbackActions.push(action);
  continue;
}

const capabilityResult = await executeCapability({
  capabilityId: resolution.capabilityId,
  plan: req.plan,
  payload: {
    action,
    company_id: req.company_id,
    actor_id: req.actor_id,
    request_id: req.request_id,
    baseline_snapshot_id: (req as any).baseline_snapshot_id,
    context: {
      tenantId: req.company_id,
      approver: req.actor_id,
      issued_at: nowIso(),
    },
    resolution: {
      candidates: resolution.candidates,
      scoring: resolution.scoring,
    },
  },
});

// --------------------------------------
// 🧠 LEARNING (PlannerAgent memory layer)
// --------------------------------------

if (resolution.capabilityId) {
  const success = capabilityResult.status === "EXECUTED";

  console.log("MEMORY_WRITE", actionType, resolution.capabilityId, success);

  learnCapability({
    action: actionType,
    capabilityId: resolution.capabilityId,
    success,
  });
}

// --------------------------------------
// TRACE
// --------------------------------------

capabilityTrace.push({
  action_index: i,
  action_type: actionType,
  capability_id: resolution.capabilityId,
  status: capabilityResult.status,
  provider: capabilityResult?.provider,
  result: capabilityResult,
});

      // Only true execution success stays in capability lane.
      // Pending approval / skipped are governed states, not runtime fallbacks.
      if (
        capabilityResult.status !== "EXECUTED" &&
        capabilityResult.status !== "PENDING_APPROVAL" &&
        capabilityResult.status !== "SKIPPED"
      ) {
        fallbackActions.push(action);
      }
    } catch (err: any) {
      capabilityTrace.push({
        action_index: i,
        action_type: actionType,
        status: "FALLBACK_TO_RUNTIME",
        error: err?.message ?? "CAPABILITY_EXECUTION_FAILED",
      });

      fallbackActions.push(action);
    }
  }

  let runtimeIntents: any[] = [];
  let runtimeResults: any[] = [];
  let runtimeTrace: any[] = [];

  if (fallbackActions.length > 0) {
    try {
      runtimeIntents = fallbackActions.map((action: any) =>
        mapActionToExecutionIntent(action, {
          tenantId: req.company_id,
          approver: req.actor_id,
        })
      );

      const runtimeResult = await executeRuntimeV1(
        {
          intents: runtimeIntents,
          context: {
            tenantId: req.company_id,
            approver: req.actor_id,
          },
        },
        {
          tenantId: req.company_id,
          approver_id: req.actor_id,
          RESEND_API_KEY: env?.RESEND_API_KEY,
        }
      );

      runtimeResults = runtimeResult.results;
      runtimeTrace = runtimeResult.trace;
    } catch (err: any) {
      runtimeIntents = [];
      runtimeResults = [];
      runtimeTrace = [
        {
          error: err?.message ?? "EXECUTION_INTEGRATION_FAILED",
          started_at: nowIso(),
        },
      ];

      for (const entry of capabilityTrace) {
        if (entry.status === "FALLBACK_TO_RUNTIME") {
          entry.status = "FAILED";
        }
      }
    }
  }

  const capabilityHandledCount = capabilityTrace.filter(
    (x) =>
      x.status === "EXECUTED" ||
      x.status === "PENDING_APPROVAL" ||
      x.status === "SKIPPED"
  ).length;

  const runtimeUsed = runtimeIntents.length > 0 || runtimeTrace.length > 0;

  const hasOnlyDataRepair =
  selectedBest?.actions?.length > 0 &&
  selectedBest.actions.every(
    (a: any) => a.executionType === "DATA_REPAIR"
  );

const engine: "CAPABILITY" | "RUNTIME" | "HYBRID" =
  hasOnlyDataRepair
    ? "CAPABILITY" // 👈 dominio corretto anche se fallisce
    : capabilityHandledCount > 0 && runtimeUsed
    ? "HYBRID"
    : capabilityHandledCount > 0
    ? "CAPABILITY"
    : runtimeUsed
    ? "RUNTIME"
    : "CAPABILITY"; // 👈 fallback safe

    // --------------------------------------------------
// EXECUTION OUTCOME (CANONICAL)
// --------------------------------------------------

let executionOutcome: ExecutionOutcome;

if (!executionAllowed) {
  executionOutcome = "BLOCKED";
} else {
  const total = capabilityTrace.length;

  const executed = capabilityTrace.filter(
    (c) => c.status === "EXECUTED"
  ).length;

  const failed = capabilityTrace.filter(
    (c) =>
      c.status === "FAILED" ||
      c.status === "FALLBACK_TO_RUNTIME"
  ).length;

  if (total === 0) {
    executionOutcome = "FAILED";
  } else if (executed === total) {
    executionOutcome = "SUCCESS";
  } else if (executed > 0) {
    executionOutcome = "PARTIAL";
  } else {
    executionOutcome = "FAILED";
  }
}

  execution = {
  capabilities: capabilityTrace,
  intents: runtimeIntents,
  results: runtimeResults,
  trace: runtimeTrace,
  engine,
  outcome: executionOutcome,
};
}

//-------------------------------
// INTELLIGENCE PARTICIPATION TRACE


 intelligenceCollector.collect({
  provider: "INTERNAL_DL",

  role: "RISK_SCORING",

  authority_layer: req.plan,

  operational_scope: req.domain,

  company_id: req.company_id,

  context_id: "supply_chain",

  policy_scope:
    executionAllowed
      ? "DELEGATED_EXECUTION"
      : "ADVISORY",

  execution_scope: planningMode,

  execution_contribution:
    executionAllowed
      ? "INDIRECT"
      : "NONE",

  metadata: {
    source: "dl.v2",
    orchestrator: "v2"
  }
});

  // ----------------------------------------------------
  // GOVERNANCE PAYLOAD
  // ----------------------------------------------------

  const governance: GovernanceResult & {
    anomaly?: boolean;
    anomaly_reasons?: string[];
    required_actions?: EnrichedAction[];
    reality_score?: number | null;
    inventory_reconciliation?: any;
    inventory_anomaly_diagnosis?: any;
    correction_effect?: CorrectionEffect;
    post_correction_reconciliation?: any;
    improvement_mode?: boolean;
    capability_mode?: "DISABLED" | "CAPABILITY" | "RUNTIME" | "HYBRID";
  } = {
    execution_allowed: executionAllowed,
    reason: governanceReason,
    anomaly,
    anomaly_reasons: anomalyReasons,
    required_actions: requiredActions,
    reality_score: realityScore,
    inventory_reconciliation: inventoryReconciliation,
    inventory_anomaly_diagnosis: anomalyDiagnosis,
    correction_effect: correctionEffect,
    post_correction_reconciliation: postCorrectionReconciliation,
    improvement_mode: improvementMode,
    capability_mode: execution?.engine ?? "DISABLED",
  };

  // ----------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------

  // ----------------------------------------------------
// DECISION TRACE — BUILD ORD LAYER
// ----------------------------------------------------

const ordTrace = buildOrdDecisionTrace({

  requestId: req.request_id,

  // REALITY
  ordersSeen: orders.length,
  inventorySeen: inventory.length,
  shortagesDetected: selectedBest?.kpis?.shortageUnits ?? 0,

  // OPTIMIZER
  optimizerCandidates: selectedCandidates.length,
  optimizerBestScore:
    selectedBest?.adjustedScore ??
    selectedBest?.score ??
    0,

  // ACTIONS
  actions: (selectedBest?.actions ?? []).map((a: any) => ({
    kind: safeActionType(a),
    sku: a?.sku,
    qty: a?.qty
  })),

  // GOVERNANCE
  executionAllowed,
  governanceReason,

  executionLevel:
    req.plan === "VISION"
      ? "HUMAN"
      : req.plan === "JUNIOR"
      ? "JUNIOR"
      : req.plan === "SENIOR"
      ? "SENIOR"
      : "SYSTEM",

  decisionMode:
    req.intent === "EXECUTE"
      ? executionAllowed
        ? "DELEGATED_EXECUTION"
        : "HUMAN_APPROVED"
      : "OBSERVATION"
});

const decisionTrace = buildDecisionTraceFromOrd({
  ord: ordTrace,
  dl,
  authorityLevel: req.plan as any,
  decisionMode: ordTrace.decisionMode as any
});


// ----------------------------------------------------
// REPLAY (DECISION MEMORY)
// ----------------------------------------------------

let replayResult: any = null;

try {
  const history = getDecisionHistory() as any;

  if (decisionTrace && history?.length) {
    replayResult = replayDecision({
      current: decisionTrace,
      history,
    });
  }
} catch {
  replayResult = null;
}

// ----------------------------------------------------
// EXECUTION EVIDENCE
// ----------------------------------------------------

if (execution?.capabilities?.length) {
  decisionTrace.execution = {
    evidences: execution.capabilities
  .filter((c: any) =>
    c.status === "EXECUTED" ||
    c.status === "FAILED"
  )
  .map((c: any) => ({
    capability_id: c.capability_id ?? "UNKNOWN",
    success: c.status === "EXECUTED",
    executed_at: nowIso(),
    external_ref: c.provider,
    details: c.result,
    governance: executionAllowed ? "EXECUTE" : "BLOCKED",
    rationale: governanceReason
  }))
  };
}

// ----------------------------------------------------
// LEARNING GATE
// ----------------------------------------------------

const anomalyCheck = detectDecisionAnomalyV2({
  candidate: selectedBest,
  dl: {
    risk_score: dl?.risk_score?.stockout_risk,
    anomaly_signals: dl?.anomaly_signals,
  },
  topology: {
    confidence: topologyConfidence,
    comparison: topologyComparison,
  },
  policy: {
    primary_focus: policy.primary_focus,
    risk_profile: policy.risk_profile,
  },
});

const executionOk =
  execution?.outcome === "SUCCESS" ||
  execution?.outcome === "PARTIAL";

const outcomeFinal =
  executionOk ? "SUCCESS" : "FAIL";

const learningEligible = executionOk;

const learningQuality = anomalyCheck.anomaly ? "LOW" : "HIGH";

(decisionTrace as any).learning = {
  eligible: learningEligible,
  outcome: outcomeFinal,
  anomaly: anomalyCheck.anomaly,
  quality: learningQuality
};

console.log("DEBUG execution outcome:", execution?.outcome);
console.log("DEBUG learningEligible:", learningEligible);

  
// --------------------------------------------------
// RUNTIME COGNITION
// --------------------------------------------------

// source 1 → explicit cognition input
const cognitionExperiences =
(
  req.cognition?.experiences ?? []
) as CognitiveExperienceRecord[];


// source 2 → future runtime enrichment
// (decision memory → cognition bridge)
const runtimeExperiences: CognitiveExperienceRecord[] = [
  ...cognitionExperiences
];

console.log(
"COGNITION_INPUT",
JSON.stringify(
runtimeExperiences,
null,
2
)
);

const runtimeCognition =
buildRuntimeCognition({

experiences:
runtimeExperiences,

executionAllowed

});

console.log(
  "RUNTIME_COGNITION",
  runtimeCognition
);

// --------------------------------------------------
// RUNTIME COGNITION → EXECUTION SEQUENCING ONLY
// --------------------------------------------------

if (
  runtimeCognition.runtime.participationMode === "EXECUTION" &&
  runtimeCognition.runtime.runtimeTrust >= 0.8 &&
  selectedBest?.actions?.length
) {
  const correctionActionTypes =
    new Set(
      (correction.actions ?? []).map((a: any) =>
        String(a.action)
      )
    );

  selectedBest.actions =
    selectedBest.actions.sort((a: any, b: any) => {
      const aType = safeActionType(a);
      const bType = safeActionType(b);

      const aCorrection =
        correctionActionTypes.has(aType) ? 1 : 0;

      const bCorrection =
        correctionActionTypes.has(bType) ? 1 : 0;

      return bCorrection - aCorrection;
    });

  console.log("RUNTIME_COGNITION_SEQUENCING", {
    runtimeTrust:
      runtimeCognition.runtime.runtimeTrust,

    reorderedActions:
      selectedBest.actions.map((a: any) =>
        safeActionType(a)
      ),
  });
}

const plannerCognition =
  buildPlannerCognition({

    reality:
      (signals as any).realityEvidence,

    executionAllowed,

    governanceState:
      governanceReason,

    anomalyDetected:
      governance.anomaly ?? false,

    hasBlockingMismatch,

    pressureLevel:
      signals.decision_pressure,

    correctionEffect,

    executionOutcome:
      execution?.outcome === "SUCCESS"
        ? "SUCCESS"
        : execution?.outcome === "PARTIAL"
        ? "PARTIAL"
        : execution?.outcome === "FAILED"
        ? "FAILED"
        : execution?.outcome === "BLOCKED"
        ? "BLOCKED"
        : "NONE",
  });

const plannerNarrativeState =
  buildPlannerNarrativeState({

    planningMode,

    cognition: plannerCognition,

    authorityLevel:
      req.plan,

    reconciliationStatus:
      correctionEffect === "FULL"
        ? "FULL"
        : correctionEffect === "PARTIAL"
        ? "PARTIAL"
        : "NOT_REQUIRED",

    executionOutcome:
      execution?.outcome === "SUCCESS"
        ? "SUCCESS"
        : execution?.outcome === "PARTIAL"
        ? "PARTIAL"
        : execution?.outcome === "FAILED"
        ? "FAILED"
        : "NONE",
  });

console.log(
  "PLANNER_NARRATIVE_STATE",
  plannerNarrativeState
);

const plannerNarrative =
  renderPlannerNarrative(
    plannerNarrativeState
  );

console.log(
  "PLANNER_NARRATIVE",
  plannerNarrative
);

const plannerNarrativeUiState =
  buildPlannerNarrativeUiState(
    plannerNarrativeState
  );

const plannerNarrativePolicy =
  applyPlannerNarrativePolicy(
    plannerNarrativeState
  );

console.log(
  "PLANNER_NARRATIVE_UI_STATE",
  plannerNarrativeUiState
);

console.log(
  "PLANNER_NARRATIVE_POLICY",
  plannerNarrativePolicy
);

// --------------------------------------------------
// GOVERNANCE EMERGENCE
// --------------------------------------------------

const governanceEmergence =
  buildGovernanceEmergence({

    plan: req.plan,

    signals,

    governance,

    execution,

    replay: replayResult,

    optimizer: {
      best_score:
        selectedBest?.adjustedScore ??
        selectedBest?.score ??
        0,
    },

    planner_narrative_state:
      plannerNarrativeState,
  });

console.log(
  "GOVERNANCE_EMERGENCE",
  governanceEmergence
);



// --------------------------------------------------
// EFFECTIVE EXECUTION TRUST
// --------------------------------------------------

const effectiveExecutionTrust =
Math.max(
governanceEmergence
?.trustDomains
?.executionTrust ?? 0,

runtimeCognition
?.runtime
?.runtimeTrust ?? 0
);

console.log(
"EFFECTIVE_EXECUTION_TRUST",
{
governanceExecutionTrust:
governanceEmergence
?.trustDomains
?.executionTrust,

runtimeTrust:
runtimeCognition
?.runtime
?.runtimeTrust,

effectiveExecutionTrust
}
);

// --------------------------------------------------
// RUNTIME COGNITION → CONFIDENCE ADAPTATION
// Memory influences execution confidence,
// never creates certainty.
// --------------------------------------------------

if (
  effectiveExecutionTrust > 0.8 &&
  correction.actions?.length
) {
  correction.actions =
    correction.actions.map((a: any) => {
      const baseConfidence =
        Number(a.confidence ?? 0);

      const boostedConfidence =
        baseConfidence +
        (
          (1 - baseConfidence) *
          effectiveExecutionTrust *
          0.40
        );

      return {
        ...a,

        confidence:
          Number(
            Math.min(
              0.99,
              boostedConfidence
            ).toFixed(3)
          ),

        confidence_before_runtime_cognition:
          Number(baseConfidence.toFixed(3)),
      };
    });

  console.log(
    "RUNTIME_COGNITION_CONFIDENCE",
    {
      effectiveExecutionTrust,

      adaptedActions:
        correction.actions.map((a: any) => ({
          action: a.action,
          before:
            a.confidence_before_runtime_cognition,
          after:
            a.confidence,
        })),
    }
  );

  console.log(
"RUNTIME_COGNITION_EFFECT",
{
experience:
runtimeCognition.runtime.experienceId,

pattern:
runtimeCognition.runtime.patternId,

trust:
runtimeCognition.runtime.runtimeTrust,

confidenceDelta:
correction.actions.map(
(a:any)=>({

action:a.action,

delta:
Number(
(
a.confidence -
a.confidence_before_runtime_cognition
).toFixed(3)
)

})
)

}
);
}


// --------------------------------------------------
// 🔥 DECISION MEMORY SNAPSHOT
// --------------------------------------------------

const last = await store.getLastSnapshot(
  req.company_id,
  "supply_chain"
);

const decisionMemorySnapshot =
  await buildDecisionMemorySnapshotV1({
  tenant_id: "default",
  company_id: req.company_id,
  context_id: "supply_chain",

  plan: req.plan,
  intent: req.intent,
  domain: req.domain,

  baseline_snapshot_id: req.baseline_snapshot_id ?? "none",
  baseline_metrics: {},

  // 👉 FIX dlEvidence (fallback safe)
  ord: {
    pressure_score: 0,
    confidence_score: 0,
    ord_gate: {
      allow_paid_llm: false,
      recommended_tier: "OSS",
      reason: "fallback"
    }
  },

  previous_hash: last?.hash_chain.current_hash ?? null,

  // 👉 FIX struttura corretta
  execution: {
  outcome:
    execution?.outcome === "SUCCESS"
      ? "SUCCESS"
      : execution?.outcome === "PARTIAL"
      ? "PARTIAL"
      : "FAIL",

  anomaly: anomalyCheck?.anomaly ?? false,

  executed_actions:
    execution?.capabilities
      ?.map(c => c.capability_id)
      .filter((id): id is string => typeof id === "string") ?? []
  }
});

// safe write
try {
  try {
  await appendMemoryRecord({
  tenant_id: "default",

  company_id: req.company_id,

  context_id: "supply_chain",

  plan: req.plan,

  intent: req.intent,

  anomaly:
    anomalyCheck.anomaly,

  payload: decisionMemorySnapshot,

  adapter: store
});

  console.log("✅ SNAPSHOT SAVED");
} catch (err) {
  console.error("❌ SNAPSHOT ERROR", err);
}
} catch (err) {
  console.error("Decision memory write failed", err);
}

  return {
    ok: true,
    request_id: req.request_id,
    plan: req.plan,
    intent: req.intent,
    domain: req.domain,
    signals,
    optimizer: {
  best_score: isPlanCoherent
    ? selectedBest?.adjustedScore ?? selectedBest?.score ?? null
    : null,
  actions: isPlanCoherent
    ? selectedBest?.actions ?? []
    : [],
  candidates: isPlanCoherent
    ? selectedCandidates.length ?? 0
    : 0,
},
    explanation,
    governance,
    execution,
    policy_used: policy,
    policy_debug: policyDebug,
topology_debug: topologyEvidence,
topology_layers_debug: {
  fromMovements: {
    nodes: topologyLayers.fromMovements.nodes.length,
    edges: topologyLayers.fromMovements.edges.length,
  },
  fromOrders: {
    nodes: topologyLayers.fromOrders.nodes.length,
    edges: topologyLayers.fromOrders.edges.length,
  },
  fromBom: {
    nodes: topologyLayers.fromBom.nodes.length,
    edges: topologyLayers.fromBom.edges.length,
  },
},
topology_comparison_debug: topologyComparison,
plan_coherence_debug: planCoherence,
plan_quality_debug: planQualityFinal,
plan_source_debug: {
  source: planSource,
  confidence: planConfidence,
},
decision_pressure_debug: dp.breakdown,
problem_type_debug: problemType,

decision_trace: {
  ...decisionTrace,
  replay: replayResult
    ? {
        hasSimilar: replayResult.hasSimilar,
        similarity: replayResult.similarityScore,
        explanation: replayResult.explanation,
      }
    : null,
},

runtime_cognition:
runtimeCognition,

intelligence_trace: {
  count: intelligenceCollector.traces.length,
  traces: intelligenceCollector.traces
},

planner_narrative_state:plannerNarrativeState,
planner_narrative: plannerNarrative,
planner_narrative_ui: plannerNarrativeUiState,
planner_narrative_policy: plannerNarrativePolicy,
governance_emergence: {

...governanceEmergence,

trustDomains:{

...governanceEmergence.trustDomains,

effectiveExecutionTrust

}

},

replay: replayResult
  ? {
      hasSimilar: replayResult.hasSimilar,
      similarity: replayResult.similarityScore,
      explanation: replayResult.explanation,
    }
  : null,

issued_at: nowIso(),
  } as any;
}catch (err: any) {

    // 🔥 LOG STRUTTURATO (NON SOLO console.error)
    console.error("🔥 ORCHESTRATOR ERROR", {
      message: err?.message,
      stack: err?.stack,
      request_id: req?.request_id,
    });

    return {
      ok: false,
      request_id: req?.request_id ?? "unknown",
      reason: err?.message ?? "UNKNOWN_ERROR",
      stack: err?.stack ?? null
    } as any;
  }
}