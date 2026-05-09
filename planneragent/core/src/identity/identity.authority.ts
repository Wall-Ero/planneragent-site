// core/src/identity/identity.authority.ts
// ======================================================
// PlannerAgent — Declared Authority
// Canonical Source of Truth
// ======================================================

import type {
  IdentityRole,
  IdentitySessionV1
} from "./identity.types";

import {
  enrichAuthorityConfidence
} from "./identity.confidence";

// ======================================================
// DECLARED AUTHORITY
// ======================================================

export interface DeclaredAuthorityV1 {

  authority_id: string;

  actor_id: string;

  declared_role: IdentityRole;

  declared_scope?: string[];

  declared_supervisor?: string;

  delegated_budget?: boolean;

  delegated_execution?: boolean;

  declared_at: string;
}

// ======================================================
// CREATE DECLARED AUTHORITY
// ======================================================

export function createDeclaredAuthority(
  input: {
    actor_id: string;

    declared_role: IdentityRole;

    declared_scope?: string[];

    declared_supervisor?: string;

    delegated_budget?: boolean;

    delegated_execution?: boolean;
  }
): DeclaredAuthorityV1 {

  return {
    authority_id: crypto.randomUUID(),

    actor_id: input.actor_id,

    declared_role: input.declared_role,

    declared_scope:
      input.declared_scope ?? [],

    declared_supervisor:
      input.declared_supervisor,

    delegated_budget:
      input.delegated_budget ?? false,

    delegated_execution:
      input.delegated_execution ?? false,

    declared_at:
      new Date().toISOString()
  };
}

// ======================================================
// APPLY DECLARED AUTHORITY TO SESSION
// ======================================================

export function applyDeclaredAuthority(
  session: IdentitySessionV1,
  authority: DeclaredAuthorityV1
): IdentitySessionV1 {

 return enrichAuthorityConfidence({
  ...session,

  declared_role:
    authority.declared_role,

  declared_supervisor:
    authority.declared_supervisor,

  authority_state:
    "DECLARED",

  authority_confidence: 0.4,

  governance_flags: [
    ...(session.governance_flags ?? []),

    "DECLARED_AUTHORITY"
  ]
});
}