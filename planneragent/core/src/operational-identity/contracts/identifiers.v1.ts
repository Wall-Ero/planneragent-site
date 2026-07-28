// Operational Identity Runtime — shared identifiers v1
// These brands prevent sovereign and lifecycle identifiers from being
// interchangeable merely because their wire representation is a string.

declare const identifierBrand: unique symbol;

export type BrandedIdentifier<Kind extends string> = string & {
  readonly [identifierBrand]: Kind;
};

export type ExternalAuthenticationIdentityId =
  BrandedIdentifier<"ExternalAuthenticationIdentityId">;
export type PrincipalId = BrandedIdentifier<"PrincipalId">;
export type SessionId = BrandedIdentifier<"SessionId">;
export type TenantId = BrandedIdentifier<"TenantId">;
export type CompanyId = BrandedIdentifier<"CompanyId">;
export type MembershipId = BrandedIdentifier<"MembershipId">;
export type PlatformRoleId = BrandedIdentifier<"PlatformRoleId">;
export type PlatformPermissionId = BrandedIdentifier<"PlatformPermissionId">;
export type ParticipationContextId =
  BrandedIdentifier<"ParticipationContextId">;
export type AuthorizationDecisionId =
  BrandedIdentifier<"AuthorizationDecisionId">;
export type UploadId = BrandedIdentifier<"UploadId">;
export type UploadOperationalContextId =
  BrandedIdentifier<"UploadOperationalContextId">;
export type ReplayStateReference =
  BrandedIdentifier<"ReplayStateReference">;
export type AuditEventId = BrandedIdentifier<"AuditEventId">;
export type AuditLineageReference =
  BrandedIdentifier<"AuditLineageReference">;
export type CorrelationId = BrandedIdentifier<"CorrelationId">;
export type OagActorId = BrandedIdentifier<"OagActorId">;
export type OagActorBindingId = BrandedIdentifier<"OagActorBindingId">;
export type DeclarationId = BrandedIdentifier<"DeclarationId">;
export type DeclarationVersionId =
  BrandedIdentifier<"DeclarationVersionId">;
export type ConfirmationDecisionId =
  BrandedIdentifier<"ConfirmationDecisionId">;
export type ConfirmationChainId =
  BrandedIdentifier<"ConfirmationChainId">;
export type OagGraphVersionId = BrandedIdentifier<"OagGraphVersionId">;
export type AuthorityProofId = BrandedIdentifier<"AuthorityProofId">;
export type BootstrapCeremonyId =
  BrandedIdentifier<"BootstrapCeremonyId">;
export type PolicyVersionId = BrandedIdentifier<"PolicyVersionId">;

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,255}$/;

export function identifier<Kind extends string>(
  kind: Kind,
  value: string,
): BrandedIdentifier<Kind> {
  if (!IDENTIFIER.test(value)) {
    throw new Error(`INVALID_${kind.toUpperCase()}`);
  }
  return value as BrandedIdentifier<Kind>;
}
