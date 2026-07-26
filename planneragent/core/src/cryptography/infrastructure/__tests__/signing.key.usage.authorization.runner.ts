import {
  decideGovernanceSignRequest,
} from "../../governance/governance.sign.decision";
import {
  authorizeInfrastructureSigningKeyUsage,
  evaluateInfrastructureSigningKeyUsageEligibility,
  type InfrastructureSigningKeyUsageAuthorizationInput,
  type ProviderSigningKeyMappingReference,
} from "../signing.key.usage.authorization";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const governanceDecision = decideGovernanceSignRequest({
  decisionId: "20000000-0000-4000-8000-000000000001",
  decidedAt: "2026-07-26T10:00:00.000Z",
  determination: "AUTHORIZE",
  request: {
    requestId: "10000000-0000-4000-8000-000000000001",
    tenantId: "tenant-1",
    companyId: "company-1",
    operation: "SIGN",
    subjectId: "fdc-1",
    authorityReference: "authority-1",
    requestedAt: "2026-07-26T09:59:00.000Z",
    validFrom: "2026-07-26T09:00:00.000Z",
    validUntil: "2026-07-26T11:00:00.000Z",
  },
});

const mapping: ProviderSigningKeyMappingReference = {
  mappingId: "mapping-1",
  mappingVersion: "1",
  logicalSigningKeyId: "signing-key-1",
  providerContract: "KEY_MANAGEMENT",
  providerImplementation: "AWS_KMS",
  providerKeyReference: "arn:aws:kms:eu-west-1:111122223333:key/example",
  keyFamily: "RSA",
  keySizeBits: 2048,
  keyPurpose: "SIGN_VERIFY",
  tenantId: "tenant-1",
  companyId: "company-1",
  enabled: true,
  validFrom: "2026-07-26T09:00:00.000Z",
  validUntil: "2026-07-26T11:00:00.000Z",
};

const base: InfrastructureSigningKeyUsageAuthorizationInput = {
  authorizationId: "30000000-0000-4000-8000-000000000001",
  authorizedAt: "2026-07-26T10:00:00.000Z",
  governanceDecision,
  availableMappings: [mapping],
  request: {
    requestId: "40000000-0000-4000-8000-000000000001",
    governanceDecisionReference: governanceDecision.decisionId,
    logicalSigningKeyId: "signing-key-1",
    providerMappingId: "mapping-1",
    tenantId: "tenant-1",
    companyId: "company-1",
    requestedAt: "2026-07-26T10:00:00.000Z",
    validFrom: "2026-07-26T09:30:00.000Z",
    validUntil: "2026-07-26T10:30:00.000Z",
  },
};

const authorized = authorizeInfrastructureSigningKeyUsage(base);
assert(authorized.decision === "AUTHORIZED", "exact mapping is authorized");
assert(Object.isFrozen(authorized), "authorization is immutable");
assert(
  authorized.providerMapping?.providerImplementation === "AWS_KMS",
  "exact AWS KMS mapping is bound",
);
assert(
  !("governanceRequestReference" in authorized.request),
  "only the authoritative Governance decision is referenced",
);

function denial(
  patch: Partial<InfrastructureSigningKeyUsageAuthorizationInput>,
): string | undefined {
  return authorizeInfrastructureSigningKeyUsage({ ...base, ...patch }).denialReason;
}

assert(
  denial({
    request: { ...base.request, logicalSigningKeyId: "unknown-key" },
  }) === "LOGICAL_SIGNING_KEY_NOT_FOUND",
  "unknown logical key fails closed",
);
assert(
  denial({ availableMappings: [mapping, { ...mapping }] }) ===
    "PROVIDER_SIGNING_KEY_MAPPING_AMBIGUOUS",
  "ambiguous exact mapping fails closed",
);
assert(
  denial({ availableMappings: [{ ...mapping, enabled: false }] }) ===
    "PROVIDER_SIGNING_KEY_MAPPING_DISABLED",
  "disabled mapping fails closed",
);
assert(
  denial({
    availableMappings: [{
      ...mapping,
      providerImplementation: "NOT_AWS_KMS" as "AWS_KMS",
    }],
  }) === "PROVIDER_SIGNING_KEY_CAPABILITY_UNSUPPORTED",
  "wrong provider fails closed",
);
assert(
  denial({
    availableMappings: [{
      ...mapping,
      keyPurpose: "ENCRYPT_DECRYPT" as "SIGN_VERIFY",
    }],
  }) === "PROVIDER_SIGNING_KEY_CAPABILITY_UNSUPPORTED",
  "wrong key purpose fails closed",
);
assert(
  denial({
    request: { ...base.request, tenantId: "tenant-2" },
  }) === "INFRASTRUCTURE_SIGNING_KEY_SCOPE_INCOHERENT",
  "tenant or company mismatch fails closed",
);
assert(
  evaluateInfrastructureSigningKeyUsageEligibility(
    authorized,
    "2026-07-26T10:31:00.000Z",
  ).reason === "INFRASTRUCTURE_SIGNING_KEY_USAGE_EXPIRED",
  "expiration changes eligibility without mutating authorization",
);

const serialized = JSON.stringify(authorized).toLowerCase();
assert(
  !serialized.includes("credential") &&
    !serialized.includes("secret") &&
    !serialized.includes("privatekey"),
  "authorization contains no credentials or raw private key",
);

console.log("Infrastructure signing-key usage authorization runner completed.");
