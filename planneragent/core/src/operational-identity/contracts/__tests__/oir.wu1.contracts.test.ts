import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  AuthorizationDecisionV1,
  BaselinePlatformRoleV1,
  DurablePrincipalV1,
  EffectiveOperationalAuthorityProofV1,
  ExternalAuthenticationIdentityV1,
  GovernedUploadOperationalContextV1,
  OagActorBindingV1,
  OagActorV1,
  OrganizationMembershipV1,
  OrganizationalResponsibilityScopeV1,
  ResolvedOperationalParticipationContextV1,
  ServerSessionV1,
  SupervisorConfirmationDecisionV1,
  TenantCompanyOwnershipV1,
} from "../index";
import {
  LEGACY_OPERATIONAL_IDENTITY_DISPOSITION_V1,
  assertAuthorityProofCurrent,
  assertConfirmationSovereignty,
  assertMembershipEligible,
  assertOwnershipCoherent,
  buildConfirmationChainV1,
  buildGovernedUploadOperationalContextV1,
  buildOagActorBindingV1,
  buildSupervisorConfirmationDecisionV1,
  identifier,
  isolateLegacyIdentitySession,
} from "../index";

const principalId = identifier("PrincipalId", "principal:001");
const otherPrincipalId = identifier("PrincipalId", "principal:002");
const sessionId = identifier("SessionId", "session:001");
const externalIdentityId = identifier(
  "ExternalAuthenticationIdentityId",
  "external-auth:001",
);
const membershipId = identifier("MembershipId", "membership:001");
const companyId = identifier("CompanyId", "company:001");
const otherCompanyId = identifier("CompanyId", "company:002");
const tenantId = identifier("TenantId", "tenant:001");
const otherTenantId = identifier("TenantId", "tenant:002");
const participationContextId = identifier(
  "ParticipationContextId",
  "participation:001",
);
const permissionId = identifier(
  "PlatformPermissionId",
  "permission:upload-data",
);
const roleId = identifier("PlatformRoleId", "role:uploader");
const decisionId = identifier(
  "AuthorizationDecisionId",
  "authorization:001",
);
const uploadId = identifier("UploadId", "upload:001");
const uploadContextId = identifier(
  "UploadOperationalContextId",
  "upload-context:001",
);
const replayReference = identifier(
  "ReplayStateReference",
  "replay-state:001",
);
const policyVersion = identifier("PolicyVersionId", "policy:upload:v1");
const auditReference = identifier(
  "AuditLineageReference",
  "audit-lineage:001",
);
const actorId = identifier("OagActorId", "oag-actor:001");
const supervisorActorId = identifier("OagActorId", "oag-actor:supervisor");
const bindingId = identifier("OagActorBindingId", "oag-binding:001");
const declarationVersionId = identifier(
  "DeclarationVersionId",
  "declaration-version:001",
);
const confirmationDecisionId = identifier(
  "ConfirmationDecisionId",
  "confirmation:001",
);
const graphVersion = identifier("OagGraphVersionId", "oag-graph:v1");
const chainId = identifier("ConfirmationChainId", "confirmation-chain:001");
const authorityProofId = identifier(
  "AuthorityProofId",
  "authority-proof:001",
);

const issuedAt = "2026-07-28T10:00:00.000Z";
const expiresAt = "2026-07-28T10:05:00.000Z";

const participation: ResolvedOperationalParticipationContextV1 = {
  version: 1,
  participation_context_id: participationContextId,
  principal_id: principalId,
  session_id: sessionId,
  membership_id: membershipId,
  selected_company_id: companyId,
  owning_tenant_id: tenantId,
  resolved_at: issuedAt,
};

const membership: OrganizationMembershipV1 = {
  version: 1,
  membership_id: membershipId,
  principal_id: principalId,
  company_id: companyId,
  lifecycle_state: "ACTIVE",
  activation_reference: "membership-approval:001",
  activated_at: issuedAt,
  created_at: issuedAt,
};

const authorization: AuthorizationDecisionV1 = {
  version: 1,
  authorization_decision_id: decisionId,
  permission: "UPLOAD_DATA",
  decision: "ADMITTED",
  principal_id: principalId,
  session_id: sessionId,
  membership_id: membershipId,
  tenant_id: tenantId,
  company_id: companyId,
  resource: "industrial-upload",
  purpose: "governed-industrial-acquisition",
  policy_version: policyVersion,
  issued_at: issuedAt,
  expires_at: expiresAt,
  reason_codes: [],
};

const uploadContext: GovernedUploadOperationalContextV1 = {
  version: 1,
  upload_operational_context_id: uploadContextId,
  principal_id: principalId,
  session_id: sessionId,
  membership_id: membershipId,
  tenant_id: tenantId,
  company_id: companyId,
  authorization_decision_id: decisionId,
  permission: "UPLOAD_DATA",
  upload_id: uploadId,
  resource: authorization.resource,
  purpose: authorization.purpose,
  policy_version: policyVersion,
  issued_at: issuedAt,
  expires_at: expiresAt,
  replay_state_reference: replayReference,
  audit_lineage: [auditReference],
};

const responsibilityScope: OrganizationalResponsibilityScopeV1 = {
  domain: "supply_chain",
  intents: ["ADVISE", "EXECUTE"],
  scopes: ["PROCUREMENT", "INVENTORY"],
  limits: [{ kind: "BUDGET", value: "10000", unit: "EUR" }],
  team_or_subordinate_actor_ids: [actorId],
  operational_constraints: ["HUMAN_APPROVAL_REQUIRED"],
};

function confirmation(
  overrides: Partial<SupervisorConfirmationDecisionV1> = {},
): SupervisorConfirmationDecisionV1 {
  return {
    version: 1,
    confirmation_decision_id: confirmationDecisionId,
    confirming_actor_id: supervisorActorId,
    subject_actor_id: actorId,
    declaration_version_id: declarationVersionId,
    tenant_id: tenantId,
    company_id: companyId,
    outcome: "CONFIRMED",
    submitted_scope: responsibilityScope,
    confirmed_scope: responsibilityScope,
    rejected_scope: {
      domain: "supply_chain",
      intents: [],
      scopes: [],
      limits: [],
      team_or_subordinate_actor_ids: [],
      operational_constraints: [],
    },
    graph_version: graphVersion,
    policy_version: policyVersion,
    decided_at: issuedAt,
    audit_lineage: [auditReference],
    ...overrides,
  };
}

describe("OIR-WU1 — three-layer contract foundations", () => {
  it("keeps external identity, principal, session, membership and OAG actor structurally separate", () => {
    const external: ExternalAuthenticationIdentityV1 = {
      version: 1,
      external_authentication_identity_id: externalIdentityId,
      actor_kind: "HUMAN",
      provider: "provider",
      issuer: "https://issuer.example",
      external_subject: "subject-001",
      authentication_method: "OIDC",
      assurance: "MULTI_FACTOR",
      verified_at: issuedAt,
      verification_reference: "verification:001",
    };
    const principal: DurablePrincipalV1 = {
      version: 1,
      principal_id: principalId,
      actor_kind: "HUMAN",
      lifecycle_state: "ACTIVE",
      created_at: issuedAt,
    };
    const session: ServerSessionV1 = {
      version: 1,
      session_id: sessionId,
      principal_id: principalId,
      external_authentication_identity_id: externalIdentityId,
      issued_at: issuedAt,
      expires_at: expiresAt,
      assurance: "MULTI_FACTOR",
      lifecycle_state: "ACTIVE",
    };
    const actor: OagActorV1 = {
      version: 1,
      oag_actor_id: actorId,
      kind: "HUMAN",
      lifecycle_state: "INACTIVE",
      created_at: issuedAt,
    };

    expect(external).not.toHaveProperty("principal_id");
    expect(external).not.toHaveProperty("company_id");
    expect(session).not.toHaveProperty("company_id");
    expect(session).not.toHaveProperty("tenant_id");
    expect(membership).not.toHaveProperty("organizational_role");
    expect(actor).not.toHaveProperty("principal_id");
    expect(principal).not.toHaveProperty("oag_actor_id");
  });

  it("keeps platform roles and upload permission separate from OAG authority", () => {
    const platformRole: BaselinePlatformRoleV1 = {
      version: 1,
      platform_role_id: roleId,
      name: "DATA_UPLOADER",
      permission_ids: [permissionId],
    };

    expect(platformRole).not.toHaveProperty("organizational_role");
    expect(authorization.permission).toBe("UPLOAD_DATA");
    expect(authorization).not.toHaveProperty("authority_proof_id");
    expect(uploadContext).not.toHaveProperty("oag_actor_id");
    expect(uploadContext).not.toHaveProperty("effective_authority");
  });

  it("preserves distinct branded identifier types", () => {
    expectTypeOf(principalId).not.toEqualTypeOf(sessionId);
    expectTypeOf(principalId).not.toEqualTypeOf(actorId);
    expectTypeOf(membershipId).not.toEqualTypeOf(companyId);

    // @ts-expect-error A session identifier is not a principal identifier.
    const invalidPrincipal: typeof principalId = sessionId;
    expect(invalidPrincipal).toBe(sessionId);
  });

  it("rejects contradictory ownership and inactive membership", () => {
    const ownership: TenantCompanyOwnershipV1 = {
      version: 1,
      company_id: companyId,
      tenant_id: tenantId,
      effective_from: issuedAt,
      ownership_reference: "ownership:001",
    };
    expect(() => assertOwnershipCoherent(participation, ownership)).not.toThrow();
    expect(() =>
      assertOwnershipCoherent(participation, {
        ...ownership,
        tenant_id: otherTenantId,
      })
    ).toThrow("OPERATIONAL_PARTICIPATION_OWNERSHIP_CONTRADICTORY");
    expect(() => assertMembershipEligible(membership, participation)).not.toThrow();
    expect(() =>
      assertMembershipEligible(
        {
          ...membership,
          lifecycle_state: "SUSPENDED",
          lifecycle_decision_reference: "suspension:001",
          lifecycle_changed_at: issuedAt,
        },
        participation,
      )
    ).toThrow("OPERATIONAL_PARTICIPATION_MEMBERSHIP_INELIGIBLE");
  });

  it("builds an immutable upload context only from matching Layer 2 facts", () => {
    const mutableAudit = [auditReference];
    const built = buildGovernedUploadOperationalContextV1(
      { ...uploadContext, audit_lineage: mutableAudit },
      participation,
      authorization,
    );
    mutableAudit.push(
      identifier("AuditLineageReference", "audit-lineage:substituted"),
    );

    expect(Object.isFrozen(built)).toBe(true);
    expect(Object.isFrozen(built.audit_lineage)).toBe(true);
    expect(built.audit_lineage).toEqual([auditReference]);
    expect(() =>
      buildGovernedUploadOperationalContextV1(
        { ...uploadContext, company_id: otherCompanyId },
        participation,
        authorization,
      )
    ).toThrow("UPLOAD_OPERATIONAL_CONTEXT_CONTRADICTORY");
  });

  it("rejects malformed actor bindings and grants no authority from binding alone", () => {
    const binding: OagActorBindingV1 = {
      version: 1,
      oag_actor_binding_id: bindingId,
      oag_actor_id: actorId,
      principal_id: principalId,
      membership_id: membershipId,
      company_id: companyId,
      lifecycle_state: "ACTIVE",
      bound_at: issuedAt,
      binding_reference: "binding-decision:001",
    };
    const built = buildOagActorBindingV1(binding);
    expect(Object.isFrozen(built)).toBe(true);
    expect(built).not.toHaveProperty("effective_scope");
    expect(() =>
      buildOagActorBindingV1({
        ...binding,
        binding_reference: "",
      })
    ).toThrow("OAG_ACTOR_BINDING_MALFORMED");
  });

  it("rejects self-confirmation, scope expansion and sovereignty mismatch", () => {
    expect(() =>
      buildSupervisorConfirmationDecisionV1(
        confirmation({ confirming_actor_id: actorId }),
      )
    ).toThrow("OAG_SELF_CONFIRMATION_FORBIDDEN");
    expect(() =>
      buildSupervisorConfirmationDecisionV1(
        confirmation({
          confirmed_scope: {
            ...responsibilityScope,
            scopes: [...responsibilityScope.scopes, "FINANCE"],
          },
        }),
      )
    ).toThrow("OAG_CONFIRMATION_SCOPE_EXPANSION");

    const confirmingBinding = buildOagActorBindingV1({
      version: 1,
      oag_actor_binding_id: bindingId,
      oag_actor_id: supervisorActorId,
      principal_id: otherPrincipalId,
      membership_id: membershipId,
      company_id: companyId,
      lifecycle_state: "ACTIVE",
      bound_at: issuedAt,
      binding_reference: "binding-decision:supervisor",
    });
    const subjectBinding = buildOagActorBindingV1({
      version: 1,
      oag_actor_binding_id: identifier(
        "OagActorBindingId",
        "oag-binding:subject",
      ),
      oag_actor_id: actorId,
      principal_id: principalId,
      membership_id: membershipId,
      company_id: companyId,
      lifecycle_state: "ACTIVE",
      bound_at: issuedAt,
      binding_reference: "binding-decision:subject",
    });
    expect(() =>
      assertConfirmationSovereignty(
        confirmation(),
        confirmingBinding,
        subjectBinding,
        tenantId,
      )
    ).not.toThrow();
    expect(() =>
      assertConfirmationSovereignty(
        confirmation({ company_id: otherCompanyId }),
        confirmingBinding,
        subjectBinding,
        tenantId,
      )
    ).toThrow("OAG_CONFIRMATION_SOVEREIGNTY_CONTRADICTORY");
    expect(() =>
      assertConfirmationSovereignty(
        confirmation(),
        confirmingBinding,
        subjectBinding,
        otherTenantId,
      )
    ).toThrow("OAG_CONFIRMATION_SOVEREIGNTY_CONTRADICTORY");
    expect(() =>
      assertConfirmationSovereignty(
        confirmation(),
        confirmingBinding,
        { ...subjectBinding, company_id: otherCompanyId },
        tenantId,
      )
    ).toThrow("OAG_CONFIRMATION_SOVEREIGNTY_CONTRADICTORY");
  });

  it("defensively freezes ordered scope-preserving confirmation chains", () => {
    const mutableScopes = ["PROCUREMENT", "INVENTORY"];
    const chain = buildConfirmationChainV1({
      version: 1,
      confirmation_chain_id: chainId,
      subject_actor_id: actorId,
      tenant_id: tenantId,
      company_id: companyId,
      declaration_version_id: declarationVersionId,
      steps: [
        {
          ordinal: 1,
          confirmation_decision_id: confirmationDecisionId,
          confirming_actor_id: supervisorActorId,
          confirmed_scope: { ...responsibilityScope, scopes: mutableScopes },
        },
      ],
      terminal_scope: responsibilityScope,
      graph_version: graphVersion,
      policy_version: policyVersion,
      completed_at: issuedAt,
    });
    mutableScopes.push("FINANCE");

    expect(Object.isFrozen(chain)).toBe(true);
    expect(Object.isFrozen(chain.steps)).toBe(true);
    expect(chain.steps[0]!.confirmed_scope.scopes).not.toContain("FINANCE");
  });

  it("makes suspended membership, revocation and drift ineligible for current authority", () => {
    const proof: EffectiveOperationalAuthorityProofV1 = {
      version: 1,
      authority_proof_id: authorityProofId,
      oag_actor_id: actorId,
      oag_actor_binding_id: bindingId,
      principal_id: principalId,
      membership_id: membershipId,
      tenant_id: tenantId,
      company_id: companyId,
      declaration_version_ids: [declarationVersionId],
      confirmation_chain_id: chainId,
      graph_version: graphVersion,
      delegation_references: [],
      effective_scope: responsibilityScope,
      policy_version: policyVersion,
      issued_at: issuedAt,
      expires_at: expiresAt,
      eligibility_state: "ELIGIBLE",
      invalidation_reasons: [],
    };

    expect(() => assertAuthorityProofCurrent(proof, "ACTIVE")).not.toThrow();
    expect(() => assertAuthorityProofCurrent(proof, "SUSPENDED")).toThrow(
      "OAG_AUTHORITY_PROOF_INELIGIBLE",
    );
    expect(() =>
      assertAuthorityProofCurrent(
        {
          ...proof,
          eligibility_state: "INELIGIBLE",
          invalidation_reasons: ["AUTHORITY_DRIFTED"],
        },
        "ACTIVE",
      )
    ).toThrow("OAG_AUTHORITY_PROOF_INELIGIBLE");
  });

  it("isolates legacy session data as non-authoritative claims", () => {
    const claim = isolateLegacyIdentitySession({
      session_id: "legacy-session",
      authenticated: true,
      actor_id: "legacy-actor",
      tenant_id: "caller-tenant",
      company_id: "caller-company",
      declared_role: "MANAGER",
      authority_state: "DECLARED",
      authority_confidence: 0.4,
      created_at: issuedAt,
      mode: "OBSERVE",
    });

    expect(claim.authoritative).toBe(false);
    expect(Object.isFrozen(claim)).toBe(true);
    expect(LEGACY_OPERATIONAL_IDENTITY_DISPOSITION_V1).toMatchObject({
      IdentityRole: "SUPERSEDED_AMBIGUOUS_ROLE",
      IdentitySessionV1: "SUPERSEDED_NON_AUTHORITATIVE_SESSION_CLAIM",
      OagGraph: "PRESERVED_BEHIND_FUTURE_EXPLICIT_ADAPTER",
      PrincipalResponseV1: "PRESERVED_PRINCIPAL_PRODUCT_TIER_NOT_IDENTITY",
    });
  });
});
