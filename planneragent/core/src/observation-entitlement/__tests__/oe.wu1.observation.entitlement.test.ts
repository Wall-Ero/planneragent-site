import { describe, expect, it } from "vitest";
import type { AuthenticatedOperationalSessionV1 } from "../../operational-identity/authentication";
import { identifier } from "../../operational-identity/contracts/identifiers.v1";
import type { DurablePrincipalV1, ServerSessionV1 } from "../../operational-identity/contracts/track-a.v1";
import {
  InMemoryTemporaryObservationEntitlementStoreV1,
  ObservationEntitlementError,
  ObservationEntitlementRuntimeV1,
  type ObservationEntitlementRequestV1,
  type PrivateObservationScopeV1,
} from "..";

const NOW = "2026-08-06T10:00:00.000Z";
const EXPIRES = "2026-08-06T11:00:00.000Z";
const principalId = identifier("PrincipalId", "private-observer");
const sessionId = identifier("SessionId", "private-session");
const externalId = identifier("ExternalAuthenticationIdentityId", "private-external");
const correlationId = identifier("CorrelationId", "private-correlation");

const principal: DurablePrincipalV1 = Object.freeze({
  version: 1, principal_id: principalId, actor_kind: "HUMAN",
  lifecycle_state: "ACTIVE", created_at: NOW,
});
const serverSession: ServerSessionV1 = Object.freeze({
  version: 1, session_id: sessionId, principal_id: principalId,
  external_authentication_identity_id: externalId, issued_at: NOW,
  expires_at: EXPIRES, assurance: "MULTI_FACTOR", lifecycle_state: "ACTIVE",
});
const authenticated: AuthenticatedOperationalSessionV1 = Object.freeze({
  version: 1, principal_id: principalId, session_id: sessionId,
  external_authentication_identity_id: externalId, actor_kind: "HUMAN",
  assurance: "MULTI_FACTOR", authenticated_at: NOW, expires_at: EXPIRES,
  authentication_audit_event_id: "authentication-audit:private",
});
const scope: PrivateObservationScopeV1 = Object.freeze({
  source_kind: "FILE", source_reference: "upload:private-1",
  dataset_kind: "ORDERS", dataset_reference: "dataset:private-1",
  purpose: "private-operational-observation",
  operational_question: "Where is deterministic delivery pressure visible?",
});

function harness(overrides: { now?: string; session?: ServerSessionV1 | null; principal?: DurablePrincipalV1 | null } = {}) {
  const store = new InMemoryTemporaryObservationEntitlementStoreV1();
  const runtime = new ObservationEntitlementRuntimeV1({
    store,
    sessions: { async find() { return overrides.session === undefined ? serverSession : overrides.session; } },
    principals: { async find() { return overrides.principal === undefined ? principal : overrides.principal; } },
    ids: { observationEntitlementId: () => "observation-entitlement:1" as any },
    policy: { max_validity_ms: 15 * 60 * 1000 },
    now: () => overrides.now ?? NOW,
  });
  return { runtime, store };
}

function request(overrides: Partial<ObservationEntitlementRequestV1> = {}): ObservationEntitlementRequestV1 {
  return {
    version: 1, authenticated_session: authenticated, scope,
    requested_validity_ms: 5 * 60 * 1000, correlation_id: correlationId,
    causal_references: Object.freeze([]), ...overrides,
  };
}

async function issued(runtime: ObservationEntitlementRuntimeV1) {
  return runtime.issue(request());
}

describe("OE-WU1 observation entitlement and temporary private observation boundary", () => {
  it("issues a narrow temporary entitlement from authentication without membership, company, tenant or authority", async () => {
    const { runtime } = harness();
    const value = await issued(runtime);
    expect(value).toMatchObject({
      principal_id: principalId, session_id: sessionId, scope,
      privacy: "PRIVATE_TO_AUTHENTICATED_PRINCIPAL", authority_effect: "NONE",
      organizational_representation: "NONE", membership_required: false,
      company_verification_required: false,
    });
    expect(Object.keys(value).join(" ")).not.toMatch(/membership_id|company_id|tenant_id|authority_id/);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.scope)).toBe(true);
  });

  it("admits exactly one bound use and explicitly denies durability, sharing, authority, execution and credentials", async () => {
    const { runtime } = harness();
    const entitlement = await issued(runtime);
    const input = { version: 1 as const, entitlement, authenticated_session: authenticated, scope, correlation_id: correlationId };
    await expect(runtime.admit(input)).resolves.toMatchObject({
      processing_boundary: "TEMPORARY_PRIVATE_OBSERVATION",
      retention: "TRANSIENT_UNTIL_EXPIRY", sharing: "DENIED",
      observation_memory_write: "DENIED", organizational_memory_write: "DENIED",
      authority_effect: "NONE", execution: "DENIED", provider_credentials: "DENIED",
    });
    await expect(runtime.admit(input)).rejects.toMatchObject({
      code: "OBSERVATION_ENTITLEMENT_ALREADY_CONSUMED",
    });
  });

  it.each([
    ["source", { ...scope, source_reference: "upload:other" }],
    ["dataset", { ...scope, dataset_reference: "dataset:other" }],
    ["purpose", { ...scope, purpose: "other-purpose" }],
    ["question", { ...scope, operational_question: "A different question" }],
  ])("rejects %s substitution", async (_name, changed) => {
    const { runtime } = harness();
    const entitlement = await issued(runtime);
    await expect(runtime.admit({
      version: 1, entitlement, authenticated_session: authenticated,
      scope: changed as PrivateObservationScopeV1, correlation_id: correlationId,
    })).rejects.toMatchObject({ code: "OBSERVATION_ENTITLEMENT_SCOPE_SUBSTITUTED" });
  });

  it("rejects missing, expired, revoked and substituted session state", async () => {
    await expect(harness({ session: null }).runtime.issue(request())).rejects.toMatchObject({
      code: "OBSERVATION_ENTITLEMENT_SESSION_INELIGIBLE",
    });
    await expect(harness({ principal: { ...principal, lifecycle_state: "REVOKED" } }).runtime.issue(request()))
      .rejects.toMatchObject({ code: "OBSERVATION_ENTITLEMENT_PRINCIPAL_INELIGIBLE" });

    const expiredHarness = harness({ now: "2026-08-06T11:01:00.000Z" });
    await expect(expiredHarness.runtime.issue(request())).rejects.toBeInstanceOf(ObservationEntitlementError);

    const { runtime } = harness();
    const entitlement = await issued(runtime);
    expect(await runtime.revoke(entitlement.observation_entitlement_id)).toBe(true);
    await expect(runtime.admit({ version: 1, entitlement, authenticated_session: authenticated, scope, correlation_id: correlationId }))
      .rejects.toMatchObject({ code: "OBSERVATION_ENTITLEMENT_REVOKED" });
  });

  it("rejects malformed, broad and overlong requests fail closed", async () => {
    const { runtime } = harness();
    await expect(runtime.issue(request({ requested_validity_ms: 0 }))).rejects.toMatchObject({
      code: "OBSERVATION_ENTITLEMENT_INPUT_INVALID",
    });
    await expect(runtime.issue(request({ requested_validity_ms: 15 * 60 * 1000 + 1 }))).rejects.toMatchObject({
      code: "OBSERVATION_ENTITLEMENT_INPUT_INVALID",
    });
    await expect(runtime.issue(request({ scope: { ...scope, operational_question: "" } }))).rejects.toMatchObject({
      code: "OBSERVATION_ENTITLEMENT_INPUT_INVALID",
    });
  });
});
