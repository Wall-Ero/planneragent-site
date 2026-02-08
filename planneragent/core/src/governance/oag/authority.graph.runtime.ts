// core/src/governance/oag/authority.graph.runtime.ts
// ======================================================
// OAG Runtime — Validate + Resolve Authority v1
// Canonical Source of Truth
// ======================================================

import type { Intent, PlanTier, PlanningDomain, OagProof } from "../../sandbox/contracts.v2";
import { buildOagProof, validateOagGraph, type OagGraph } from "../authority.graph";

// Constitutional matrix (plan → allowed intents)
export const PLAN_INTENT_MATRIX: Record<PlanTier, Intent[]> = {
  VISION: ["INFORM", "WARN"],
  GRADUATE: ["INFORM", "WARN"],
  JUNIOR: ["ADVISE", "EXECUTE", "WARN"],
  SENIOR: ["ADVISE", "EXECUTE", "WARN"],
  PRINCIPAL: ["ADVISE", "EXECUTE", "WARN"],
  CHARTER: ["INFORM", "WARN"]
};

export type ResolveAuthorityInput = {
  company_id: string;
  actor_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  now_iso?: string;
};

export type ResolveAuthorityOk = {
  ok: true;
  proof: OagProof;
};

export type ResolveAuthorityFail = {
  ok: false;
  reason: string;
};

export function resolveAuthorityFromGraph(
  graph: OagGraph,
  input: ResolveAuthorityInput
): ResolveAuthorityOk | ResolveAuthorityFail {
  const nowIso = input.now_iso ?? new Date().toISOString();

  // 0) graph validation (self-delegation, expired, unknown actors, etc.)
  const v = validateOagGraph(graph, nowIso);
  if (!v.ok) {
    return { ok: false, reason: `OAG_INVALID: ${v.errors[0]?.code ?? "UNKNOWN"}` };
  }

  // 1) constitutional matrix check (plan → intent)
  const allowedIntents = PLAN_INTENT_MATRIX[input.plan];
  if (!allowedIntents.includes(input.intent)) {
    return {
      ok: false,
      reason: `INTENT_NOT_ALLOWED_FOR_PLAN: ${input.plan} -> ${input.intent}`
    };
  }

  // 2) authority check: must be delegated in graph OR be “board” actor (bootstrap)
  const actor = (graph.actors ?? []).find(a => a.actor_id === input.actor_id);
  if (!actor) return { ok: false, reason: "ACTOR_NOT_FOUND" };

  // Board bootstrap: board actor can mint “board” authority in its own company scope (pre-SRL demo)
  if (actor.type === "board") {
    return {
      ok: true,
      proof: buildOagProof({
        company_id: input.company_id,
        actor_id: input.actor_id,
        plan: input.plan,
        domain: input.domain,
        intent: input.intent,
        sponsor_id: undefined,
        authority: "board",
        issued_at: nowIso
      })
    };
  }

  // Otherwise: must exist a delegation *to* actor matching (plan, domain, intent)
  const del = (graph.delegations ?? []).find(d => {
    if (d.company_id !== input.company_id) return false;
    if (d.to_actor_id !== input.actor_id) return false;
    if (d.plan !== input.plan) return false;
    if (d.domain !== input.domain) return false;
    if (!d.intents.includes(input.intent)) return false;
    if (d.expires_at && d.expires_at <= nowIso) return false;
    return true;
  });

  if (!del) {
    return { ok: false, reason: "OAG_NO_MATCHING_DELEGATION" };
  }

  return {
    ok: true,
    proof: buildOagProof({
      company_id: input.company_id,
      actor_id: input.actor_id,
      plan: input.plan,
      domain: input.domain,
      intent: input.intent,
      sponsor_id: del.sponsor_id ?? del.from_actor_id,
      authority: "human",
      issued_at: nowIso
    })
  };
}