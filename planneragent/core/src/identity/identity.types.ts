// core/src/identity/identity.types.ts
// ======================================================
// PlannerAgent — Identity Types
// Canonical Source of Truth
// ======================================================

export type IdentityId = string;

export type IdentityRole =
  | "ANONYMOUS"
  | "OBSERVER"
  | "PLANNER"
  | "MANAGER"
  | "DIRECTOR"
  | "EXECUTIVE"
  | "ADMIN";

export type IdentityAuthorityState =
  | "UNDECLARED"
  | "DECLARED"
  | "PARTIALLY_VALIDATED"
  | "VALIDATED";

  export type OrganizationalAuthorityConfidence =
  | "NONE"
  | "LOW"
  | "PARTIAL"
  | "HIGH"
  | "TRUSTED";

  export type IdentitySessionMode =
  | "PUBLIC"
  | "OBSERVE"
  | "GOVERN_AI"
  | "ADVISORY"
  | "DELEGATED"
  | "CONSTITUTIONAL";

export type IdentityMembershipStatus =
  | "INVITED"
  | "ACTIVE"
  | "SUSPENDED"
  | "REMOVED";

export interface IdentitySessionV1 {
  session_id: string;

  actor_id?: string;

  tenant_id?: string;
  company_id?: string;

  authenticated: boolean;

  declared_role?: IdentityRole;

  authority_state: IdentityAuthorityState;

  authority_confidence: number;

  declared_supervisor?: string;

  governance_flags?: string[];

  created_at: string;
  mode: IdentitySessionMode;

  runtime_capabilities?: string[];

  organizational_confidence?:
  OrganizationalAuthorityConfidence;

  authority_signals?: string[];
}

export interface IdentityMembershipV1 {
  membership_id: string;

  actor_id: string;

  tenant_id: string;
  company_id: string;

  role: IdentityRole;

  status: IdentityMembershipStatus;

  sponsored_by?: string;

  created_at: string;
}