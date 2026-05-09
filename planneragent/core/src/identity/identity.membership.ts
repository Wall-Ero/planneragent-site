// core/src/identity/identity.membership.ts
// ======================================================
// PlannerAgent — Identity Membership
// Canonical Source of Truth
// ======================================================

import type {
  IdentityMembershipV1
} from "./identity.types";

export function createMembership(
  input: {
    actor_id: string;

    tenant_id: string;
    company_id: string;

    role: IdentityMembershipV1["role"];

    sponsored_by?: string;
  }
): IdentityMembershipV1 {

  return {
    membership_id: crypto.randomUUID(),

    actor_id: input.actor_id,

    tenant_id: input.tenant_id,
    company_id: input.company_id,

    role: input.role,

    status: "ACTIVE",

    sponsored_by: input.sponsored_by,

    created_at: new Date().toISOString()
  };
}