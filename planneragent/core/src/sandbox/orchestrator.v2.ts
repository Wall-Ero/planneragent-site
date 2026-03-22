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
// - build ORD technical trace
// - build Decision Trace (governed)
// - persist Decision Memory (when DB available)
// - run Decision Replay against known history
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

import type { DecisionTraceV2 } from "../decision/decision.trace";

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
import { routeActionToExecutionIntent } from "../execution/action.router";

import { persistDecisionTrace } from "../decision-memory/decision.memory.bridge";
import { D1DecisionStoreAdapter } from "../decision-memory/decision.store";

import {
  normalizeOrders,
  normalizeInventory,
  normalizeMovements,
} from "../../datasets/dlci/adapters";

type OrchestratorEnv = {
  DB?: D1Database;
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

function computeShortageSummary(
  orders: Array<{ sku: string; qty: number }>,
  inventory: Array<{ sku: string; qty: number }>,
  movements: Array<{ sku: string; qty: number }>
): {
  shortageCount: number;
  shortageMap: Array<{ sku: string; shortage: number }>;
} {
  const demand = new Map<string, number>();
  const supply = new Map<string, number>();

  for (const o of orders) {
    demand.set(o.sku, (demand.get(o.sku) ?? 0) + Number(o.qty ?? 0));
  }

  for (const i of inventory) {
    supply.set(i.sku, (supply.get(i.sku) ?? 0) + Number(i.qty ?? 0));
  }

  for (const m of movements) {
    supply.set(m.sku, (supply.get(m.sku) ?? 0) + Number(m.qty ?? 0));
  }

  const shortageMap: Array<{ sku: string; shortage: number }> = [];

  for (const [sku, d] of demand.entries()) {
    const s = supply.get(sku) ?? 0;
    const shortage = Math.max(0, d - s);

    if (shortage > 0) {
      shortageMap.push({ sku, shortage });
    }
  }

  return {
    shortageCount: shortageMap.length,
    shortageMap,
  };
}

function deriveOrdExecutionLevel(plan: PlanTier): "HUMAN" | "JUNIOR" | "SENIOR" | "SYSTEM" {
  switch (plan) {
    case "JUNIOR":
      return "JUNIOR";
    case "SENIOR":
    case "PRINCIPAL":
      return "SENIOR";
    default:
      return "SYSTEM";
  }
}

function deriveOrdDecisionMode(
  plan: PlanTier,
  intent: string
): "HUMAN_APPROVED" | "DELEGATED_EXECUTION" | "OBSERVATION" {
  if (intent !== "EXECUTE") {
    return "OBSERVATION";
  }

  if (plan === "JUNIOR") {
    return "HUMAN_APPROVED";
  }

  if (plan === "SENIOR" || plan === "PRINCIPAL") {
    return "DELEGATED_EXECUTION";
  }

  return "OBSERVATION";
}

function deriveAuthorityLevel(
  plan: PlanTier
): "GRADUATE" | "JUNIOR" | "SENIOR" | "PRINCIPAL" | "CHARTER" {
  if (plan === "GRADUATE") return "GRADUATE";
  if (plan === "JUNIOR") return "JUNIOR";
  if (plan === "SENIOR") return "SENIOR";
  if (plan === "PRINCIPAL") return "PRINCIPAL";
  return "CHARTER";
}

function deriveDecisionModeForTrace(
  plan: PlanTier,
  intent: string
): "HUMAN_TOOL_USAGE" | "HUMAN_APPROVED" | "DELEGATED_EXECUTION" | "IMPROVEMENT_ALLOCATION" | "CONSTITUTIONAL_BOUNDARY" {
  if (plan === "GRADUATE") return "HUMAN_TOOL_USAGE";
  if (plan === "JUNIOR" && intent === "EXECUTE") return "HUMAN_APPROVED";
  if (plan === "SENIOR" && intent === "EXECUTE") return "DELEGATED_EXECUTION";
  if (plan === "PRINCIPAL" && intent === "EXECUTE") return "IMPROVEMENT_ALLOCATION";
  return "CONSTITUTIONAL_BOUNDARY";
}

function mapSnapshotPlanToAuthority(
  plan: string
): "VISION" | "GRADUATE" | "JUNIOR" | "SENIOR" | "PRINCIPAL" | "CHARTER" {
  if (plan === "VISION") return "VISION";
  if (plan === "GRADUATE") return "GRADUATE";
  if (plan === "JUNIOR") return "JUNIOR";
  if (plan === "SENIOR") return "SENIOR";
  if (plan === "PRINCIPAL") return "PRINCIPAL";
  return "CHARTER";
}

function mapSnapshotIntentToMode(
  intent: string
): "OBSERVATION" | "HUMAN_TOOL_USAGE" | "HUMAN_APPROVED" | "DELEGATED_EXECUTION" | "IMPROVEMENT_ALLOCATION" | "CONSTITUTIONAL_BOUNDARY" {
  if (intent === "SENSE") return "OBSERVATION";
  if (intent === "ADVISE") return "HUMAN_APPROVED";
  if (intent === "EXECUTE") return "DELEGATED_EXECUTION";
  if (intent === "GOVERN") return "IMPROVEMENT_ALLOCATION";
  return "CONSTITUTIONAL_BOUNDARY";
}

function buildHistoryTraceFromSnapshot(s: any): DecisionTraceV2 {
  const adaptedReality = adaptRealitySnapshot({
    ordersSeen: 0,
    inventorySeen: s?.baseline_metrics?.inventory_seen ?? 0,
    shortagesDetected: s?.ord?.pressure_score ?? 0,
  });

  return {
    requestId: String(s.snapshot_id),
    issuedAt: String(s.created_at),

    authority: {
      level: mapSnapshotPlanToAuthority(String(s.plan)),
      mode: mapSnapshotIntentToMode(String(s.intent)),
    },

    vision: {
      reality_snapshot: adaptedReality,
      data_quality: "MEDIUM",
      anomalies_detected:
        adaptedReality.shortagesDetected > 0 ? ["SHORTAGE_DETECTED"] : [],
    },

    junior: {
      proposed_actions: [],
      selected_action: {
        approved_by_human: String(s.intent) !== "EXECUTE",
      },
    },
  };
}

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2,
  env?: OrchestratorEnv
): Promise<SandboxEvaluateResponseV2> {
  console.log("DB_PRESENT", !!env?.DB);

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
  // Decision Memory Store (optional)
  // --------------------------------------------------

  const store = env?.DB ? new D1DecisionStoreAdapter(env.DB) : null;

  // --------------------------------------------------
  // Normalize incoming datasets
  // --------------------------------------------------

  console.log("[DEBUG] req.orders", req.orders);

  const rawOrders = normalizeSandboxOrders(req.orders ?? []);
  console.log("[DEBUG] rawOrders AFTER NORMALIZE", rawOrders);
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

 // ----------------------------------------------------------
// NORMALIZATION FROM REALITY (if available)
// ----------------------------------------------------------

let twinOrders = normalizeSandboxOrders(
  ((reality as any)?.observed?.orders ?? [])
);

let twinInventory = normalizeSandboxInventory(
  ((reality as any)?.observed?.inventory ?? [])
);

const twinMovements = rawMovements;

// ----------------------------------------------------------
// FALLBACK TO RAW INPUT (CRITICAL FIX)
// ----------------------------------------------------------

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
  // Governance
  // --------------------------------------------------

  const governance: GovernanceResult = {
    execution_allowed: executionAllowed(req.plan, req.intent),
    reason: executionAllowed(req.plan, req.intent)
      ? "DELEGATED_OR_BUDGETED_AUTHORITY"
      : "ADVISORY_ONLY",
  };

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
  // ORD Technical Trace
  // --------------------------------------------------

  const shortageSummary = computeShortageSummary(
    twinOrders as Array<{ sku: string; qty: number }>,
    twinInventory as Array<{ sku: string; qty: number }>,
    twinMovements as Array<{ sku: string; qty: number }>
  );

  const ordTrace = buildOrdDecisionTrace({
    requestId: req.request_id,

    ordersSeen: twinOrders.length,
    inventorySeen: twinInventory.length,
    shortagesDetected: shortageSummary.shortageCount,

    optimizerCandidates: optimizerOutput?.candidates?.length ?? 0,
    optimizerBestScore: optimizerOutput?.best?.score ?? 0,

    actions: (optimizerOutput?.best?.actions ?? []).map((a: any) => ({
      kind: a.kind,
      sku: a.sku,
      qty: a.qty,
    })),

    executionAllowed: governance.execution_allowed,
    governanceReason: governance.reason,

    executionLevel: deriveOrdExecutionLevel(req.plan),
    decisionMode: deriveOrdDecisionMode(req.plan, req.intent),
  });

  console.log("[ORD_TRACE]", JSON.stringify(ordTrace, null, 2));

  // --------------------------------------------------
  // Governed Decision Trace
  // --------------------------------------------------

  const decisionTrace = buildDecisionTraceFromOrd({
  ord: ordTrace,
  dl: dlEvidence,
  authorityLevel: deriveAuthorityLevel(req.plan),
  decisionMode: deriveDecisionModeForTrace(req.plan, req.intent),
});

  console.log("[DECISION_TRACE]", JSON.stringify(decisionTrace, null, 2));

  console.log(
  "[PROPOSED_ACTIONS]",
  JSON.stringify(decisionTrace.junior?.proposed_actions ?? [], null, 2)
);

  // --------------------------------------------------
  // Decision Memory Persistence (optional)
  // --------------------------------------------------

  let persistedSnapshotId: string | null = null;

  if (store) {
    const persisted = await persistDecisionTrace({
      trace: decisionTrace,
      store,
      tenant_id: req.company_id,
      company_id: req.company_id,
      context_id: req.domain,
    });

    persistedSnapshotId = persisted.snapshot_id;
    console.log("SNAPSHOT_WRITTEN", persistedSnapshotId);
  }

  // --------------------------------------------------
  // Decision Replay (real history when DB available)
  // --------------------------------------------------

  let replay: ReturnType<typeof replayDecision> | null = null;

  if (store) {
    const historySnapshots = await store.getRecentSnapshots(
      req.company_id,
      req.domain,
      20
    );

    console.log("HISTORY_SNAPSHOTS_COUNT", historySnapshots.length);

    const historyTraces: DecisionTraceV2[] = historySnapshots
      .filter((s) => s.snapshot_id !== persistedSnapshotId)
      .map((s) => buildHistoryTraceFromSnapshot(s));

    replay = replayDecision({
      current: decisionTrace,
      history: historyTraces,
      threshold: 0.5,
    });
  } else {
    replay = replayDecision({
      current: decisionTrace,
      history: [],
      threshold: 0.5,
    });
  }

  console.log("[DECISION_REPLAY]", JSON.stringify(replay, null, 2));

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

    decision_trace: decisionTrace,

    ...(replay ? { replay } : {}),

    issued_at: nowIso(),
  } as any;
}