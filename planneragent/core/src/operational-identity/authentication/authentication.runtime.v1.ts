import type {
  CorrelationId,
  ExternalAuthenticationIdentityId,
  PrincipalId,
  SessionId,
} from "../contracts/identifiers.v1";
import type {
  AuthenticationAssurance,
  ServerSessionV1,
} from "../contracts/track-a.v1";
import type { ServerSessionRepository } from "../persistence/repositories.v1";
import type {
  AuthenticationAuditRepository,
  AuthenticationEvidenceVerifier,
  AuthenticationIdFactory,
  AuthenticationPrincipalReader,
  AuthenticationReplayRepository,
  PrincipalBindingResolution,
  PrincipalBindingResolver,
} from "./authentication.boundaries.v1";
import {
  AuthenticationRuntimeError,
  type AuthenticatedOperationalSessionV1,
  type AuthenticationAuditEventV1,
  type AuthenticationEvidenceV1,
  type AuthenticationFailureCode,
  type AuthenticationRequestV1,
  type VerifiedAuthenticationIdentityV1,
} from "./authentication.contracts.v1";

const ASSURANCE: Readonly<Record<AuthenticationAssurance, number>> = Object.freeze({
  SINGLE_FACTOR: 1,
  MULTI_FACTOR: 2,
  PHISHING_RESISTANT: 3,
  WORKLOAD_ATTESTED: 3,
});

export interface AuthenticationRuntimeDependencies {
  readonly verifier: AuthenticationEvidenceVerifier;
  readonly replay: AuthenticationReplayRepository;
  readonly bindings: PrincipalBindingResolver;
  readonly principals: AuthenticationPrincipalReader;
  readonly sessions: ServerSessionRepository;
  readonly audit: AuthenticationAuditRepository;
  readonly ids: AuthenticationIdFactory;
  readonly now: () => string;
}

export interface AuthenticationRuntimePolicy {
  readonly session_ttl_ms: number;
  readonly allowed_clock_skew_ms: number;
  readonly executing_runtime: string;
}

function fail(code: AuthenticationFailureCode): never {
  throw new AuthenticationRuntimeError(code);
}

function validText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 2048;
}

function validDate(value: unknown): value is string {
  return validText(value) && Number.isFinite(Date.parse(value));
}

function immutableVerified(
  evidence: AuthenticationEvidenceV1,
  verifiedAt: string,
  reference: string,
): VerifiedAuthenticationIdentityV1 {
  return Object.freeze({
    version: 1,
    evidence_id: evidence.evidence_id,
    authentication_source: evidence.authentication_source,
    actor_kind: evidence.actor_kind,
    issuer: evidence.issuer,
    subject: evidence.subject,
    assurance: evidence.assurance,
    verified_at: verifiedAt,
    evidence_expires_at: evidence.expires_at,
    verification_reference: reference,
    evidence_lineage: Object.freeze([...evidence.evidence_lineage]),
  });
}

export class ProviderAgnosticAuthenticationRuntime {
  constructor(
    private readonly dependencies: AuthenticationRuntimeDependencies,
    private readonly policy: AuthenticationRuntimePolicy,
  ) {
    if (
      !Number.isFinite(policy.session_ttl_ms) ||
      policy.session_ttl_ms <= 0 ||
      !Number.isFinite(policy.allowed_clock_skew_ms) ||
      policy.allowed_clock_skew_ms < 0 ||
      !validText(policy.executing_runtime)
    ) {
      throw new Error("AUTHENTICATION_RUNTIME_POLICY_INVALID");
    }
  }

  async authenticate(request: AuthenticationRequestV1): Promise<AuthenticatedOperationalSessionV1> {
    return this.establish(request, false);
  }

  async rotate(
    request: AuthenticationRequestV1,
    currentSessionId: SessionId,
  ): Promise<AuthenticatedOperationalSessionV1> {
    if (request.requested_session_id !== currentSessionId) {
      return this.reject(request, "AUTHENTICATION_SESSION_CONTRADICTORY");
    }
    return this.establish(request, true);
  }

  async logout(
    sessionId: SessionId,
    correlationId: CorrelationId,
    reference: string,
  ): Promise<boolean> {
    const stored = await this.dependencies.sessions.find(sessionId);
    if (!stored || stored.lifecycle_state !== "ACTIVE") return false;
    const changed = await this.dependencies.sessions.logout(sessionId, reference);
    if (changed) await this.appendLifecycleAudit(stored, correlationId, "LOGGED_OUT", `LOGOUT:${reference}`);
    return changed;
  }

  async revoke(
    sessionId: SessionId,
    correlationId: CorrelationId,
    reference: string,
  ): Promise<boolean> {
    const stored = await this.dependencies.sessions.find(sessionId);
    if (!stored || stored.lifecycle_state !== "ACTIVE") return false;
    const changed = await this.dependencies.sessions.revoke(sessionId, reference);
    if (changed) await this.appendLifecycleAudit(stored, correlationId, "REVOKED", reference);
    return changed;
  }

  private async establish(
    request: AuthenticationRequestV1,
    forceRotation: boolean,
  ): Promise<AuthenticatedOperationalSessionV1> {
    let verified: VerifiedAuthenticationIdentityV1 | undefined;
    let resolution: PrincipalBindingResolution | undefined;
    let persistedPrincipalId: PrincipalId | undefined;
    let session: ServerSessionV1 | undefined;
    try {
      verified = await this.verify(request);
      const resolutions = await this.dependencies.bindings.resolve(
        verified.authentication_source,
        verified.issuer,
        verified.subject,
      );
      if (resolutions.length === 0) fail("AUTHENTICATION_BINDING_UNKNOWN");
      if (resolutions.length !== 1) fail("AUTHENTICATION_BINDING_DUPLICATE");
      resolution = resolutions[0]!;
      this.assertBindingCoherent(verified, resolution);

      const principal = await this.dependencies.principals.find(resolution.principal_id);
      if (!principal) fail("AUTHENTICATION_PRINCIPAL_UNKNOWN");
      persistedPrincipalId = principal.principal_id;
      if (principal.lifecycle_state === "REVOKED") fail("AUTHENTICATION_PRINCIPAL_REVOKED");
      if (principal.lifecycle_state !== "ACTIVE") fail("AUTHENTICATION_PRINCIPAL_DISABLED");
      if (principal.actor_kind !== verified.actor_kind) fail("AUTHENTICATION_BINDING_CONTRADICTORY");

      const restored = request.requested_session_id
        ? await this.restore(request.requested_session_id, resolution, verified, request.minimum_assurance)
        : null;
      if (forceRotation) {
        if (!restored) fail("AUTHENTICATION_SESSION_INELIGIBLE");
        session = await this.rotateSession(restored, verified);
      } else {
        session = restored ?? await this.createSession(resolution, verified);
      }

      const auditId = this.dependencies.ids.auditEventId();
      await this.dependencies.audit.append(this.auditEvent(
        request,
        verified,
        forceRotation ? "ROTATED" : restored ? "RESTORED" : "AUTHENTICATED",
        auditId,
        resolution.principal_id,
        resolution.binding.external_authentication_identity_id,
        session.session_id,
      ));
      return Object.freeze({
        version: 1,
        principal_id: resolution.principal_id,
        session_id: session.session_id,
        external_authentication_identity_id: resolution.binding.external_authentication_identity_id,
        actor_kind: verified.actor_kind,
        assurance: session.assurance,
        authenticated_at: verified.verified_at,
        expires_at: session.expires_at,
        authentication_audit_event_id: auditId,
      });
    } catch (error) {
      if (!(error instanceof AuthenticationRuntimeError)) throw error;
      await this.dependencies.audit.append(this.auditEvent(
        request,
        verified,
        "REJECTED",
        this.dependencies.ids.auditEventId(),
        persistedPrincipalId,
        resolution?.binding.external_authentication_identity_id,
        session?.session_id,
        error.code,
      ));
      throw error;
    }
  }

  private async verify(request: AuthenticationRequestV1): Promise<VerifiedAuthenticationIdentityV1> {
    const evidence = request?.evidence;
    if (
      request?.version !== 1 ||
      evidence?.version !== 1 ||
      !validText(evidence.evidence_id) ||
      !validText(evidence.authentication_source) ||
      !validText(evidence.issuer) ||
      !validText(evidence.subject) ||
      !Array.isArray(evidence.audience) ||
      evidence.audience.length === 0 ||
      !evidence.audience.every(validText) ||
      !validDate(evidence.issued_at) ||
      !validDate(evidence.expires_at) ||
      !validText(evidence.nonce) ||
      !evidence.claims ||
      typeof evidence.claims !== "object" ||
      Array.isArray(evidence.claims) ||
      !validText(evidence.verification_method) ||
      evidence.verification_result !== "VERIFIED" ||
      !(evidence.assurance in ASSURANCE) ||
      !Array.isArray(evidence.evidence_lineage) ||
      !validText(request.expected_issuer) ||
      !validText(request.expected_audience) ||
      !(request.minimum_assurance in ASSURANCE)
    ) {
      fail("AUTHENTICATION_EVIDENCE_MALFORMED");
    }

    const now = Date.parse(this.dependencies.now());
    const issued = Date.parse(evidence.issued_at);
    const expires = Date.parse(evidence.expires_at);
    if (expires <= now || expires <= issued) fail("AUTHENTICATION_EVIDENCE_EXPIRED");
    if (issued > now + this.policy.allowed_clock_skew_ms) fail("AUTHENTICATION_EVIDENCE_NOT_YET_VALID");
    if (evidence.issuer !== request.expected_issuer) fail("AUTHENTICATION_ISSUER_INVALID");
    if (!evidence.audience.includes(request.expected_audience)) fail("AUTHENTICATION_AUDIENCE_INVALID");
    if (ASSURANCE[evidence.assurance] < ASSURANCE[request.minimum_assurance]) {
      fail("AUTHENTICATION_ASSURANCE_INSUFFICIENT");
    }

    const verification = await this.dependencies.verifier.verify(evidence);
    if (!verification.verified || !validText(verification.verification_reference)) {
      fail("AUTHENTICATION_VERIFICATION_REJECTED");
    }
    const reserved = await this.dependencies.replay.reserve({
      replay_key: JSON.stringify([evidence.issuer, evidence.subject, evidence.nonce]),
      evidence_id: evidence.evidence_id,
      nonce: evidence.nonce,
      issuer: evidence.issuer,
      subject: evidence.subject,
      reserved_at: new Date(now).toISOString(),
      expires_at: evidence.expires_at,
    });
    if (!reserved) fail("AUTHENTICATION_EVIDENCE_REPLAYED");
    return immutableVerified(evidence, new Date(now).toISOString(), verification.verification_reference);
  }

  private assertBindingCoherent(
    verified: VerifiedAuthenticationIdentityV1,
    resolution: PrincipalBindingResolution,
  ): void {
    const binding = resolution.binding;
    if (
      binding.provider !== verified.authentication_source ||
      binding.issuer !== verified.issuer ||
      binding.external_subject !== verified.subject ||
      binding.actor_kind !== verified.actor_kind
    ) {
      fail("AUTHENTICATION_BINDING_CONTRADICTORY");
    }
  }

  private async restore(
    sessionId: SessionId,
    resolution: PrincipalBindingResolution,
    verified: VerifiedAuthenticationIdentityV1,
    minimumAssurance: AuthenticationAssurance,
  ): Promise<ServerSessionV1 | null> {
    const stored = await this.dependencies.sessions.find(sessionId);
    if (!stored) fail("AUTHENTICATION_SESSION_CONTRADICTORY");
    if (
      stored.principal_id !== resolution.principal_id ||
      stored.external_authentication_identity_id !== resolution.binding.external_authentication_identity_id
    ) {
      fail("AUTHENTICATION_SESSION_CONTRADICTORY");
    }
    if (stored.lifecycle_state !== "ACTIVE") fail("AUTHENTICATION_SESSION_INELIGIBLE");
    if (Date.parse(stored.expires_at) <= Date.parse(this.dependencies.now())) {
      await this.dependencies.sessions.expire(stored.session_id, `EXPIRED:${verified.evidence_id}`);
      return null;
    }
    if (ASSURANCE[stored.assurance] < ASSURANCE[minimumAssurance]) {
      fail("AUTHENTICATION_SESSION_INELIGIBLE");
    }
    return stored;
  }

  private async createSession(
    resolution: PrincipalBindingResolution,
    verified: VerifiedAuthenticationIdentityV1,
  ): Promise<ServerSessionV1> {
    const issuedAt = this.dependencies.now();
    const expiresAt = new Date(Math.min(
      Date.parse(issuedAt) + this.policy.session_ttl_ms,
      Date.parse(verified.evidence_expires_at),
    )).toISOString();
    const created: ServerSessionV1 = Object.freeze({
      version: 1,
      session_id: this.dependencies.ids.sessionId(),
      principal_id: resolution.principal_id,
      external_authentication_identity_id: resolution.binding.external_authentication_identity_id,
      issued_at: issuedAt,
      expires_at: expiresAt,
      assurance: verified.assurance,
      lifecycle_state: "ACTIVE",
    });
    await this.dependencies.sessions.create(created);
    return created;
  }

  private async rotateSession(
    current: ServerSessionV1,
    verified: VerifiedAuthenticationIdentityV1,
  ): Promise<ServerSessionV1> {
    const replacement: ServerSessionV1 = Object.freeze({
      version: 1,
      session_id: this.dependencies.ids.sessionId(),
      principal_id: current.principal_id,
      external_authentication_identity_id: current.external_authentication_identity_id,
      issued_at: this.dependencies.now(),
      expires_at: new Date(Math.min(
        Date.parse(this.dependencies.now()) + this.policy.session_ttl_ms,
        Date.parse(verified.evidence_expires_at),
      )).toISOString(),
      assurance: verified.assurance,
      lifecycle_state: "ACTIVE",
    });
    await this.dependencies.sessions.rotate(
      current.session_id,
      replacement,
      `AUTHENTICATION_ROTATION:${verified.evidence_id}`,
    );
    return replacement;
  }

  private auditEvent(
    request: AuthenticationRequestV1,
    verified: VerifiedAuthenticationIdentityV1 | undefined,
    outcome: AuthenticationAuditEventV1["outcome"],
    auditId: string,
    principalId?: PrincipalId,
    externalId?: ExternalAuthenticationIdentityId,
    sessionId?: SessionId,
    failureCode?: AuthenticationFailureCode,
  ): AuthenticationAuditEventV1 {
    const evidence = request.evidence;
    return Object.freeze({
      version: 1,
      authentication_audit_event_id: auditId,
      evidence_id: evidence.evidence_id,
      authentication_source: evidence.authentication_source,
      issuer: evidence.issuer,
      subject: evidence.subject,
      ...(externalId ? { external_authentication_identity_id: externalId } : {}),
      ...(principalId ? { principal_id: principalId } : {}),
      ...(sessionId ? { session_id: sessionId } : {}),
      verification_result: verified ? "VERIFIED" : "REJECTED",
      outcome,
      assurance: evidence.assurance,
      ...(verified ? { verification_reference: verified.verification_reference } : {}),
      ...(failureCode ? { failure_code: failureCode } : {}),
      evidence_issued_at: evidence.issued_at,
      evidence_expires_at: evidence.expires_at,
      recorded_at: this.dependencies.now(),
      correlation_id: request.correlation_id,
      evidence_lineage: Object.freeze([...evidence.evidence_lineage]),
      executing_runtime: this.policy.executing_runtime,
    });
  }

  private async appendLifecycleAudit(
    session: ServerSessionV1,
    correlationId: CorrelationId,
    outcome: "LOGGED_OUT" | "REVOKED",
    reference: string,
  ): Promise<void> {
    await this.dependencies.audit.append(Object.freeze({
      version: 1,
      authentication_audit_event_id: this.dependencies.ids.auditEventId(),
      evidence_id: `session-lifecycle:${session.session_id}` as AuthenticationAuditEventV1["evidence_id"],
      authentication_source: "SERVER_SESSION",
      issuer: "SERVER_SESSION",
      subject: session.session_id,
      external_authentication_identity_id: session.external_authentication_identity_id,
      principal_id: session.principal_id,
      session_id: session.session_id,
      verification_result: "VERIFIED",
      outcome,
      assurance: session.assurance,
      verification_reference: reference,
      evidence_issued_at: session.issued_at,
      evidence_expires_at: session.expires_at,
      recorded_at: this.dependencies.now(),
      correlation_id: correlationId,
      evidence_lineage: Object.freeze([]),
      executing_runtime: this.policy.executing_runtime,
    }));
  }

  private async reject(
    request: AuthenticationRequestV1,
    code: AuthenticationFailureCode,
  ): Promise<never> {
    await this.dependencies.audit.append(this.auditEvent(
      request, undefined, "REJECTED", this.dependencies.ids.auditEventId(),
      undefined, undefined, undefined, code,
    ));
    fail(code);
  }
}
