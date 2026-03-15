// core/src/sandbox/orchestrator.v2.ts
// ======================================================
// PlannerAgent — Sandbox Orchestrator V2
// Canonical Source of Truth
//
// Responsibilities
// - validate sandbox request
// - normalize operational datasets
// - compute deterministic evidence
// - derive cockpit signals
// - run governed optimizer
// - prepare execution preview
// - keep a single semantic pressure: signals.decision_pressure
// ======================================================

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioV2,
  GovernanceResult,
  PlanTier,
} from "./contracts.v2";

import { authoritySandboxGuard } from "./authority/authoritySandbox.guard";
import { computeDlEvidenceV2 } from "./dl.v2";
import { buildUiSignalsV1 } from "./signal.engine.v1";

import { buildReality } from "../reality/reality.builder";
import { buildOperationalTopology } from "../topology/topology.builder";
import { computeTopologyConfidence } from "../topology/topology.confidence";

import { runOptimizerV1 } from "../decision/optimizer";
import { routeActionToExecutionIntent } from "../execution/action.router";

import {
  normalizeOrders,
  normalizeInventory,
  normalizeMovements,
} from "../../datasets/dlci/adapters";

function executionAllowed(plan: PlanTier, intent: string): boolean {
  if (intent !== "EXECUTE") return false;

  switch (plan) {
    case "JUNIOR":
    case "SENIOR":
    case "PRINCIPAL":
      return true;
    default:
      return false;
  }
}

function llmAllowed(plan: PlanTier): boolean {
  return plan !== "CHARTER";
}

function normalizeSandboxOrders(rows: unknown[]) {
  return normalizeOrders(rows);
}

function normalizeSandboxInventory(rows: unknown[]) {
  return normalizeInventory(rows);
}

function normalizeSandboxMovements(rows: unknown[]) {
  return normalizeMovements(rows);
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildFallbackScenario(summary: string, confidence: number): ScenarioV2[] {
  return [
    {
      id: "llm-1",
      title: "Demand vs Stock Imbalance",
      summary,
      confidence,
    },
  ];
}

async function runLlmFanout(
  _req: SandboxEvaluateRequestV2,
  summary: string,
  confidence: number
): Promise<ScenarioV2[]> {
  return buildFallbackScenario(summary, confidence);
}

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2
): Promise<SandboxEvaluateResponseV2> {
  // --------------------------------------------------
  // Basic request validation aligned with real boundary
  // --------------------------------------------------

  if (!req.request_id) {
    return {
      ok: false,
      request_id: "unknown",
      reason: "MISSING_FIELD: request_id",
    };
  }

  if (!req.company_id) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "MISSING_FIELD: company_id",
    };
  }

  if (!(req as any).baseline_snapshot_id) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "MISSING_FIELD: baseline_snapshot_id",
    };
  }

  if (!req.plan) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "MISSING_FIELD: plan",
    };
  }

  if (!req.intent) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "MISSING_FIELD: intent",
    };
  }

  if (!req.domain) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "MISSING_FIELD: domain",
    };
  }

  if (!req.baseline_metrics) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "MISSING_FIELD: baseline_metrics",
    };
  }

  if (!req.snapshot) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "SNAPSHOT_REQUIRED",
    };
  }

  const auth = authoritySandboxGuard(req.snapshot);

  if (!auth.ok) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: auth.reason,
    };
  }

  // --------------------------------------------------
  // Normalize incoming datasets
  // --------------------------------------------------

  const rawOrders = normalizeSandboxOrders(req.orders ?? []);
  const rawInventory = normalizeSandboxInventory(req.inventory ?? []);
  const rawMovements = normalizeSandboxMovements(req.movements ?? []);

  // --------------------------------------------------
  // Reality reconstruction
  // --------------------------------------------------

  const reality = buildReality({
    orders: rawOrders,
    inventory: rawInventory,
    movements: rawMovements,
    movord: (req.movord ?? []) as any[],
    movmag: (req.movmag ?? []) as any[],
    masterBom: (req.masterBom ?? []) as any[],
  });

  let twinOrders = normalizeSandboxOrders((reality as any)?.observed?.orders ?? []);
  let twinInventory = normalizeSandboxInventory((reality as any)?.observed?.inventory ?? []);
  const twinMovements = rawMovements;

  if (twinOrders.length === 0 && rawOrders.length > 0) {
    twinOrders = rawOrders;
  }

  if (twinInventory.length === 0 && rawInventory.length > 0) {
    twinInventory = rawInventory;
  }

  const inferredBom = (reality as any)?.reconstructed?.inferred_bom ?? [];

  // --------------------------------------------------
  // Deterministic evidence
  // --------------------------------------------------

  const dlResult = await computeDlEvidenceV2(
    { DL_ENABLED: "true" },
    {
      horizonDays: 30,
      baselineMetrics: req.baseline_metrics ?? {},
      scenarioMetrics: undefined,
      orders: twinOrders as any[],
      inventory: twinInventory as any[],
      movements: twinMovements as any[],
      movord: (req.movord ?? []) as any[],
      movmag: (req.movmag ?? []) as any[],
    }
  );

  if (dlResult.health !== "ok" || !dlResult.evidence) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: "DL_LAYER_FAILED",
    };
  }

  const dlEvidence = dlResult.evidence;

  // --------------------------------------------------
  // Topology
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
  // Cockpit signals
  // single semantic pressure only:
  // signals.decision_pressure
  // --------------------------------------------------

  const { signals } = buildUiSignalsV1({
    dl: dlEvidence as any,
    dataset_descriptor: req.dataset_descriptor,
  });

  // --------------------------------------------------
  // Optimizer
  // --------------------------------------------------

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
      bomReferenceDecision: undefined,
    } as any);
  } catch {
    optimizerOutput = null;
  }

  // --------------------------------------------------
  // Scenarios
  // --------------------------------------------------

  let scenarios: ScenarioV2[] = [];

  const summary =
    "Demand p50=" +
    dlEvidence.demand_forecast.p50 +
    " stockoutRisk=" +
    dlEvidence.risk_score.stockout_risk;

  const confidence = Math.min(
    1,
    Math.max(0.3, (dlEvidence.risk_score.stockout_risk ?? 0) + 0.2)
  );

  if (llmAllowed(req.plan)) {
    scenarios = await runLlmFanout(req, summary, confidence);
  } else {
    scenarios = buildFallbackScenario(summary, confidence);
  }

  // --------------------------------------------------
  // Execution preview
  // --------------------------------------------------

  const execution_preview =
    executionAllowed(req.plan, req.intent) && optimizerOutput?.best?.actions?.length
      ? optimizerOutput.best.actions.map((action: any) =>
          routeActionToExecutionIntent(action, {
            tenantId: req.company_id,
            approver: req.actor_id,
          })
        )
      : [];

  // --------------------------------------------------
  // Governance
  // --------------------------------------------------

  const governance: GovernanceResult = {
    execution_allowed: executionAllowed(req.plan, req.intent),
    reason: executionAllowed(req.plan, req.intent)
      ? "DELEGATED_OR_BUDGETED_AUTHORITY"
      : "ADVISORY_ONLY",
  };

  // --------------------------------------------------
  // Response
  // --------------------------------------------------

  return {
    ok: true,
    request_id: req.request_id,
    plan: req.plan,
    intent: req.intent,
    domain: req.domain,

    signals,

    optimizer: optimizerOutput
      ? {
          best_score: optimizerOutput.best?.score ?? null,
          actions: optimizerOutput.best?.actions ?? [],
          candidates: optimizerOutput.candidates?.length ?? 0,
        }
      : {
          best_score: null,
          actions: [],
          candidates: 0,
        },

    scenarios,

    execution_preview,

    governance,

    issued_at: nowIso(),
  };
}
