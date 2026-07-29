import type {
  ExternalAuthenticationIdentityId,
  PrincipalId,
} from "../contracts/identifiers.v1";
import type {
  DurablePrincipalV1,
  ExternalAuthenticationIdentityV1,
} from "../contracts/track-a.v1";
import type {
  AuthenticationAuditEventV1,
  AuthenticationEvidenceV1,
} from "./authentication.contracts.v1";

export interface AuthenticationEvidenceVerifier {
  verify(evidence: AuthenticationEvidenceV1): Promise<Readonly<{
    verified: boolean;
    verification_reference?: string;
  }>>;
}

export interface AuthenticationReplayRepository {
  reserve(input: Readonly<{
    replay_key: string;
    evidence_id: string;
    nonce: string;
    issuer: string;
    subject: string;
    reserved_at: string;
    expires_at: string;
  }>): Promise<boolean>;
}

export interface PrincipalBindingResolution {
  readonly binding: ExternalAuthenticationIdentityV1;
  readonly principal_id: PrincipalId;
}

export interface PrincipalBindingResolver {
  resolve(authenticationSource: string, issuer: string, subject: string): Promise<readonly PrincipalBindingResolution[]>;
}

export interface AuthenticationPrincipalReader {
  find(principalId: PrincipalId): Promise<DurablePrincipalV1 | null>;
}

export interface AuthenticationAuditRepository {
  append(event: AuthenticationAuditEventV1): Promise<void>;
}

export interface AuthenticationIdFactory {
  sessionId(): import("../contracts/identifiers.v1").SessionId;
  auditEventId(): string;
}
