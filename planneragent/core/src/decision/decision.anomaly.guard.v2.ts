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
//   - topology confidence
//   - policy coherence
//
// Output:
// - anomaly: boolean
// - reasons: string[]
//
// IMPORTANT:
// - does NOT block decision
// - only blocks learning
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

type AnomalyInput = {
  candidate: Candidate | null;
  dl?: DlEvidence;
  topologyConfidence?: number;
  policy?: {
    primary_focus?: "SERVICE" | "COST" | "STABILITY";
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
  const topologyConfidence = input.topologyConfidence;
  const policy = input.policy ?? {};

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
  // RULE 9 — POLICY COHERENCE (SERVICE)
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
    reasons
  };
}