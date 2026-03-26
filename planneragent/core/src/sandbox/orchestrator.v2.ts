// core/src/sandbox/orchestrator.v2.ts
// ======================================================
// PlannerAgent — Sandbox Orchestrator V2
// Canonical Source of Truth
// Updated with:
// - Explainer V1
// - Policy Overlay V1
// - Policy Resolver V1
// - Policy Enforcer V1
// - Decision Memory V1
// - Outcome Validator V1
// - Anomaly Guard V2
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

import { explainDecision } from "../decision/explainer/decision.explainer.v1";
import { applyPolicy } from "../decision/policy/policy.engine.v1";
import { resolvePolicy } from "../decision/policy/policy.resolver.v1";
import { applyPolicyConstraints } from "../decision/policy/policy.enforcer.v1";

import { routeActionToExecutionIntent } from "../execution/action.router";
import { executePlan } from "../execution/execution.bridge";
import { buildActionsFromRealityV2 } from "../execution/action.builder.v2";

import { persistDecisionTrace } from "../decision-memory/decision.memory.bridge";
import { D1DecisionStoreAdapter } from "../decision-memory/decision.store";
import { getDecisionHistory, recordDecision } from "../decision-memory/decision.memory";

import { validateDecisionOutcome } from "../decision/decision.outcome.validator";
import { detectDecisionAnomalyV2 } from "../decision/decision.anomaly.guard.v2";

import {
  normalizeOrders,
  normalizeInventory,
  normalizeMovements,
} from "../../datasets/dlci/adapters";

import type { DatasetDescriptor } from "./contracts.v2";

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

type GovernedCandidate = {
  id?: string;
  score: number;
  adjustedScore?: number;
  actions: any[];
  feasibleHard?: boolean;
  softViolations?: string[];
  kpis?: {
    serviceShortfall?: number;
    estimatedCost?: number;
    planChurn?: number;
    [key: string]: number | undefined;
  };
  evidence?: any;
  violations?: string[];
  [key: string]: any;
};

// ======================================================
// HELPERS
// ======================================================

function executionAllowedByPlan(plan: PlanTier, intent: string): boolean {
  if (intent !== "EXECUTE") return false;

  return plan === "JUNIOR" || plan === "SENIOR" || plan === "PRINCIPAL";
}

function llmAllowed(plan: PlanTier): boolean {
  return plan !== "CHARTER";
}

function nowIso(): string {
  return new Date().toISOString();
}

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
    return { ok: false, request_id: "unknown", reason: "MISSING_FIELD: request_id" } as any;
  }

  if (!req.company_id) {
    return { ok: false, request_id: req.request_id, reason: "MISSING_FIELD: company_id" } as any;
  }

  if (!(req as any).baseline_snapshot_id) {
    return { ok: false, request_id: req.request_id, reason: "MISSING_FIELD: baseline_snapshot_id" } as any;
  }

  if (!req.snapshot) {
    return { ok: false, request_id: req.request_id, reason: "SNAPSHOT_REQUIRED" } as any;
  }

  const auth = authoritySandboxGuard(req.snapshot);
  if (!auth.ok) {
    return { ok: false, request_id: req.request_id, reason: auth.reason } as any;
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

  const twinOrders = rawOrders;
  const twinInventory = rawInventory;
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
    return { ok: false, request_id: req.request_id, reason: "DL_LAYER_FAILED" } as any;
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

  const normalizedDatasetDescriptor: DatasetDescriptor =
  req.dataset_descriptor &&
  typeof req.dataset_descriptor === "object" &&
  "hasSnapshot" in req.dataset_descriptor &&
  "hasBehavioralEvents" in req.dataset_descriptor &&
  "hasStructuralData" in req.dataset_descriptor
    ? (req.dataset_descriptor as DatasetDescriptor)
    : {
        hasSnapshot: true,
        hasBehavioralEvents: false,
        hasStructuralData: false,
      };

const { signals } = buildUiSignalsV1({
  dl: dlEvidence,
  dataset_descriptor: normalizedDatasetDescriptor,
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
  // POLICY RESOLUTION
  // ==================================================

  const decisionHistory = getDecisionHistory();

  const effectivePolicy = resolvePolicy({
    history: decisionHistory,
  });

  // ==================================================
  // POLICY OVERLAY
  // ==================================================

  let selectedBest: GovernedCandidate | null = optimizerOutput?.best ?? null;
  let selectedCandidates: GovernedCandidate[] = optimizerOutput?.candidates ?? [];
  let policyDebug: any[] = [];

  if (optimizerOutput?.candidates?.length) {
    const policyWeightedCandidates = applyPolicy(
      optimizerOutput.candidates,
      effectivePolicy
    ) as GovernedCandidate[];

    const policyEnforced = applyPolicyConstraints(
      policyWeightedCandidates,
      {
        primary_focus: effectivePolicy.primary_focus,
        weights: effectivePolicy.weights,
        prefer_multi_action: effectivePolicy.prefer_multi_action,
        allow_single_lever: effectivePolicy.allow_single_lever,
        max_plan_churn: effectivePolicy.max_plan_churn,
        risk_profile:
          effectivePolicy.risk_profile === "CONSERVATIVE"
            ? "LOW"
            : effectivePolicy.risk_profile === "AGGRESSIVE"
            ? "HIGH"
            : "BALANCED",
      }
    );

    policyDebug = policyEnforced.debug ?? [];

    selectedCandidates = (policyEnforced.debug ?? [])
      .filter((c: any) => !c.violations?.includes("HARD_BLOCK"))
      .sort((a: any, b: any) => {
        const aScore = typeof a.adjustedScore === "number" ? a.adjustedScore : a.score;
        const bScore = typeof b.adjustedScore === "number" ? b.adjustedScore : b.score;
        return bScore - aScore;
      });

    selectedBest =
      (policyEnforced.best as GovernedCandidate | null) ??
      selectedCandidates[0] ??
      optimizerOutput.best;
  }

  // ==================================================
  // DECISION MEMORY / OUTCOME / ANOMALY
  // ==================================================

  let anomalyResult = {
    anomaly: false,
    reasons: [] as string[],
  };

  let runtimeExecutionAllowed = executionAllowedByPlan(req.plan, req.intent);
  let runtimeGovernanceReason = runtimeExecutionAllowed
    ? "DELEGATED_OR_BUDGETED_AUTHORITY"
    : "ADVISORY_ONLY";

  if (selectedBest) {
    const outcome = validateDecisionOutcome(selectedBest);

    anomalyResult = detectDecisionAnomalyV2({
      candidate: selectedBest,
      dl: {
        risk_score: dlEvidence?.risk_score?.stockout_risk,
        anomaly_signals: dlEvidence?.anomaly_signals,
      },
      topologyConfidence: topologyConfidence?.confidence,
      policy: {
        primary_focus: effectivePolicy.primary_focus,
      },
    });

    console.log("ANOMALY_INPUT_DEBUG", {
      dlEvidence,
      topologyConfidence,
    });

    if (anomalyResult.anomaly) {
      console.warn("ANOMALY_DETECTED", anomalyResult.reasons);
    }

    if (anomalyResult.anomaly && req.intent === "EXECUTE") {
      runtimeExecutionAllowed = false;
      runtimeGovernanceReason =
        `BLOCKED_BY_ANOMALY:${anomalyResult.reasons.join("|")}`;
    }

    recordDecision({
      decision_id: req.request_id,
      policy_used: effectivePolicy,
      outcome,
      anomaly: anomalyResult.anomaly,
    });
  }

  // ==================================================
  // EXPLAINER
  // ==================================================

  const explanation = selectedBest
    ? explainDecision(
        selectedBest as any,
        selectedCandidates as any
      )
    : null;

  // --------------------------------------------------
  // SEMANTIC
  // --------------------------------------------------

  const semanticActions = buildSemanticActions(
    selectedBest?.actions ?? []
  );

  // --------------------------------------------------
  // GOVERNANCE
  // --------------------------------------------------

  const governance: GovernanceResult & {
    anomaly?: boolean;
    anomaly_reasons?: string[];
  } = {
    execution_allowed: runtimeExecutionAllowed,
    reason: runtimeGovernanceReason,
    anomaly: anomalyResult.anomaly,
    anomaly_reasons: anomalyResult.reasons,
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
      best_score:
        typeof selectedBest?.adjustedScore === "number"
          ? selectedBest.adjustedScore
          : selectedBest?.score ?? null,
      actions: selectedBest?.actions ?? [],
      candidates: selectedCandidates.length ?? 0,
    },

    explanation,

    governance,

    executionAllowed: runtimeExecutionAllowed,

    policy_used: effectivePolicy,
    policy_debug: policyDebug,

    decision_trace: null,
    issued_at: nowIso(),
  } as any;
}