import type { ExternalAuthenticationBindingRepository } from "../persistence/repositories.v1";
import type {
  AuthenticationAuditRepository,
  AuthenticationReplayRepository,
  PrincipalBindingResolver,
} from "./authentication.boundaries.v1";
import type { AuthenticationAuditEventV1 } from "./authentication.contracts.v1";

export class PersistedPrincipalBindingResolver implements PrincipalBindingResolver {
  constructor(private readonly bindings: ExternalAuthenticationBindingRepository) {}

  async resolve(source: string, issuer: string, subject: string) {
    const resolved = await this.bindings.resolve(source, issuer, subject);
    return resolved ? Object.freeze([resolved]) : Object.freeze([]);
  }
}

export class D1AuthenticationReplayRepository implements AuthenticationReplayRepository {
  constructor(private readonly db: D1Database) {}

  async reserve(input: Parameters<AuthenticationReplayRepository["reserve"]>[0]): Promise<boolean> {
    const result = await this.db.prepare(`INSERT OR IGNORE INTO oir_authentication_evidence_replay (
      replay_key, evidence_id, nonce, issuer, subject, reserved_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
      input.replay_key, input.evidence_id, input.nonce, input.issuer,
      input.subject, input.reserved_at, input.expires_at,
    ).run();
    return (result.meta.changes ?? 0) === 1;
  }
}

export class D1AuthenticationAuditRepository implements AuthenticationAuditRepository {
  constructor(private readonly db: D1Database) {}

  async append(event: AuthenticationAuditEventV1): Promise<void> {
    await this.db.prepare(`INSERT INTO oir_authentication_audit_events (
      authentication_audit_event_id, evidence_id, authentication_source, issuer,
      subject, external_authentication_identity_id, principal_id, session_id,
      verification_result, outcome, assurance, verification_reference, failure_code,
      evidence_issued_at, evidence_expires_at, recorded_at, correlation_id,
      evidence_lineage_json, executing_runtime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      event.authentication_audit_event_id, event.evidence_id,
      event.authentication_source, event.issuer, event.subject,
      event.external_authentication_identity_id ?? null, event.principal_id ?? null,
      event.session_id ?? null, event.verification_result, event.outcome,
      event.assurance, event.verification_reference ?? null, event.failure_code ?? null,
      event.evidence_issued_at, event.evidence_expires_at, event.recorded_at,
      event.correlation_id, JSON.stringify(event.evidence_lineage),
      event.executing_runtime,
    ).run();
  }
}
