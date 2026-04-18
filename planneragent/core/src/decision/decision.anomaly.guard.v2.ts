// core/src/decision/decision.anomaly.guard.v2.ts
// ======================================================
// PlannerAgent — Decision Anomaly Guard V2
// Canonical Source of Truth
//
// Purpose
// - detect systemic anomalies before learning
// - combine:
//   - KPI sanity
//   - DL signals
//   - topology structure (NEW)
//   - topology confidence
//   - policy coherence
//
// Output:
// - anomaly: boolean
// - reasons: string[]
//
// IMPORTANT:
// - does NOT block decision
// - only blocks learning / affects governance downstream
// ======================================================

type CandidateKpis = {
  serviceShortfall?: number;
  shortageUnits?: number;
  estimatedCost?: number;
  planChurn?: number;
  [key: string]: number | undefined;
};

type Candidate = {
  actions?: any[];
  kpis?: CandidateKpis;
  violations?: string[];
};

type DlEvidence = {
  risk_score?: number;
  anomaly_signals?: string[];
};

// 🔥 NEW — TOPOLOGY STRUCTURE (multi-layer aware)
type TopologyComparison = {
  bomDrift?: boolean;
  orderBomDrift?: boolean;
  missingConsumption?: boolean;
  unexpectedConsumption?: boolean;
  alignmentScore?: number;
};

type TopologyInput = {
  confidence?: number;
  comparison?: TopologyComparison;
};

type AnomalyInput = {
  candidate: Candidate | null;
  dl?: DlEvidence;

  // 🔥 legacy support (still accepted)
  topologyConfidence?: number;

  // 🔥 NEW STRUCTURED TOPOLOGY
  topology?: TopologyInput;

  policy?: {
    primary_focus?: "SERVICE" | "COST" | "STABILITY";
    risk_profile?: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
  };
};

type AnomalyResult = {
  anomaly: boolean;
  reasons: string[];
};

export function detectDecisionAnomalyV2(
  input: AnomalyInput
): AnomalyResult {

  const reasons: string[] = [];

  const candidate = input.candidate;
  const dl = input.dl ?? {};
  const policy = input.policy ?? {};

  const topologyConfidence =
    input.topology?.confidence ?? input.topologyConfidence;

  const topologyComparison =
    input.topology?.comparison ?? {};

  if (!candidate) {
    return {
      anomaly: true,
      reasons: ["NO_CANDIDATE"]
    };
  }

  const kpis = candidate.kpis ?? {};
  const actions = candidate.actions ?? [];

  // ==================================================
  // RULE 1 — NO ACTION
  // ==================================================

  if (actions.length === 0) {
    reasons.push("NO_ACTIONS");
  }

  // ==================================================
  // RULE 2 — EXTREME PLAN CHURN
  // ==================================================

  if (typeof kpis.planChurn === "number" && kpis.planChurn > 10) {
    reasons.push("EXTREME_PLAN_CHURN");
  }

  // ==================================================
  // RULE 3 — COST OUTLIER
  // ==================================================

  if (typeof kpis.estimatedCost === "number" && kpis.estimatedCost > 1000) {
    reasons.push("COST_OUTLIER");
  }

  // ==================================================
  // RULE 4 — TOO MANY ACTIONS
  // ==================================================

  if (actions.length > 10) {
    reasons.push("TOO_MANY_ACTIONS");
  }

  // ==================================================
  // RULE 5 — KPI INCONSISTENCY
  // ==================================================

  if (
    typeof kpis.shortageUnits === "number" &&
    typeof kpis.serviceShortfall === "number" &&
    kpis.shortageUnits === 0 &&
    kpis.serviceShortfall > 0
  ) {
    reasons.push("KPI_INCONSISTENT");
  }

  // ==================================================
  // RULE 6 — DL ANOMALY SIGNALS
  // ==================================================

  if (
    Array.isArray(dl.anomaly_signals) &&
    dl.anomaly_signals.length > 0
  ) {
    reasons.push("DL_SIGNAL_ANOMALY");
  }

  // ==================================================
  // RULE 7 — HIGH RISK SCORE
  // ==================================================

  if (typeof dl.risk_score === "number" && dl.risk_score > 0.9) {
    reasons.push("HIGH_SYSTEM_RISK");
  }

  // ==================================================
  // RULE 8 — LOW TOPOLOGY CONFIDENCE
  // ==================================================

  if (typeof topologyConfidence === "number" && topologyConfidence < 0.4) {
    reasons.push("LOW_TOPOLOGY_CONFIDENCE");
  }

  // ==================================================
  // 🔥 RULE 9 — TOPOLOGY STRUCTURAL ANOMALIES (NEW CORE)
  // ==================================================

  // BOM drift → struttura cambiata rispetto a ERP
  if (topologyComparison.bomDrift) {
    reasons.push("BOM_DRIFT");
  }

  // ordini basati su BOM vecchia
  if (topologyComparison.orderBomDrift) {
    reasons.push("ORDER_BOM_OUTDATED");
  }

  // mancano consumi attesi
  if (topologyComparison.missingConsumption) {
    reasons.push("MISSING_CONSUMPTION_FLOW");
  }

  // consumi inattesi
  if (topologyComparison.unexpectedConsumption) {
    reasons.push("UNEXPECTED_CONSUMPTION_FLOW");
  }

  // disallineamento generale
  if (
    typeof topologyComparison.alignmentScore === "number" &&
    topologyComparison.alignmentScore < 0.6
  ) {
    reasons.push("LOW_TOPOLOGY_ALIGNMENT");
  }

  // ==================================================
  // 🔥 RULE 10 — POLICY × TOPOLOGY (CRITICAL)
  // ==================================================

  if (
    topologyComparison.bomDrift &&
    policy.risk_profile === "CONSERVATIVE"
  ) {
    reasons.push("TOPOLOGY_UNSAFE_FOR_EXECUTION");
  }

  // ==================================================
  // RULE 11 — POLICY COHERENCE (SERVICE)
  // ==================================================

  if (policy.primary_focus === "SERVICE") {
    if (typeof kpis.serviceShortfall === "number" && kpis.serviceShortfall > 0) {
      reasons.push("POLICY_SERVICE_VIOLATION");
    }
  }

  // ==================================================
  // FINAL
  // ==================================================

  return {
    anomaly: reasons.length > 0,
    reasons: Array.from(new Set(reasons)), // dedupe safety
  };
}