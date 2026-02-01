// governance/oag/validateOag.ts
import type { OagProof } from "./types";
import type {
  PlanTier,
  Intent,
  PlanningDomain
} from "../../sandbox/contracts.v2";

type ValidateInput = {
  company_id: string;
  actor_id: string;
  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;
};

export async function validateOagAndBuildProof(
  input: ValidateInput
): Promise<{ ok: true; proof: OagProof } | { ok: false; reason: string }> {
  const { company_id, actor_id, plan, intent, domain } = input;

  // Constitutional matrix
  const PLAN_INTENT_MATRIX: Record<PlanTier, Intent[]> = {
    VISION: ["INFORM", "WARN"],
    GRADUATE: ["INFORM", "WARN"],
    JUNIOR: ["ADVISE", "EXECUTE", "WARN"],
    SENIOR: ["ADVISE", "EXECUTE", "WARN"],
    PRINCIPAL: ["ADVISE", "EXECUTE", "WARN"],
    CHARTER: ["INFORM", "WARN"]
  };

  const allowed = PLAN_INTENT_MATRIX[plan];
  if (!allowed.includes(intent)) {
    return {
      ok: false,
      reason: `INTENT_NOT_ALLOWED_FOR_PLAN: ${plan} -> ${intent}`
    };
  }

  const proof: OagProof = {
    company_id,
    actor_id,
    plan,
    domain,
    intent,
    issued_at: new Date().toISOString(),
    authority: "human"
  };

  return { ok: true, proof };
}