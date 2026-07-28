// Explicit disposition of ambiguous legacy contracts.
// No legacy contract is silently redefined or treated as authoritative.

import type {
  IdentityMembershipV1,
  IdentityRole,
  IdentitySessionV1,
} from "../../identity/identity.types";
import type { OagActor, OagGraph } from "../../governance/authority.graph";
import type { PrincipalResponseV1 } from "../../governance/principal.contract.v1";

export const LEGACY_OPERATIONAL_IDENTITY_DISPOSITION_V1 = Object.freeze({
  IdentityRole: "SUPERSEDED_AMBIGUOUS_ROLE",
  IdentitySessionV1: "SUPERSEDED_NON_AUTHORITATIVE_SESSION_CLAIM",
  IdentityMembershipV1: "SUPERSEDED_NON_GOVERNED_MEMBERSHIP",
  LegacyMembershipConstructor: "DEPRECATED_SELF_ACTIVATING_PROTOTYPE",
  AuthorityConfidenceTypes: "ISOLATED_INFORMATIONAL_SIGNAL_ONLY",
  OagActor: "PRESERVED_LEGACY_GRAPH_ACTOR",
  OagGraph: "PRESERVED_BEHIND_FUTURE_EXPLICIT_ADAPTER",
  PrincipalResponseV1: "PRESERVED_PRINCIPAL_PRODUCT_TIER_NOT_IDENTITY",
} as const);

export interface LegacyIdentitySessionClaimV1 {
  readonly source: "LEGACY_IDENTITY_SESSION_V1";
  readonly authenticated_claim: boolean;
  readonly actor_id_claim?: string;
  readonly tenant_id_claim?: string;
  readonly company_id_claim?: string;
  readonly role_claim?: IdentityRole;
  readonly authoritative: false;
}

export function isolateLegacyIdentitySession(
  session: IdentitySessionV1,
): LegacyIdentitySessionClaimV1 {
  return Object.freeze({
    source: "LEGACY_IDENTITY_SESSION_V1",
    authenticated_claim: session.authenticated,
    actor_id_claim: session.actor_id,
    tenant_id_claim: session.tenant_id,
    company_id_claim: session.company_id,
    role_claim: session.declared_role,
    authoritative: false,
  });
}

// Compile-time checks keep the legacy meanings visible without making them
// aliases of the new operational identity contracts.
export type LegacyContractInventoryV1 = Readonly<{
  session: IdentitySessionV1;
  membership: IdentityMembershipV1;
  graphActor: OagActor;
  graph: OagGraph;
  principalTierDecision: PrincipalResponseV1;
}>;
