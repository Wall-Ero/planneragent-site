import type {
  DurablePrincipalV1,
  ServerSessionV1,
} from "../operational-identity/contracts/track-a.v1";
import {
  ObservationEntitlementError,
  type ObservationEntitlementFailureCode,
  type ObservationEntitlementId,
  type ObservationEntitlementRequestV1,
  type ObservationEntitlementV1,
  type PrivateObservationScopeV1,
  type TemporaryPrivateObservationContextV1,
  type TemporaryPrivateObservationRequestV1,
} from "./observation.entitlement.contracts.v1";
import type {
  TemporaryObservationEntitlementStoreV1,
} from "./observation.entitlement.store.v1";

export interface ObservationEntitlementRuntimeDependenciesV1 {
  readonly store: TemporaryObservationEntitlementStoreV1;
  readonly sessions: Readonly<{
    find(sessionId: ServerSessionV1["session_id"]): Promise<ServerSessionV1 | null>;
  }>;
  readonly principals: Readonly<{
    find(principalId: DurablePrincipalV1["principal_id"]): Promise<DurablePrincipalV1 | null>;
  }>;
  readonly ids: Readonly<{
    observationEntitlementId(): ObservationEntitlementId;
  }>;
  readonly policy: Readonly<{
    max_validity_ms: number;
  }>;
  readonly now: () => string;
}

function fail(code: ObservationEntitlementFailureCode): never {
  throw new ObservationEntitlementError(code);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 1024;
}

function validScope(scope: PrivateObservationScopeV1): boolean {
  return !!scope &&
    ["FILE", "API", "MANUAL_INPUT"].includes(scope.source_kind) &&
    text(scope.source_reference) &&
    text(scope.dataset_kind) &&
    text(scope.dataset_reference) &&
    text(scope.purpose) &&
    text(scope.operational_question);
}

function sameScope(a: PrivateObservationScopeV1, b: PrivateObservationScopeV1): boolean {
  return a.source_kind === b.source_kind &&
    a.source_reference === b.source_reference &&
    a.dataset_kind === b.dataset_kind &&
    a.dataset_reference === b.dataset_reference &&
    a.purpose === b.purpose &&
    a.operational_question === b.operational_question;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export class ObservationEntitlementRuntimeV1 {
  constructor(private readonly dependencies: ObservationEntitlementRuntimeDependenciesV1) {}

  async issue(request: ObservationEntitlementRequestV1): Promise<ObservationEntitlementV1> {
    if (request?.version !== 1 || request.authenticated_session?.version !== 1 ||
      !validScope(request.scope) || !Number.isSafeInteger(request.requested_validity_ms) ||
      request.requested_validity_ms <= 0 ||
      !Number.isSafeInteger(this.dependencies.policy.max_validity_ms) ||
      this.dependencies.policy.max_validity_ms <= 0 ||
      request.requested_validity_ms > this.dependencies.policy.max_validity_ms ||
      !text(request.correlation_id) || !Array.isArray(request.causal_references)) {
      fail("OBSERVATION_ENTITLEMENT_INPUT_INVALID");
    }

    const session = await this.revalidate(request.authenticated_session);
    const issuedAt = this.dependencies.now();
    const expiresAt = new Date(Math.min(
      Date.parse(issuedAt) + request.requested_validity_ms,
      Date.parse(session.expires_at),
    )).toISOString();
    if (Date.parse(expiresAt) <= Date.parse(issuedAt)) {
      fail("OBSERVATION_ENTITLEMENT_SESSION_INELIGIBLE");
    }

    const entitlement = deepFreeze({
      version: 1 as const,
      observation_entitlement_id: this.dependencies.ids.observationEntitlementId(),
      principal_id: request.authenticated_session.principal_id,
      session_id: request.authenticated_session.session_id,
      scope: { ...request.scope },
      issued_at: issuedAt,
      expires_at: expiresAt,
      state: "ACTIVE" as const,
      privacy: "PRIVATE_TO_AUTHENTICATED_PRINCIPAL" as const,
      authority_effect: "NONE" as const,
      organizational_representation: "NONE" as const,
      membership_required: false as const,
      company_verification_required: false as const,
      correlation_id: request.correlation_id,
      audit_lineage: [...request.causal_references],
    });
    await this.dependencies.store.create(entitlement);
    return entitlement;
  }

  async admit(
    request: TemporaryPrivateObservationRequestV1,
  ): Promise<TemporaryPrivateObservationContextV1> {
    if (request?.version !== 1 || request.entitlement?.version !== 1 ||
      request.authenticated_session?.version !== 1 || !validScope(request.scope) ||
      !text(request.correlation_id)) fail("OBSERVATION_ENTITLEMENT_INPUT_INVALID");

    await this.revalidate(request.authenticated_session);
    const record = await this.dependencies.store.find(
      request.entitlement.observation_entitlement_id,
    );
    if (!record) fail("OBSERVATION_ENTITLEMENT_UNKNOWN");
    if (record.state === "REVOKED") fail("OBSERVATION_ENTITLEMENT_REVOKED");
    if (record.state === "CONSUMED") fail("OBSERVATION_ENTITLEMENT_ALREADY_CONSUMED");

    const canonical = record.entitlement;
    const now = this.dependencies.now();
    if (Date.parse(canonical.expires_at) <= Date.parse(now)) {
      fail("OBSERVATION_ENTITLEMENT_EXPIRED");
    }
    if (canonical !== request.entitlement ||
      canonical.principal_id !== request.authenticated_session.principal_id ||
      canonical.session_id !== request.authenticated_session.session_id ||
      canonical.correlation_id !== request.correlation_id ||
      !sameScope(canonical.scope, request.scope)) {
      fail("OBSERVATION_ENTITLEMENT_SCOPE_SUBSTITUTED");
    }
    if (!await this.dependencies.store.consume(canonical.observation_entitlement_id)) {
      fail("OBSERVATION_ENTITLEMENT_ALREADY_CONSUMED");
    }

    return deepFreeze({
      version: 1 as const,
      observation_entitlement_id: canonical.observation_entitlement_id,
      principal_id: canonical.principal_id,
      session_id: canonical.session_id,
      scope: { ...canonical.scope },
      admitted_at: now,
      expires_at: canonical.expires_at,
      processing_boundary: "TEMPORARY_PRIVATE_OBSERVATION" as const,
      retention: "TRANSIENT_UNTIL_EXPIRY" as const,
      sharing: "DENIED" as const,
      observation_memory_write: "DENIED" as const,
      organizational_memory_write: "DENIED" as const,
      authority_effect: "NONE" as const,
      execution: "DENIED" as const,
      provider_credentials: "DENIED" as const,
      correlation_id: canonical.correlation_id,
    });
  }

  async revoke(id: ObservationEntitlementId): Promise<boolean> {
    return this.dependencies.store.revoke(id);
  }

  private async revalidate(authenticated: ObservationEntitlementRequestV1["authenticated_session"]) {
    const [session, principal] = await Promise.all([
      this.dependencies.sessions.find(authenticated.session_id),
      this.dependencies.principals.find(authenticated.principal_id),
    ]);
    const now = Date.parse(this.dependencies.now());
    if (!session || session.lifecycle_state !== "ACTIVE" ||
      session.principal_id !== authenticated.principal_id ||
      session.external_authentication_identity_id !==
        authenticated.external_authentication_identity_id ||
      Date.parse(session.expires_at) <= now ||
      authenticated.expires_at !== session.expires_at) {
      fail("OBSERVATION_ENTITLEMENT_SESSION_INELIGIBLE");
    }
    if (!principal || principal.lifecycle_state !== "ACTIVE" ||
      principal.principal_id !== authenticated.principal_id ||
      principal.actor_kind !== authenticated.actor_kind) {
      fail("OBSERVATION_ENTITLEMENT_PRINCIPAL_INELIGIBLE");
    }
    return session;
  }
}
