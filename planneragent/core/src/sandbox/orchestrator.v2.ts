// core/src/sandbox/orchestrator.v2.ts
// ======================================================
// PlannerAgent — Sandbox Orchestrator V2
// Canonical Source of Truth (UPDATED WITH EXPLAINER V1)
// ======================================================

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioV2,
  GovernanceResult,
  PlanTier,
} from "./contracts.v2";

import type {
  DecisionTraceV2,
  ExecutionEvidence,
} from "../decision/decision.trace";

import { authoritySandboxGuard } from "./authority/authoritySandbox.guard";
import { computeDlEvidenceV2 } from "./dl.v2";
import { buildUiSignalsV1 } from "./signal.engine.v1";

import { buildReality } from "../reality/reality.builder";
import { buildOperationalTopology } from "../topology/topology.builder";
import { computeTopologyConfidence } from "../topology/topology.confidence";

import { runOptimizerV1 } from "../decision/optimizer";
import { buildOrdDecisionTrace } from "../decision/ord/ord.trace";
import { buildDecisionTraceFromOrd } from "../decision/decision.trace.builder";
import { replayDecision } from "../decision/decision.replay.engine";
import { adaptRealitySnapshot } from "../decision/decision.reality.adapter";

// 🔥 NEW
import { explainDecision } from "../decision/explainer/decision.explainer.v1";

import { routeActionToExecutionIntent } from "../execution/action.router";
import { executePlan } from "../execution/execution.bridge";
import { buildActionsFromRealityV2 } from "../execution/action.builder.v2";

import { persistDecisionTrace } from "../decision-memory/decision.memory.bridge";
import { D1DecisionStoreAdapter } from "../decision-memory/decision.store";

import {
  normalizeOrders,
  normalizeInventory,
  normalizeMovements,
} from "../../datasets/dlci/adapters";

// ======================================================
// TYPES
// ======================================================

type OrchestratorEnv = {
  DB?: D1Database;
};

type SemanticAction = {
  id: string;
  type: string;
  sku?: string;
  qty?: number;
  orderId?: string;
  shiftDays?: number;
  source: "OPTIMIZER";
  raw: any;
};

// ======================================================
// HELPERS
// ======================================================

function executionAllowed(plan: PlanTier, intent: string): boolean {
  if (intent !== "EXECUTE") return false;

  return plan === "JUNIOR" || plan === "SENIOR" || plan === "PRINCIPAL";
}

function llmAllowed(plan: PlanTier): boolean {
  return plan !== "CHARTER";
}

function nowIso(): string {
  return new Date().toISOString();
}

// ======================================================
// SEMANTIC
// ======================================================

function buildSemanticActions(bestActions: any[]): SemanticAction[] {
  return bestActions.map((a: any, index: number) => ({
    id: `act-${Date.now()}-${index}-${a?.sku ?? a?.orderId ?? "generic"}`,
    type: String(a?.kind ?? "UNKNOWN_ACTION"),
    sku: a?.sku,
    qty: typeof a?.qty === "number" ? a.qty : undefined,
    orderId: a?.orderId,
    shiftDays: typeof a?.shiftDays === "number" ? a.shiftDays : undefined,
    source: "OPTIMIZER",
    raw: a,
  }));
}

// ======================================================
// MAIN
// ======================================================

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2,
  env?: OrchestratorEnv
): Promise<SandboxEvaluateResponseV2> {

  console.log("DB_PRESENT", !!env?.DB);

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  if (!req.request_id) {
    return { ok: false, request_id: "unknown", reason: "MISSING_FIELD: request_id" };
  }

  if (!req.company_id) {
    return { ok: false, request_id: req.request_id, reason: "MISSING_FIELD: company_id" };
  }

  if (!(req as any).baseline_snapshot_id) {
    return { ok: false, request_id: req.request_id, reason: "MISSING_FIELD: baseline_snapshot_id" };
  }

  if (!req.snapshot) {
    return { ok: false, request_id: req.request_id, reason: "SNAPSHOT_REQUIRED" };
  }

  const auth = authoritySandboxGuard(req.snapshot);
  if (!auth.ok) {
    return { ok: false, request_id: req.request_id, reason: auth.reason };
  }

  // --------------------------------------------------
  // STORE
  // --------------------------------------------------

  const store = env?.DB ? new D1DecisionStoreAdapter(env.DB) : null;

  // --------------------------------------------------
  // NORMALIZATION
  // --------------------------------------------------

  const rawOrders = normalizeOrders(req.orders ?? []);
  const rawInventory = normalizeInventory(req.inventory ?? []);
  const rawMovements = normalizeMovements(req.movements ?? []);

  // --------------------------------------------------
  // REALITY
  // --------------------------------------------------

  const reality = buildReality({
    orders: rawOrders,
    inventory: rawInventory,
    movements: rawMovements,
    movord: (req.movord ?? []) as any[],
    movmag: (req.movmag ?? []) as any[],
    masterBom: (req.masterBom ?? []) as any[],
  });

  let twinOrders = rawOrders;
  let twinInventory = rawInventory;
  const twinMovements = rawMovements;

  const inferredBom = (reality as any)?.reconstructed?.inferred_bom ?? [];

  // --------------------------------------------------
  // DL
  // --------------------------------------------------

  const dlResult = await computeDlEvidenceV2(
    { DL_ENABLED: "true" },
    {
      horizonDays: 30,
      baselineMetrics: req.baseline_metrics ?? {},
      orders: twinOrders as any[],
      inventory: twinInventory as any[],
      movements: twinMovements as any[],
    }
  );

  if (dlResult.health !== "ok" || !dlResult.evidence) {
    return { ok: false, request_id: req.request_id, reason: "DL_LAYER_FAILED" };
  }

  const dlEvidence = dlResult.evidence;

  // --------------------------------------------------
  // TOPOLOGY
  // --------------------------------------------------

  const topology = buildOperationalTopology({
    orders: twinOrders,
    inventory: twinInventory,
    movements: twinMovements,
    inferredBom,
  });

  const topologyConfidence = computeTopologyConfidence({
    nodes: topology.nodes,
    edges: topology.edges,
  });

  // --------------------------------------------------
  // SIGNALS
  // --------------------------------------------------

  const { signals } = buildUiSignalsV1({
    dl: dlEvidence as any,
    dataset_descriptor: req.dataset_descriptor,
  });

  // ==================================================
  // BUILDER V2
  // ==================================================

  const builtActions = buildActionsFromRealityV2({
    requestId: req.request_id,
    plan: req.plan,
    asOf: nowIso(),
    orders: twinOrders,
    inventory: twinInventory,
    movements: twinMovements,
    baseline_metrics: req.baseline_metrics ?? {},
    scenario_metrics: {},
    constraints_hint: (req as any).constraints_hint ?? {},
    dlSignals: dlEvidence.risk_score ?? {},
    inferredBom,
    realitySnapshot: reality,
    operationalTopology: topology,
    topologyConfidence: topologyConfidence?.confidence ?? 0.5,
  } as any);

  console.log("[BUILDER_ACTIONS]", JSON.stringify(builtActions, null, 2));

  // ==================================================
  // OPTIMIZER
  // ==================================================

  let optimizerOutput: any = null;

  try {
    optimizerOutput = await runOptimizerV1({
      requestId: req.request_id,
      plan: req.plan,
      asOf: nowIso(),
      orders: twinOrders,
      inventory: twinInventory,
      movements: twinMovements,
      baseline_metrics: req.baseline_metrics ?? {},
      scenario_metrics: {},
      constraints_hint: (req as any).constraints_hint ?? {},
      dlSignals: dlEvidence.risk_score ?? {},
      inferredBom,
      realitySnapshot: reality,
      operationalTopology: topology,
      topologyConfidence: topologyConfidence?.confidence ?? 0.5,
    } as any);
  } catch {
    optimizerOutput = null;
  }

  if (
    optimizerOutput &&
    (!optimizerOutput.best?.actions || optimizerOutput.best.actions.length === 0)
  ) {
    optimizerOutput.best.actions = builtActions;
  }

  console.log("[OPTIMIZER_OUTPUT]", JSON.stringify(optimizerOutput, null, 2));

  // ==================================================
  // 🔥 EXPLAINER (NEW)
  // ==================================================

  const explanation = optimizerOutput?.best
    ? explainDecision(
        optimizerOutput.best,
        optimizerOutput.candidates ?? []
      )
    : null;

  // --------------------------------------------------
  // SEMANTIC
  // --------------------------------------------------

  const semanticActions = buildSemanticActions(
    optimizerOutput?.best?.actions ?? []
  );

  // --------------------------------------------------
  // GOVERNANCE
  // --------------------------------------------------

  const governance: GovernanceResult = {
    execution_allowed: executionAllowed(req.plan, req.intent),
    reason: executionAllowed(req.plan, req.intent)
      ? "DELEGATED_OR_BUDGETED_AUTHORITY"
      : "ADVISORY_ONLY",
  };

  // --------------------------------------------------
  // RESPONSE
  // --------------------------------------------------

  return {
    ok: true,
    request_id: req.request_id,
    plan: req.plan,
    intent: req.intent,
    domain: req.domain,

    signals,

    optimizer: {
      best_score: optimizerOutput?.best?.score ?? null,
      actions: optimizerOutput?.best?.actions ?? [],
      candidates: optimizerOutput?.candidates?.length ?? 0,
    },

    explanation, // 🔥 NEW

    governance,
    decision_trace: null,
    issued_at: nowIso(),
  } as any;
}