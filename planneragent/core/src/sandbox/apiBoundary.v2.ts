import {
  SandboxEvaluateRequestV2,
  PlanTier,
  PlanningDomain,
} from "./contracts.v2";

/* ===============================
 * Allowed enums (API contract)
 * =============================== */

const PLAN_TIERS: PlanTier[] = ["BASIC", "JUNIOR", "SENIOR"];

const PLANNING_DOMAINS: PlanningDomain[] = [
  "supply_chain",
  "production",
  "logistics",
];

/* ===============================
 * Type guards
 * =============================== */

function isPlanTier(x: any): x is PlanTier {
  return PLAN_TIERS.includes(x);
}

function isPlanningDomain(x: any): x is PlanningDomain {
  return PLANNING_DOMAINS.includes(x);
}

/* ===============================
 * Helpers
 * =============================== */

function pickString(...values: any[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string") return v;
  }
  return undefined;
}

function pickObject(...values: any[]): Record<string, any> | undefined {
  for (const v of values) {
    if (typeof v === "object" && v !== null) return v;
  }
  return undefined;
}

/* ===============================
 * Public API parser (V2 Canonical)
 * =============================== */

export function parseSandboxEvaluateRequestV2(
  body: unknown
): SandboxEvaluateRequestV2 {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid request body");
  }

  const b = body as Record<string, any>;

  const identity = pickObject(b.identity, b);
  const snapshot = pickObject(b.snapshot, b);

  /* ===============================
   * Identity / routing
   * =============================== */

  const company_id = pickString(
    identity?.company_id,
    identity?.companyId,
    b.company_id,
    b.companyId
  );

  if (!company_id) {
    throw new Error("company_id must be a string");
  }

  const plan = pickString(identity?.plan, b.plan);

  if (!isPlanTier(plan)) {
    throw new Error(`Invalid plan tier: ${plan}`);
  }

  const domainRaw = pickString(identity?.domain, b.domain);

  const domain: PlanningDomain = isPlanningDomain(domainRaw)
    ? domainRaw
    : "supply_chain";

  /* ===============================
   * Snapshot
   * =============================== */

  const baseline_snapshot_id = pickString(
    snapshot?.baseline_snapshot_id,
    snapshot?.baselineSnapshotId,
    b.baseline_snapshot_id,
    b.baselineSnapshotId
  );

  if (!baseline_snapshot_id) {
    throw new Error("baseline_snapshot_id must be a string");
  }

  /* ===============================
   * Optional scenario input
   * =============================== */

  const intent =
    typeof b.intent === "string"
      ? b.intent
      : "scenario_exploration";

  const baseline_metrics =
    typeof b.baseline_metrics === "object" && b.baseline_metrics !== null
      ? b.baseline_metrics
      : {};

  const scenario_metrics =
    typeof b.scenario_metrics === "object" && b.scenario_metrics !== null
      ? b.scenario_metrics
      : {};

  /* ===============================
   * Optional hints
   * =============================== */

  const constraints_hint =
    typeof b.constraints_hint === "object" && b.constraints_hint !== null
      ? b.constraints_hint
      : {};

  /* ===============================
   * Requested options
   * =============================== */

  const requested = {
    n_scenarios:
      typeof b.requested?.n_scenarios === "number"
        ? b.requested.n_scenarios
        : 3,
    horizon_days:
      typeof b.requested?.horizon_days === "number"
        ? b.requested.horizon_days
        : 21,
  };

  /* ===============================
   * Final validated request
   * =============================== */

  return {
    company_id,
    plan,
    domain,
    baseline_snapshot_id,
    intent,

    baseline_metrics,
    scenario_metrics,

    constraints_hint,
    requested,
  };
}
