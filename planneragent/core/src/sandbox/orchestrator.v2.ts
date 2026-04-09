// core/src/sandbox/orchestrator.v2.ts
// ======================================================
// PlannerAgent — Sandbox Orchestrator V2
// Canonical Source of Truth
// CLEAN + STABLE + TOPOLOGY + CORRECTION EFFECT + AUTO-HEAL GOVERNANCE
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

import { runOptimizerV1 } from "../decision/optimizer";

import { explainDecision } from "../decision/explainer/decision.explainer.v1";
import { applyPolicy } from "../decision/policy/policy.engine.v1";
import { resolvePolicy } from "../decision/policy/policy.resolver.v1";
import { applyPolicyConstraints } from "../decision/policy/policy.enforcer.v1";

import { buildActionsFromRealityV2 } from "../execution/action.builder.v2";
import { mapActionToExecutionIntent } from "../execution/execution.bridge.v1";
import { executeRuntimeV1 } from "../executor/executor.runtime.v1";

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

// ======================================================
// TYPES / CONSTANTS
// ======================================================

type CorrectionEffect = "FULL" | "PARTIAL" | "NONE";

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

// ======================================================
// MAIN
// ======================================================

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2,
  env?: { DB?: D1Database; DL_ENABLED?: string; RESEND_API_KEY?: string }
): Promise<SandboxEvaluateResponseV2> {
  void env;

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

  const auth = authoritySandboxGuard(req.snapshot);
  if (!auth.ok) {
    return {
      ok: false,
      request_id: req.request_id,
      reason: auth.reason,
    } as any;
  }

  // ----------------------------------------------------
  // NORMALIZATION
  // ----------------------------------------------------

  const orders = normalizeOrders(req.orders ?? []);
  const movements = normalizeMovements(req.movements ?? []);
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
    movements
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

  const inferredBom =
    (reality as any)?.reconstructed?.inferred_bom?.length
      ? (reality as any).reconstructed.inferred_bom
      : ((req.masterBom ?? []) as any[]);

  // ----------------------------------------------------
  // EXPECTED CONSUMPTION
  // ----------------------------------------------------

  const expectedConsumption = computeExpectedConsumption(
    orders,
    inferredBom
  );

  console.log("EXPECTED_CONSUMPTION", expectedConsumption);

  // ----------------------------------------------------
  // EXECUTION GAP
  // ----------------------------------------------------

  const executionGap = computeExecutionGap(
    expectedConsumption,
    movements
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

  let simulatedInventory = inventory;

  if (correction.actions?.length) {
    const simulation = simulateCorrectionsOnInventory(
      inventory,
      correction.actions
    );

    simulatedInventory = simulation.simulatedInventory;

    console.log("SIMULATED_INVENTORY", simulatedInventory);
  }

  const postCorrectionReconciliation = reconcileInventory(
    normalizedInventory,
    simulatedInventory
  );

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

  // ----------------------------------------------------
  // TOPOLOGY
  // ----------------------------------------------------

  const topology = buildOperationalTopology({
    orders,
    inventory,
    movements,
    movmag: (req.movmag ?? []) as any[],
    inferredBom,
  });

  const topologyEvidence = buildTopologyEvidenceFromTopology(topology);
  const topologyConfidence = topologyEvidence.topologyConfidence ?? 0.5;

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
    topologyConfidence,
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
      } as any);
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

  // ----------------------------------------------------
  // ANOMALY + GOVERNANCE
  // ----------------------------------------------------

  let anomaly = false;
  let anomalyReasons: string[] = [];
  let requiredActions: EnrichedAction[] = [];

  let executionAllowed = false;
  let governanceReason = "ADVISORY_ONLY";

  if (selectedBest) {
    const hasInventoryBlocking =
      correction.actions?.some((a) => a.blocking) ?? false;

    const hasExecutionGap =
      executionGap.some((g) => g.type !== "OK");

    if (hasExecutionGap) {
      anomaly = true;
      anomalyReasons = Array.from(
        new Set([...anomalyReasons, "EXECUTION_MISMATCH"])
      );
    }

    const outcome = validateDecisionOutcome(selectedBest);

    const anomalyResult = detectDecisionAnomalyV2({
      candidate: selectedBest,
      dl: {
        risk_score: dl?.risk_score?.stockout_risk,
        anomaly_signals: dl?.anomaly_signals,
      },
      topologyConfidence,
      policy: {
        primary_focus: policy.primary_focus,
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
      const correctionEnriched: EnrichedAction[] = correction.actions.map((a) => {
        const priority: "HIGH" | "MEDIUM" | "LOW" =
          a.blocking ? "HIGH" : "MEDIUM";

        return {
          action: a.action,
          priority,
          blocking: a.blocking,
          effort: "MEDIUM",
        };
      });

      requiredActions = [
        ...requiredActions,
        ...correctionEnriched,
      ];
    }

    requiredActions = dedupeRequiredActions(requiredActions);

    const weakReality =
      typeof realityScore === "number" && realityScore < 0.5;

    const criticalAnomaly = hasCriticalAnomaly(anomalyReasons);
    const runtimeExecutablePlanActions =
      hasRuntimeExecutablePlanActions(selectedBest);

    // --------------------------------------------------
    // AUTO-HEAL GOVERNANCE
    // --------------------------------------------------
    //
    // JUNIOR:
    // - correction enters governance and can resolve/block the issue
    // - execution still depends on explicit EXECUTE mode + runtime-executable plan actions
    //
    // SENIOR / PRINCIPAL:
    // - if correctionEffect === FULL and there are no critical blockers,
    //   the issue is considered healed at governance level
    // - real auto-execution of correction actions still requires runtime bridge support
    // --------------------------------------------------

    if (hasInventoryBlocking && correctionEffect === "NONE") {
      executionAllowed = false;
      governanceReason = "BLOCKED_BY_INVENTORY_MISMATCH";

    } else if (criticalAnomaly) {
      executionAllowed = false;
      governanceReason = "BLOCKED_BY_SYSTEM_UNCERTAINTY";

    } else if (weakReality && correctionEffect === "NONE") {
      executionAllowed = false;
      governanceReason = "BLOCKED_BY_LOW_REALITY_SCORE";

    } else if (correctionEffect === "FULL") {
      const basePlanExecutionAllowed =
        executionAllowedByPlan(req.plan, req.intent);

      // Technical note:
      // correction actions are already simulated/governed here,
      // but runtime auto-execution currently exists only for selectedBest.actions
      executionAllowed =
        basePlanExecutionAllowed && runtimeExecutablePlanActions;

      if (req.plan === "SENIOR" || req.plan === "PRINCIPAL") {
        governanceReason = executionAllowed
          ? "AUTO_HEALED_EXECUTION"
          : "AUTO_HEALED_RUNTIME_PENDING";
      } else {
        governanceReason = executionAllowed
          ? "CORRECTION_RESOLVED_APPROVED_EXECUTION"
          : "CORRECTION_RESOLVED_RUNTIME_PENDING";
      }

    } else if (correctionEffect === "PARTIAL") {
      executionAllowed = false;
      governanceReason = "EXECUTION_WITH_WARNINGS";

    } else {
      executionAllowed = executionAllowedByPlan(req.plan, req.intent);
      governanceReason = executionAllowed
        ? "DELEGATED_OR_BUDGETED_AUTHORITY"
        : "ADVISORY_ONLY";
    }

    recordDecision({
      decision_id: req.request_id,
      policy_used: policy,
      outcome,
      anomaly,
    });
  }

  // ----------------------------------------------------
  // SIGNAL FINALIZATION
  // ----------------------------------------------------

  if (signals && typeof signals === "object") {
    (signals as any).reality = deriveRealityState({
      realityScore,
      anomaly,
      topologyConfidence,
    });

    (signals as any).correction_effect = correctionEffect;
  }

  // ----------------------------------------------------
  // EXPLAINER
  // ----------------------------------------------------

  const explanation = selectedBest
    ? explainDecision(selectedBest as any, selectedCandidates as any, {
        anomaly,
        anomalyReasons,
        requiredActions,
        correctionEffect,
      })
    : null;

  // ----------------------------------------------------
  // EXECUTION
  // ----------------------------------------------------

  let execution: {
    intents: any[];
    results: any[];
    trace: any[];
  } | null = null;

  if (executionAllowed && selectedBest?.actions?.length) {
    try {
      const intents = selectedBest.actions.map((action: any) =>
        mapActionToExecutionIntent(action, {
          tenantId: req.company_id,
          approver: req.actor_id,
        })
      );

      const runtimeResult = await executeRuntimeV1(
        {
          intents,
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

      execution = {
        intents,
        results: runtimeResult.results,
        trace: runtimeResult.trace,
      };
    } catch (err: any) {
      execution = {
        intents: [],
        results: [],
        trace: [
          {
            error: err?.message ?? "EXECUTION_INTEGRATION_FAILED",
            started_at: nowIso(),
          },
        ],
      };
    }
  }

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
  };

  // ----------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------

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
    execution,
    policy_used: policy,
    policy_debug: policyDebug,
    topology_debug: topologyEvidence,
    decision_trace: null,
    issued_at: nowIso(),
  } as any;
}