// core/src/governance/oag/authority.graph.ts
// ======================================================
// OAG — Organizational Authority Graph (Runtime Types) v1
// Canonical Source of Truth
// ======================================================

import type { PlanTier, Intent, PlanningDomain, OagProof } from "../sandbox/contracts.v2";

// -----------------------------
// Core model
// -----------------------------

export type OagActorType = "human" | "service" | "board";

export type OagActor = {
  actor_id: string;
  type: OagActorType;
  display_name?: string;
};

export type OagDelegation = {
  from_actor_id: string;
  to_actor_id: string;

  company_id: string;

  plan: PlanTier;
  domain: PlanningDomain;

  // Allowed intents for the delegate
  intents: Intent[];

  // Optional sponsor chain (who “backs” this authority)
  sponsor_id?: string;

  issued_at: string; // ISO-8601
  expires_at?: string; // ISO-8601
  issued_by?: "human" | "board" | "system";
};

export type OagGraph = {
  company_id: string;

  actors: OagActor[];
  delegations: OagDelegation[];
};

export type OagValidationError =
  | { code: "EMPTY_GRAPH"; message: string }
  | { code: "UNKNOWN_ACTOR"; message: string; actor_id: string }
  | { code: "SELF_DELEGATION"; message: string; actor_id: string }
  | { code: "EXPIRED_DELEGATION"; message: string; from_actor_id: string; to_actor_id: string }
  | { code: "INVALID_INTENTS"; message: string; from_actor_id: string; to_actor_id: string }
  | { code: "MISMATCH_COMPANY"; message: string }
  | { code: "DUPLICATE_ACTOR"; message: string; actor_id: string };

export type OagValidationResult =
  | { ok: true }
  | { ok: false; errors: OagValidationError[] };

// -----------------------------
// Validation (pure, deterministic)
// -----------------------------

export function validateOagGraph(graph: OagGraph, nowIso = new Date().toISOString()): OagValidationResult {
  if (!graph || !graph.company_id) {
    return { ok: false, errors: [{ code: "EMPTY_GRAPH", message: "Graph is empty or missing company_id" }] };
  }

  const errors: OagValidationError[] = [];

  const actorIds = new Set<string>();
  for (const a of graph.actors ?? []) {
    if (actorIds.has(a.actor_id)) {
      errors.push({ code: "DUPLICATE_ACTOR", message: "Duplicate actor_id in actors list", actor_id: a.actor_id });
    }
    actorIds.add(a.actor_id);
  }

  const hasActor = (id: string) => actorIds.has(id);

  for (const d of graph.delegations ?? []) {
    if (d.company_id !== graph.company_id) {
      errors.push({ code: "MISMATCH_COMPANY", message: "Delegation company_id does not match graph.company_id" });
    }

    if (!hasActor(d.from_actor_id)) {
      errors.push({ code: "UNKNOWN_ACTOR", message: "from_actor_id not found in actors", actor_id: d.from_actor_id });
    }
    if (!hasActor(d.to_actor_id)) {
      errors.push({ code: "UNKNOWN_ACTOR", message: "to_actor_id not found in actors", actor_id: d.to_actor_id });
    }

    if (d.from_actor_id === d.to_actor_id) {
      errors.push({ code: "SELF_DELEGATION", message: "Self-delegation is forbidden", actor_id: d.to_actor_id });
    }

    if (!d.intents || d.intents.length === 0) {
      errors.push({
        code: "INVALID_INTENTS",
        message: "Delegation must include at least one allowed intent",
        from_actor_id: d.from_actor_id,
        to_actor_id: d.to_actor_id
      });
    }

    if (d.expires_at && d.expires_at <= nowIso) {
      errors.push({
        code: "EXPIRED_DELEGATION",
        message: "Delegation is expired",
        from_actor_id: d.from_actor_id,
        to_actor_id: d.to_actor_id
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}

// -----------------------------
// Minimal proof builder helper (pure)
// -----------------------------

export function buildOagProof(input: {
  company_id: string;
  actor_id: string;
  plan: PlanTier;
  domain: PlanningDomain;
  intent: Intent;
  sponsor_id?: string;
  authority: OagProof["authority"];
  issued_at?: string;
}): OagProof {
  return {
    company_id: input.company_id,
    actor_id: input.actor_id,
    plan: input.plan,
    domain: input.domain,
    intent: input.intent,
    sponsor_id: input.sponsor_id,
    issued_at: input.issued_at ?? new Date().toISOString(),
    authority: input.authority
  };
}