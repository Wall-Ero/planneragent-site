import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import persistenceMigration from "../../../../migrations/0007_oir_track_a_persistence.sql?raw";
import runtimeMigration from "../../../../migrations/0008_oir_authentication_runtime.sql?raw";
import runtimeSource from "../authentication.runtime.v1.ts?raw";
import { identifier } from "../../contracts/identifiers.v1";
import type { DurablePrincipalV1, ExternalAuthenticationIdentityV1 } from "../../contracts/track-a.v1";
import { D1OperationalIdentityRepositories } from "../../persistence";
import type { PrincipalBindingResolver } from "../authentication.boundaries.v1";
import type { AuthenticationEvidenceV1, AuthenticationRequestV1 } from "../authentication.contracts.v1";
import {
  D1AuthenticationAuditRepository,
  D1AuthenticationReplayRepository,
  PersistedPrincipalBindingResolver,
} from "../authentication.persistence.d1";
import { ProviderAgnosticAuthenticationRuntime } from "../authentication.runtime.v1";

const now = "2026-07-29T10:00:00.000Z";
const issued = "2026-07-29T09:59:00.000Z";
const expires = "2026-07-29T11:00:00.000Z";
const source = "enterprise-identity-source";
const issuer = "urn:identity:issuer";
const audience = "planneragent-core";
const principalId = identifier("PrincipalId", "principal-runtime");
const externalId = identifier("ExternalAuthenticationIdentityId", "external-runtime");
const correlationId = identifier("CorrelationId", "correlation-runtime");
const db = env.POLICIES_DB;
const repositories = new D1OperationalIdentityRepositories(db);
let sequence = 0;

function queries(sql: string): string[] {
  return sql
    .split(/;\s*\r?\n(?=CREATE (?:TABLE|UNIQUE INDEX|TRIGGER))/)
    .map(query => query.trim())
    .filter(Boolean)
    .map(query => query.endsWith(";") ? query : `${query};`);
}

function binding(): ExternalAuthenticationIdentityV1 {
  return {
    version: 1,
    external_authentication_identity_id: externalId,
    actor_kind: "HUMAN",
    provider: source,
    issuer,
    external_subject: "subject-runtime",
    authentication_method: "external-verification",
    assurance: "MULTI_FACTOR",
    verified_at: issued,
    verification_reference: "binding-verification",
  };
}

function evidence(overrides: Partial<AuthenticationEvidenceV1> = {}): AuthenticationEvidenceV1 {
  sequence += 1;
  return {
    version: 1,
    evidence_id: `evidence-${sequence}` as AuthenticationEvidenceV1["evidence_id"],
    authentication_source: source,
    actor_kind: "HUMAN",
    issuer,
    subject: "subject-runtime",
    audience: [audience],
    issued_at: issued,
    expires_at: expires,
    nonce: `nonce-${sequence}`,
    claims: Object.freeze({ authentication_context: "enterprise" }),
    verification_method: "detached-proof",
    verification_result: "VERIFIED",
    assurance: "MULTI_FACTOR",
    evidence_lineage: Object.freeze([]),
    ...overrides,
  };
}

function request(
  evidenceOverrides: Partial<AuthenticationEvidenceV1> = {},
  requestOverrides: Partial<AuthenticationRequestV1> = {},
): AuthenticationRequestV1 {
  return {
    version: 1,
    evidence: evidence(evidenceOverrides),
    expected_issuer: issuer,
    expected_audience: audience,
    minimum_assurance: "SINGLE_FACTOR",
    correlation_id: correlationId,
    ...requestOverrides,
  };
}

function runtime(options: {
  bindings?: PrincipalBindingResolver;
  verified?: boolean;
  principalReader?: { find(id: typeof principalId): Promise<DurablePrincipalV1 | null> };
} = {}) {
  return new ProviderAgnosticAuthenticationRuntime({
    verifier: {
      async verify() {
        return options.verified === false
          ? { verified: false }
          : { verified: true, verification_reference: "neutral-verifier-result" };
      },
    },
    replay: new D1AuthenticationReplayRepository(db),
    bindings: options.bindings ?? new PersistedPrincipalBindingResolver(repositories.externalBindings),
    principals: options.principalReader ?? repositories.principals,
    sessions: repositories.sessions,
    audit: new D1AuthenticationAuditRepository(db),
    ids: {
      sessionId: () => identifier("SessionId", `session-${++sequence}`),
      auditEventId: () => `authentication-audit-${++sequence}`,
    },
    now: () => now,
  }, {
    session_ttl_ms: 30 * 60 * 1000,
    allowed_clock_skew_ms: 30_000,
    executing_runtime: "operational-identity.authentication.v1",
  });
}

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code });
}

beforeAll(async () => {
  await applyD1Migrations(db, [
    { name: "0007_oir_track_a_persistence.sql", queries: queries(persistenceMigration) },
    { name: "0008_oir_authentication_runtime.sql", queries: queries(runtimeMigration) },
  ]);
});

beforeEach(async () => {
  sequence = 0;
  await repositories.principals.create({
    version: 1,
    principal_id: principalId,
    actor_kind: "HUMAN",
    lifecycle_state: "ACTIVE",
    created_at: issued,
  });
  await repositories.externalBindings.create(binding(), principalId);
});

describe("OIR-WU3 provider-agnostic authentication runtime", () => {
  it("authenticates valid evidence and creates only a Layer 1 session", async () => {
    const authenticated = await runtime().authenticate(request());
    expect(authenticated.principal_id).toBe(principalId);
    expect(authenticated.external_authentication_identity_id).toBe(externalId);
    expect(authenticated.assurance).toBe("MULTI_FACTOR");
    expect(authenticated.expires_at).toBe("2026-07-29T10:30:00.000Z");
    expect(Object.keys(authenticated).sort()).toEqual([
      "actor_kind", "assurance", "authenticated_at", "authentication_audit_event_id",
      "expires_at", "external_authentication_identity_id", "principal_id", "session_id", "version",
    ]);
    expect((await db.prepare("SELECT COUNT(*) AS count FROM oir_organization_memberships").first<{ count: number }>())?.count).toBe(0);
  });

  it.each([
    ["expired evidence", { expires_at: now }, {}, "AUTHENTICATION_EVIDENCE_EXPIRED"],
    ["future evidence", { issued_at: "2026-07-29T10:01:00.000Z" }, {}, "AUTHENTICATION_EVIDENCE_NOT_YET_VALID"],
    ["invalid issuer", {}, { expected_issuer: "urn:other:issuer" }, "AUTHENTICATION_ISSUER_INVALID"],
    ["invalid audience", {}, { expected_audience: "other-runtime" }, "AUTHENTICATION_AUDIENCE_INVALID"],
    ["insufficient assurance", { assurance: "SINGLE_FACTOR" as const }, { minimum_assurance: "MULTI_FACTOR" as const }, "AUTHENTICATION_ASSURANCE_INSUFFICIENT"],
  ])("rejects %s", async (_label, evidenceOverrides, requestOverrides, code) => {
    await expectCode(runtime().authenticate(request(evidenceOverrides, requestOverrides)), code);
  });

  it("rejects verifier failure and replayed evidence", async () => {
    await expectCode(runtime({ verified: false }).authenticate(request()), "AUTHENTICATION_VERIFICATION_REJECTED");
    const replayed = request();
    await runtime().authenticate(replayed);
    await expectCode(runtime().authenticate(replayed), "AUTHENTICATION_EVIDENCE_REPLAYED");
  });

  it("rejects structurally malformed claims before verification", async () => {
    await expectCode(runtime().authenticate(request({
      claims: [] as unknown as Readonly<Record<string, unknown>>,
    })), "AUTHENTICATION_EVIDENCE_MALFORMED");
  });

  it("rejects unknown, duplicate, and contradictory bindings", async () => {
    await expectCode(runtime({
      bindings: { async resolve() { return []; } },
    }).authenticate(request()), "AUTHENTICATION_BINDING_UNKNOWN");

    const resolved = { binding: binding(), principal_id: principalId };
    await expectCode(runtime({
      bindings: { async resolve() { return [resolved, resolved]; } },
    }).authenticate(request()), "AUTHENTICATION_BINDING_DUPLICATE");

    await expectCode(runtime({
      bindings: {
        async resolve() {
          return [{ binding: { ...binding(), external_subject: "contradiction" }, principal_id: principalId }];
        },
      },
    }).authenticate(request()), "AUTHENTICATION_BINDING_CONTRADICTORY");
  });

  it("rejects unknown, disabled, and revoked principals", async () => {
    await expectCode(runtime({
      principalReader: { async find() { return null; } },
    }).authenticate(request()), "AUTHENTICATION_PRINCIPAL_UNKNOWN");

    await repositories.principals.setLifecycle(principalId, "SUSPENDED");
    await expectCode(runtime().authenticate(request()), "AUTHENTICATION_PRINCIPAL_DISABLED");

    await repositories.principals.setLifecycle(principalId, "REVOKED");
    await expectCode(runtime().authenticate(request()), "AUTHENTICATION_PRINCIPAL_REVOKED");
  });

  it("restores only the persisted session identity", async () => {
    const first = await runtime().authenticate(request());
    const restored = await runtime().authenticate(request({}, { requested_session_id: first.session_id }));
    expect(restored.session_id).toBe(first.session_id);
    expect(restored.principal_id).toBe(first.principal_id);

    await expectCode(runtime().authenticate(request({}, {
      requested_session_id: identifier("SessionId", "caller-invented-session"),
    })), "AUTHENTICATION_SESSION_CONTRADICTORY");
  });

  it("expires an elapsed session and creates a fresh evidence-bound session", async () => {
    const elapsedId = identifier("SessionId", "session-elapsed");
    await repositories.sessions.create({
      version: 1,
      session_id: elapsedId,
      principal_id: principalId,
      external_authentication_identity_id: externalId,
      issued_at: "2026-07-29T08:00:00.000Z",
      expires_at: "2026-07-29T09:00:00.000Z",
      assurance: "MULTI_FACTOR",
      lifecycle_state: "ACTIVE",
    });
    const authenticated = await runtime().authenticate(request({}, {
      requested_session_id: elapsedId,
    }));
    expect(authenticated.session_id).not.toBe(elapsedId);
    expect((await repositories.sessions.find(elapsedId))?.lifecycle_state).toBe("EXPIRED");
  });

  it("rotates, logs out, and revokes sessions while preserving lifecycle audit", async () => {
    const authRuntime = runtime();
    const first = await authRuntime.authenticate(request());
    const rotated = await authRuntime.rotate(
      request({}, { requested_session_id: first.session_id }),
      first.session_id,
    );
    expect(rotated.session_id).not.toBe(first.session_id);
    expect((await repositories.sessions.find(first.session_id))?.lifecycle_state).toBe("ROTATED");
    expect(await authRuntime.logout(rotated.session_id, correlationId, "user-action")).toBe(true);
    expect((await repositories.sessions.find(rotated.session_id))?.revocation_reference).toBe("LOGOUT:user-action");

    const revocable = await authRuntime.authenticate(request());
    expect(await authRuntime.revoke(revocable.session_id, correlationId, "security-action")).toBe(true);
    expect((await repositories.sessions.find(revocable.session_id))?.lifecycle_state).toBe("REVOKED");
  });

  it("persists immutable success and rejection audits with evidence lineage", async () => {
    const authenticated = await runtime().authenticate(request());
    const row = await db.prepare(`SELECT * FROM oir_authentication_audit_events
      WHERE authentication_audit_event_id = ?`)
      .bind(authenticated.authentication_audit_event_id).first<Record<string, unknown>>();
    expect(row).toMatchObject({
      principal_id: principalId,
      session_id: authenticated.session_id,
      verification_result: "VERIFIED",
      outcome: "AUTHENTICATED",
      assurance: "MULTI_FACTOR",
      executing_runtime: "operational-identity.authentication.v1",
    });

    await expectCode(runtime().authenticate(request({}, {
      expected_audience: "rejected-audience",
    })), "AUTHENTICATION_AUDIENCE_INVALID");
    expect((await db.prepare(`SELECT COUNT(*) AS count FROM oir_authentication_audit_events
      WHERE outcome = 'REJECTED'`).first<{ count: number }>())?.count).toBe(1);
    await expect(db.prepare(`UPDATE oir_authentication_audit_events SET outcome = 'AUTHENTICATED'
      WHERE authentication_audit_event_id = ?`).bind(authenticated.authentication_audit_event_id).run())
      .rejects.toThrow(/IMMUTABLE/);
  });

  it("keeps the implementation independent of provider protocols and authority concepts", async () => {
    const authenticated = await runtime().authenticate(request());
    expect(authenticated.principal_id).toBe(principalId);
    expect(runtimeSource).not.toMatch(/\b(?:Google|Microsoft|GitHub|Auth0|Keycloak|JWT|OAuth|OpenID Connect|Azure AD)\b/i);
    expect(runtimeSource).not.toMatch(/\b(?:membership|company|tenant|permission|OAG)\b/i);
    const forbiddenTables = await db.prepare(`SELECT COUNT(*) AS count FROM sqlite_master
      WHERE name LIKE '%oag%'`).first<{ count: number }>();
    expect(forbiddenTables?.count).toBe(0);
  });
});
