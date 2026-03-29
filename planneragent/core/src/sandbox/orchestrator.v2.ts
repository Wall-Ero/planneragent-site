// core/src/sandbox/orchestrator.v2.ts
// ======================================================
// PlannerAgent — Sandbox Orchestrator V2
// Canonical Source of Truth (CLEAN + COMPLETE + REALITY SCORE)
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
import { buildOperationalTopology } from "../topology/topology.builder";
import { computeTopologyConfidence } from "../topology/topology.confidence";

import { runOptimizerV1 } from "../decision/optimizer";

import { explainDecision } from "../decision/explainer/decision.explainer.v1";
import { applyPolicy } from "../decision/policy/policy.engine.v1";
import { resolvePolicy } from "../decision/policy/policy.resolver.v1";
import { applyPolicyConstraints } from "../decision/policy/policy.enforcer.v1";

import { buildActionsFromRealityV2 } from "../execution/action.builder.v2";

import {
  getDecisionHistory,
  recordDecision,
} from "../decision-memory/decision.memory";

import { validateDecisionOutcome } from "../decision/decision.outcome.validator";
import { detectDecisionAnomalyV2 } from "../decision/decision.anomaly.guard.v2";

import {
  normalizeOrders,
  normalizeInventory,
  normalizeMovements,
} from "../../datasets/dlci/adapters";

import {
  enrichAnomalyActions,
  type EnrichedAction,
} from "../decision/anomaly.action.enricher";

// ======================================================
// HELPERS
// ======================================================

function executionAllowedByPlan(plan: PlanTier, intent: string): boolean {
  if (intent !== "EXECUTE") return false;
  return plan === "JUNIOR" || plan === "SENIOR" || plan === "PRINCIPAL";
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

function deriveReasonsFromActions(actions: any[]): string[] {
  if (!actions) return [];

  const out: string[] = [];

  for (const a of actions) {
    const r = a?.reason || "";

    if (r.includes("isolated_topology")) {
      out.push("VERIFY_TOPOLOGY_NODE");
    }

    if (r.includes("topology_guided")) {
      out.push("VERIFY_TOPOLOGY_NODE");
    }

    if (r.includes("inventory")) {
      out.push("CHECK_INVENTORY_MISMATCH");
    }

    if (r.includes("demand")) {
      out.push("REVIEW_DEMAND_SPIKE");
    }
  }

  return Array.from(new Set(out));
}

function deriveRealityState(params: {
  realityScore?: number | null;
  anomaly: boolean;
  topologyConfidence?: number;
}) {
  const score =
    typeof params.realityScore === "number" ? params.realityScore : null;

  if (score !== null) {
    if (score < 0.5) return "ASSUMED";
    if (score < 0.75) return "DRIFTING";
    return params.anomaly ? "DRIFTING" : "ALIGNED";
  }

  if ((params.topologyConfidence ?? 1) < 0.5) return "ASSUMED";
  if (params.anomaly) return "DRIFTING";
  return "ALIGNED";
}

// ======================================================
// MAIN
// ======================================================

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2,
  env?: { DB?: D1Database }
): Promise<SandboxEvaluateResponseV2> {
  void env;

  // ---------------- VALIDATION ----------------

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

  const auth = authoritySandboxGuard(req.snapshot);
  if (!auth.ok) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: auth.reason,
    } as any;
  }

  // ---------------- NORMALIZATION ----------------

  const orders = normalizeOrders(req.orders ?? []);
  const inventory = normalizeInventory(req.inventory ?? []);
  const movements = normalizeMovements(req.movements ?? []);

  // ---------------- REALITY ----------------

  const reality = buildReality({
    orders,
    inventory,
    movements,
    movord: (req.movord ?? []) as any[],
    movmag: (req.movmag ?? []) as any[],
    masterBom: (req.masterBom ?? []) as any[],
  });

  const inferredBom =
    (reality as any)?.reconstructed?.inferred_bom ?? [];

  const realityScore: number | null =
    typeof (reality as any)?.reality_score === "number"
      ? (reality as any).reality_score
      : null;

  // ---------------- DL ----------------

  const dlResult = await computeDlEvidenceV2(
    { DL_ENABLED: "true" },
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

  // ---------------- TOPOLOGY ----------------

  const topology = buildOperationalTopology({
    orders,
    inventory,
    movements,
    inferredBom,
  });

  const topologyConfidence = computeTopologyConfidence({
    nodes: topology.nodes,
    edges: topology.edges,
  });

  // ---------------- SIGNALS ----------------

  const datasetDescriptor = normalizeDatasetDescriptor(req.dataset_descriptor);

  const { signals } = buildUiSignalsV1({
    dl,
    dataset_descriptor: datasetDescriptor,
  });

  // ---------------- ACTION BUILDER ----------------

  const builtActions = buildActionsFromRealityV2({
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
    topologyConfidence: topologyConfidence?.confidence ?? 0.5,
  } as any);

  // ---------------- OPTIMIZER ----------------

  let optimizerOutput: {
    best?: any;
    candidates?: any[];
  } | null = null;

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

  // ---------------- POLICY ----------------

  let history: any[] = [];

  try {
    history = getDecisionHistory();
  } catch {
    history = [];
  }

  const policy = resolvePolicy({ history });

  let selectedBest = optimizerOutput?.best ?? null;
  let selectedCandidates = optimizerOutput?.candidates ?? [];
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

    selectedCandidates = policyDebug
      .filter((c: any) => !c.violations?.includes("HARD_BLOCK"))
      .sort(
        (a: any, b: any) =>
          (b.adjustedScore ?? b.score) - (a.adjustedScore ?? a.score)
      );

    selectedBest =
      enforced.best ?? selectedCandidates[0] ?? optimizerOutput.best;
  }

  // ---------------- ANOMALY → ACTION ----------------

  let anomaly = false;
  let anomalyReasons: string[] = [];
  let requiredActions: EnrichedAction[] = [];

  let executionAllowed = false;
  let governanceReason = "ADVISORY_ONLY";

  if (selectedBest) {
    const outcome = validateDecisionOutcome(selectedBest);

    const anomalyResult = detectDecisionAnomalyV2({
      candidate: selectedBest,
      dl: {
        risk_score: dl?.risk_score?.stockout_risk,
        anomaly_signals: dl?.anomaly_signals,
      },
      topologyConfidence: topologyConfidence?.confidence,
      policy: {
        primary_focus: policy.primary_focus,
      },
    });

    anomaly = anomalyResult.anomaly;

    // STEP 1 — base reasons (DL / anomaly guard)
    anomalyReasons = (anomalyResult.reasons ?? []).map((r: string) => {
      if (r.includes("topology")) return "VERIFY_TOPOLOGY_NODE";
      if (r.includes("inventory")) return "CHECK_INVENTORY_MISMATCH";
      if (r.includes("demand")) return "REVIEW_DEMAND_SPIKE";
      return r;
    });

    // STEP 2 — enrich from builder actions
    if (selectedBest?.actions?.length) {
      const actionReasons = selectedBest.actions
        .map((a: any) => a.reason)
        .filter((r: string) => typeof r === "string");

      for (const r of actionReasons) {
        if (r.includes("isolated_topology")) {
          anomalyReasons.push("VERIFY_TOPOLOGY_NODE");
        }

        if (r.includes("topology_guided")) {
          anomalyReasons.push("VERIFY_TOPOLOGY_NODE");
        }

        if (r.includes("inventory_mismatch")) {
          anomalyReasons.push("CHECK_INVENTORY_MISMATCH");
        }

        if (r.includes("demand_spike")) {
          anomalyReasons.push("REVIEW_DEMAND_SPIKE");
        }
      }
    }

    // STEP 3 — dedupe
    anomalyReasons = Array.from(new Set(anomalyReasons));

    // STEP 4 — required actions
    if (anomaly) {
      if (anomalyReasons.length === 0) {
        anomalyReasons = deriveReasonsFromActions(selectedBest.actions);
      }

      requiredActions = enrichAnomalyActions(anomalyReasons);
    }

    // STEP 5 — governance decision
    const weakReality =
      typeof realityScore === "number" && realityScore < 0.5;

    if (anomaly || weakReality) {
      if (weakReality && !anomalyReasons.includes("LOW_REALITY_SCORE")) {
        anomalyReasons.push("LOW_REALITY_SCORE");
      }

      if (
        weakReality &&
        !requiredActions.some((x) => x.action === "LOW_REALITY_SCORE")
      ) {
        requiredActions.push({
          action: "LOW_REALITY_SCORE",
          priority: "HIGH",
          blocking: true,
          effort: "MEDIUM",
        });
      }

      if (req.intent === "EXECUTE") {
        executionAllowed = false;
        governanceReason = anomaly
          ? "BLOCKED_BY_ANOMALY"
          : "BLOCKED_BY_LOW_REALITY_SCORE";
      }
    } else {
      executionAllowed = executionAllowedByPlan(req.plan, req.intent);
      governanceReason = executionAllowed
        ? "DELEGATED_OR_BUDGETED_AUTHORITY"
        : "ADVISORY_ONLY";
    }

    // STEP 6 — decision memory
    recordDecision({
      decision_id: req.request_id,
      policy_used: policy,
      outcome,
      anomaly,
    });
  }

  // ---------------- SIGNAL FINALIZATION ----------------

  if (signals && typeof signals === "object") {
    (signals as any).reality = deriveRealityState({
      realityScore,
      anomaly,
      topologyConfidence: topologyConfidence?.confidence,
    });
  }

  // ---------------- EXPLAINER ----------------

  const explanation = selectedBest
    ? explainDecision(selectedBest as any, selectedCandidates as any, {
        anomaly,
        anomalyReasons,
        requiredActions,
      })
    : null;

  // ---------------- GOVERNANCE ----------------

  const governance: GovernanceResult & {
    anomaly?: boolean;
    anomaly_reasons?: string[];
    required_actions?: EnrichedAction[];
    reality_score?: number | null;
  } = {
    execution_allowed: executionAllowed,
    reason: governanceReason,
    anomaly,
    anomaly_reasons: anomalyReasons,
    required_actions: requiredActions,
    reality_score: realityScore,
  };

  // ---------------- RESPONSE ----------------

  return {
    ok: true,
    request_id: req.request_id,
    plan: req.plan,
    intent: req.intent,
    domain: req.domain,
    signals,
    optimizer: {
      best_score: selectedBest?.adjustedScore ?? selectedBest?.score ?? null,
      actions: selectedBest?.actions ?? [],
      candidates: selectedCandidates.length ?? 0,
    },
    explanation,
    governance,
    policy_used: policy,
    policy_debug: policyDebug,
    decision_trace: null,
    issued_at: nowIso(),
  } as any;
}