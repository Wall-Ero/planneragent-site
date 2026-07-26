import type { IndustrialCapability } from "./uic.interface";

export type ConnectorIdentity = Readonly<{
  connectorId: string;
  identityId: string;
  credentialReference: string;
}>;

export type WorkloadIdentityEvidence = Readonly<{
  workloadId: string;
  tenantId: string;
  authenticationEvidence: string;
}>;

export type AuthenticatedWorkloadIdentity = Readonly<{
  workloadId: string;
  tenantId: string;
  authenticationId: string;
}>;

export type ResolvedConnectorCredential = Readonly<{
  credentialReference: string;
  secret: string;
}>;

export type ConnectorAuthorizationRequest = Readonly<{
  workload: AuthenticatedWorkloadIdentity;
  connectorIdentity: ConnectorIdentity;
  capability: IndustrialCapability;
}>;

export type ConnectorAccessServices = Readonly<{
  authenticateWorkload(
    evidence: WorkloadIdentityEvidence
  ): Promise<AuthenticatedWorkloadIdentity | null>;
  authorizeConnectorUse(
    request: ConnectorAuthorizationRequest
  ): Promise<boolean>;
  resolveConnectorCredential(
    credentialReference: string
  ): Promise<ResolvedConnectorCredential | null>;
}>;

export type ConnectorExecutionAccess = Readonly<{
  workload: AuthenticatedWorkloadIdentity;
  credential: ResolvedConnectorCredential;
}>;

export type ConnectorAccessDenial =
  | "ACCESS_SERVICES_REQUIRED"
  | "WORKLOAD_AUTHENTICATION_FAILED"
  | "CONNECTOR_AUTHORIZATION_DENIED"
  | "CONNECTOR_CREDENTIAL_UNAVAILABLE"
  | "CONNECTOR_ACCESS_EVALUATION_FAILED";

export function isConnectorIdentityCoherent(
  connectorId: string,
  identity: ConnectorIdentity
): boolean {
  return (
    connectorId.length > 0 &&
    identity.connectorId === connectorId &&
    identity.identityId.length > 0 &&
    identity.credentialReference.length > 0
  );
}
