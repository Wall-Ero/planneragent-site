// Operational Identity Runtime — contract invariant helpers v1
// These helpers validate and defensively freeze contract objects. They do not
// authenticate, persist, authorize, confirm, bootstrap, or execute anything.

import type {
  AuthorizationDecisionV1,
  GovernedUploadOperationalContextV1,
  OrganizationMembershipV1,
  ResolvedOperationalParticipationContextV1,
  TenantCompanyOwnershipV1,
} from "./track-a.v1";
import type {
  ConfirmationChainV1,
  EffectiveOperationalAuthorityProofV1,
  GovernedAuthorityRootV1,
  OagActorBindingV1,
  OrganizationalResponsibilityScopeV1,
  SupervisorConfirmationDecisionV1,
} from "./track-b.v1";
import type { TenantId } from "./identifiers.v1";

function iso(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function fail(code: string): never {
  throw new Error(code);
}

function frozenScope(
  scope: OrganizationalResponsibilityScopeV1,
): OrganizationalResponsibilityScopeV1 {
  return Object.freeze({
    ...scope,
    intents: Object.freeze([...scope.intents]),
    scopes: Object.freeze([...scope.scopes]),
    limits: Object.freeze(
      scope.limits.map(limit => Object.freeze({ ...limit })),
    ),
    team_or_subordinate_actor_ids: Object.freeze([
      ...scope.team_or_subordinate_actor_ids,
    ]),
    operational_constraints: Object.freeze([
      ...scope.operational_constraints,
    ]),
  });
}

function subset(candidate: readonly string[], submitted: readonly string[]) {
  const allowed = new Set(submitted);
  return candidate.every(value => allowed.has(value));
}

function scopeWithin(
  candidate: OrganizationalResponsibilityScopeV1,
  submitted: OrganizationalResponsibilityScopeV1,
): boolean {
  const submittedLimits = new Set(
    submitted.limits.map(limit =>
      JSON.stringify([limit.kind, limit.value, limit.unit ?? null])
    ),
  );
  return (
    candidate.domain === submitted.domain &&
    subset(candidate.intents, submitted.intents) &&
    subset(candidate.scopes, submitted.scopes) &&
    candidate.limits.every(limit =>
      submittedLimits.has(
        JSON.stringify([limit.kind, limit.value, limit.unit ?? null]),
      )
    ) &&
    subset(
      candidate.team_or_subordinate_actor_ids,
      submitted.team_or_subordinate_actor_ids,
    ) &&
    subset(
      candidate.operational_constraints,
      submitted.operational_constraints,
    )
  );
}

export function assertOwnershipCoherent(
  context: ResolvedOperationalParticipationContextV1,
  ownership: TenantCompanyOwnershipV1,
): void {
  if (
    context.selected_company_id !== ownership.company_id ||
    context.owning_tenant_id !== ownership.tenant_id ||
    !iso(context.resolved_at) ||
    !iso(ownership.effective_from) ||
    Date.parse(ownership.effective_from) > Date.parse(context.resolved_at) ||
    (ownership.effective_until !== undefined &&
      (!iso(ownership.effective_until) ||
        Date.parse(ownership.effective_until) <=
          Date.parse(context.resolved_at)))
  ) {
    fail("OPERATIONAL_PARTICIPATION_OWNERSHIP_CONTRADICTORY");
  }
}

export function assertMembershipEligible(
  membership: OrganizationMembershipV1,
  context: ResolvedOperationalParticipationContextV1,
): void {
  if (
    membership.lifecycle_state !== "ACTIVE" ||
    membership.membership_id !== context.membership_id ||
    membership.principal_id !== context.principal_id ||
    membership.company_id !== context.selected_company_id
  ) {
    fail("OPERATIONAL_PARTICIPATION_MEMBERSHIP_INELIGIBLE");
  }
}

export function buildGovernedUploadOperationalContextV1(
  input: GovernedUploadOperationalContextV1,
  participation: ResolvedOperationalParticipationContextV1,
  decision: AuthorizationDecisionV1,
): GovernedUploadOperationalContextV1 {
  if (
    decision.decision !== "ADMITTED" ||
    decision.permission !== "UPLOAD_DATA" ||
    input.permission !== "UPLOAD_DATA"
  ) {
    fail("UPLOAD_DATA_AUTHORIZATION_REQUIRED");
  }
  if (
    input.principal_id !== participation.principal_id ||
    input.session_id !== participation.session_id ||
    input.membership_id !== participation.membership_id ||
    input.tenant_id !== participation.owning_tenant_id ||
    input.company_id !== participation.selected_company_id ||
    decision.principal_id !== participation.principal_id ||
    decision.session_id !== participation.session_id ||
    decision.membership_id !== participation.membership_id ||
    decision.tenant_id !== participation.owning_tenant_id ||
    decision.company_id !== participation.selected_company_id ||
    input.authorization_decision_id !== decision.authorization_decision_id ||
    input.resource !== decision.resource ||
    input.purpose !== decision.purpose ||
    input.policy_version !== decision.policy_version ||
    input.issued_at !== decision.issued_at ||
    input.expires_at !== decision.expires_at
  ) {
    fail("UPLOAD_OPERATIONAL_CONTEXT_CONTRADICTORY");
  }
  if (
    !iso(input.issued_at) ||
    !iso(input.expires_at) ||
    Date.parse(input.expires_at) <= Date.parse(input.issued_at)
  ) {
    fail("UPLOAD_OPERATIONAL_CONTEXT_TIME_INVALID");
  }
  return Object.freeze({
    ...input,
    audit_lineage: Object.freeze([...input.audit_lineage]),
  });
}

export function buildOagActorBindingV1(
  input: OagActorBindingV1,
): OagActorBindingV1 {
  if (
    !input.principal_id ||
    !input.membership_id ||
    !input.company_id ||
    !input.oag_actor_id ||
    !input.binding_reference
  ) {
    fail("OAG_ACTOR_BINDING_MALFORMED");
  }
  return Object.freeze({ ...input });
}

export function buildSupervisorConfirmationDecisionV1(
  input: SupervisorConfirmationDecisionV1,
): SupervisorConfirmationDecisionV1 {
  if (input.confirming_actor_id === input.subject_actor_id) {
    fail("OAG_SELF_CONFIRMATION_FORBIDDEN");
  }
  if (!scopeWithin(input.confirmed_scope, input.submitted_scope)) {
    fail("OAG_CONFIRMATION_SCOPE_EXPANSION");
  }
  return Object.freeze({
    ...input,
    submitted_scope: frozenScope(input.submitted_scope),
    confirmed_scope: frozenScope(input.confirmed_scope),
    rejected_scope: frozenScope(input.rejected_scope),
    audit_lineage: Object.freeze([...input.audit_lineage]),
  });
}

export function buildConfirmationChainV1(
  input: ConfirmationChainV1,
): ConfirmationChainV1 {
  if (input.steps.length === 0) {
    fail("OAG_CONFIRMATION_CHAIN_EMPTY");
  }
  let previous = input.steps[0]!.confirmed_scope;
  for (const [index, step] of input.steps.entries()) {
    if (step.ordinal !== index + 1) {
      fail("OAG_CONFIRMATION_CHAIN_ORDER_INVALID");
    }
    if (step.confirming_actor_id === input.subject_actor_id) {
      fail("OAG_SELF_CONFIRMATION_FORBIDDEN");
    }
    if (index > 0 && !scopeWithin(step.confirmed_scope, previous)) {
      fail("OAG_CONFIRMATION_CHAIN_SCOPE_EXPANSION");
    }
    previous = step.confirmed_scope;
  }
  if (!scopeWithin(input.terminal_scope, previous)) {
    fail("OAG_CONFIRMATION_CHAIN_SCOPE_EXPANSION");
  }
  return Object.freeze({
    ...input,
    steps: Object.freeze(
      input.steps.map(step =>
        Object.freeze({
          ...step,
          confirmed_scope: frozenScope(step.confirmed_scope),
        })
      ),
    ),
    terminal_scope: frozenScope(input.terminal_scope),
  });
}

export function assertConfirmationSovereignty(
  decision: SupervisorConfirmationDecisionV1,
  confirmingBinding: OagActorBindingV1,
  subjectBinding: OagActorBindingV1,
  tenantId: TenantId,
): void {
  if (
    decision.confirming_actor_id !== confirmingBinding.oag_actor_id ||
    decision.subject_actor_id !== subjectBinding.oag_actor_id ||
    decision.company_id !== confirmingBinding.company_id ||
    decision.company_id !== subjectBinding.company_id ||
    decision.tenant_id !== tenantId
  ) {
    fail("OAG_CONFIRMATION_SOVEREIGNTY_CONTRADICTORY");
  }
}

export function assertAuthorityRootIndependent(
  root: GovernedAuthorityRootV1,
): void {
  if (
    root.root_actor_id === root.approved_by_actor_id ||
    root.evidence_kinds.length === 0 ||
    root.evidence_references.length === 0
  ) {
    fail("OAG_AUTHORITY_ROOT_INDEPENDENCE_REQUIRED");
  }
}

export function assertAuthorityProofCurrent(
  proof: EffectiveOperationalAuthorityProofV1,
  membershipState: OrganizationMembershipV1["lifecycle_state"],
): void {
  if (
    membershipState !== "ACTIVE" ||
    proof.eligibility_state !== "ELIGIBLE" ||
    proof.invalidation_reasons.length > 0
  ) {
    fail("OAG_AUTHORITY_PROOF_INELIGIBLE");
  }
}
