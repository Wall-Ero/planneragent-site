// core/src/sandbox/orchestrator.v2.ts
// ======================================================
// SANDBOX ORCHESTRATOR — V2
// Canonical Source of Truth
//
// Responsibilities
// - Enforce authority boundary
// - Build operational reality
// - Compute deterministic evidence
// - Build topology + confidence
// - Detect BOM divergence and ask SCM
// - Run deterministic optimizer
// - Keep cockpit state-only, explanations in advisory/chat
// ======================================================

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioV2,
  ScenarioAdvisoryV2,
  DlEvidenceV2,
  Health,
  PlanTier,
} from "./contracts.v2";

import { authoritySandboxGuard } from "./authority/authoritySandbox.guard";
import { computeDlEvidenceV2 } from "./dl.v2";
import { buildUiSignalsV1 } from "./signal.engine.v1";

import { buildReality } from "../reality/reality.builder";
import { buildOperationalTopology } from "../topology/topology.builder";
import { computeTopologyConfidence } from "../topology/topology.confidence";

import { createBomReferenceDecision } from "../decision/optimizer/bomReferenceDecision";
import { runOptimizerV1 } from "../decision/optimizer";

type Env = {
  DL_ENABLED?: string;
};

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

function buildVisionAdvisory(
  dl: DlEvidenceV2,
  health: Health
): ScenarioAdvisoryV2 {
  const labels: string[] = [];
  const keySignals: string[] = [];

  if (dl.risk_score.stockout_risk > 0.6) {
    labels.push("STOCKOUT_RISK");
    keySignals.push(`Stockout risk elevated (${dl.risk_score.stockout_risk})`);
  }

  if (dl.risk_score.supplier_dependency > 0.7) {
    labels.push("SUPPLIER_DEPENDENCY");
    keySignals.push(`Supplier dependency high (${dl.risk_score.supplier_dependency})`);
  }

  return {
    one_liner:
      health !== "ok"
        ? "Deterministic layer degraded."
        : labels.length
        ? "Operational risk detected."
        : "System stable.",
    key_signals: keySignals.length ? keySignals : dl.anomaly_signals,
    labels,
    questions: [],
  };
}

async function runLlmFanout(
  _req: SandboxEvaluateRequestV2,
  dl: DlEvidenceV2
): Promise<ScenarioV2[]> {
  return [
    {
      id: "llm-1",
      title: "Demand vs Stock Imbalance",
      summary: `Demand p50=${dl.demand_forecast.p50} stockoutRisk=${dl.risk_score.stockout_risk}`,
      confidence: Math.min(1, Math.max(0.3, dl.risk_score.stockout_risk + 0.2)),
    },
  ];
}

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2
): Promise<SandboxEvaluateResponseV2> {
  const env: Env = { DL_ENABLED: "true" };

  // --------------------------------------------------
  // Authority
  // --------------------------------------------------

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
  // Reality
  // --------------------------------------------------

  const reality = buildReality({
    orders: (req as any).orders ?? [],
    inventory: (req as any).inventory ?? [],
    movements: (req as any).movements ?? [],
    movord: (req as any).movord ?? [],
    movmag: (req as any).movmag ?? [],
    masterBom: (req as any).masterBom ?? [],
  });

  const twin = reality.twinSnapshot;

  // --------------------------------------------------
  // Deterministic evidence
  // --------------------------------------------------

  const dlResult = await computeDlEvidenceV2(env, {
    horizonDays: 30,
    baselineMetrics: req.baseline_metrics as Record<string, unknown>,
    scenarioMetrics: undefined,
    movord: (req as any).movord ?? [],
    movmag: (req as any).movmag ?? [],
  });

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
    orders: twin.orders,
    inventory: twin.inventory,
    movements: (req as any).movements ?? [],
    inferredBom: twin.bom,
  });

  const topologyConfidence = computeTopologyConfidence({
    nodes: topology.nodes,
    edges: topology.edges,
  });

  // --------------------------------------------------
  // Cockpit signals only
  // --------------------------------------------------

  const { signals } = buildUiSignalsV1({
    dl: dlEvidence,
    dataset_descriptor: req.dataset_descriptor,
  });

  // --------------------------------------------------
  // BOM divergence detection
  // - detect conflict
  // - do not auto-decide
  // - optionally consume explicit SCM choice if provided
  // --------------------------------------------------

  let advisory: ScenarioAdvisoryV2 | undefined;

  const fusion = (reality as any).fusion;
  const needsBomDecision = Boolean(fusion?.needs_bom_reference_decision);

  const requestedBomReference =
    (req as any).bom_reference ??
    (req as any).selected_bom_reference ??
    undefined;

  const bomReferenceDecision = requestedBomReference
    ? createBomReferenceDecision({
        company_id: (req as any).company_id,
        selected_reference: requestedBomReference,
        decided_by: (req as any).actor_id,
        reason: "Explicit SCM selection received in sandbox request.",
      })
    : undefined;

  if (needsBomDecision && !bomReferenceDecision) {
    advisory = {
      one_liner:
        "BOM divergence detected between design, planned production, and actual production.",
      labels: ["BOM_DIVERGENCE", "SCM_DECISION_REQUIRED"],
      key_signals: fusion?.signals ?? ["bom_reference_decision_required"],
      questions: [
        "Which BOM should PlannerAgent use for optimization?",
        "Options: MASTER / PLAN / REALITY",
      ],
    };
  }

  // --------------------------------------------------
  // Vision mode
  // --------------------------------------------------

  if (req.plan === "VISION") {
    const vision = buildVisionAdvisory(dlEvidence, dlResult.health);

    return {
      ok: true,
      request_id: req.request_id,
      plan: req.plan,
      intent: req.intent,
      domain: req.domain,
      signals,
      scenarios: [],
      advisory: advisory ?? vision,
      governance: {
        execution_allowed: false,
        reason: "OBSERVATION_ONLY",
      },
      issued_at: new Date().toISOString(),
    };
  }

  // --------------------------------------------------
  // Optimizer
  // Note:
  // - if BOM conflict exists and SCM did not choose, optimizer still runs
  //   on PLAN twin snapshot view, but advisory makes conflict explicit
  // - responsibility for BOM selection remains human
  // --------------------------------------------------

  let optimizerOutput: any = null;

  try {
    const optimizerPlan: PlanTier =
      req.plan === "BASIC" ? "VISION" : req.plan;

    optimizerOutput = await runOptimizerV1({
      requestId: req.request_id,
      plan: optimizerPlan,
      asOf: new Date().toISOString(),

      orders: twin.orders,
      inventory: twin.inventory,
      movements: (req as any).movements ?? [],

      baseline_metrics: (req.baseline_metrics ?? {}) as Record<string, number>,
      scenario_metrics: {},
      constraints_hint: {},
      dlSignals: dlEvidence.risk_score ?? {},

      inferredBom: twin.bom,
      realitySnapshot: reality,
      operationalTopology: topology,
      topologyConfidence: topologyConfidence.confidence,
      bomReferenceDecision,
    });
  } catch {
    optimizerOutput = null;
  }

  // --------------------------------------------------
  // Advisory scenarios
  // --------------------------------------------------

  let scenarios: ScenarioV2[] = [];

  if (llmAllowed(req.plan)) {
    scenarios = await runLlmFanout(req, dlEvidence);
  }

  // --------------------------------------------------
  // Response
  // Cockpit stays state-only.
  // Explanation lives in advisory/chat.
  // --------------------------------------------------

  return {
    ok: true,
    request_id: req.request_id,
    plan: req.plan,
    intent: req.intent,
    domain: req.domain,

    signals,

    advisory,

    optimizer: optimizerOutput
      ? {
          best_score: optimizerOutput.best?.score ?? null,
          actions: optimizerOutput.best?.actions ?? [],
          candidates: optimizerOutput.candidates?.length ?? 0,
        }
      : undefined,

    scenarios,

    governance: {
      execution_allowed: executionAllowed(req.plan, req.intent),
      reason: executionAllowed(req.plan, req.intent)
        ? "DELEGATED_OR_BUDGETED_AUTHORITY"
        : "ADVISORY_ONLY",
    },

    issued_at: new Date().toISOString(),
  };
}