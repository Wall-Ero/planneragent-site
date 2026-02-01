// sandbox/apiBoundary.v2.ts
import type {
  SandboxEvaluateRequestV2,
  PlanTier,
  Intent,
  PlanningDomain
} from "./contracts.v2";

export function parseSandboxEvaluateRequestV2(
  body: any
): SandboxEvaluateRequestV2 {
  if (!body) throw new Error("EMPTY_BODY");

  const required = [
    "company_id",
    "request_id",
    "plan",
    "intent",
    "domain",
    "actor_id",
    "baseline_snapshot_id",
    "baseline_metrics",
    "snapshot"
  ];

  for (const key of required) {
    if (!(key in body)) {
      throw new Error(`MISSING_FIELD: ${key}`);
    }
  }

  return {
    company_id: String(body.company_id),
    request_id: String(body.request_id),

    plan: body.plan as PlanTier,
    intent: body.intent as Intent,
    domain: body.domain as PlanningDomain,

    actor_id: String(body.actor_id),

    baseline_snapshot_id: String(body.baseline_snapshot_id),
    baseline_metrics: body.baseline_metrics,

    snapshot: body.snapshot
  };
}