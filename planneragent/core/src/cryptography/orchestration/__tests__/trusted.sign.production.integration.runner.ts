import { constants, generateKeyPairSync, sign } from "node:crypto";
import type { TrustedSignCompositionResult } from "../trusted.sign.composition";
import { runIntegratedTrustedSignProduction } from "../trusted.sign.production.integration";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function run() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const keyId = "arn:kms:key";
  const composition = {
    composed: true,
    compositionId: "90000000-0000-4000-8000-000000000001",
    composedAt: "2026-07-26T10:00:00.000Z",
    governanceDecisionId: "20000000-0000-4000-8000-000000000001",
    infrastructureAuthorizationId: "30000000-0000-4000-8000-000000000001",
    mechanismsAuthorizationId: "60000000-0000-4000-8000-000000000001",
    subjectId: "80000000-0000-4000-8000-000000000001",
    tenantId: "tenant-1", companyId: "company-1",
    proofProfileId: "PLANNERAGENT_FDC_SIGN_V1", proofProfileVersion: "1",
    providerKeyReference: keyId, providerAlgorithm: "RSASSA_PSS_SHA_256",
    messageType: "RAW",
    signingInput: new TextEncoder().encode("canonical-subject"),
  } satisfies Extract<TrustedSignCompositionResult, { composed: true }>;
  const replayKeys = new Set<string>();
  const evidenceIds = new Set<string>();
  const result = await runIntegratedTrustedSignProduction({
    composition,
    reservationId: "e0000000-0000-4000-8000-000000000001",
    reservedAt: "2026-07-26T10:00:01.000Z",
    providerConfigurationRef: "aws-kms-eu-west-1",
    providerCredentialRef: "workload-identity",
    verifiedAt: "2026-07-26T10:00:02.000Z",
    certificateId: "d0000000-0000-4000-8000-000000000001",
    certifiedAt: "2026-07-26T10:00:03.000Z",
    replayStore: { async reserveIfAbsent(value) {
      if (replayKeys.has(value.replayKey)) return false;
      replayKeys.add(value.replayKey);
      return true;
    } },
    signClient: { async send() {
      return {
        KeyId: keyId, SigningAlgorithm: "RSASSA_PSS_SHA_256",
        Signature: new Uint8Array(sign("sha256", composition.signingInput, {
          key: privateKey, padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: 32,
        })),
        $metadata: {},
      };
    } },
    verificationMaterialClient: { async send() {
      return {
        KeyId: keyId, KeyUsage: "SIGN_VERIFY", KeySpec: "RSA_2048",
        SigningAlgorithms: ["RSASSA_PSS_SHA_256"],
        PublicKey: new Uint8Array(publicKey.export({
          format: "der", type: "spki",
        })),
        $metadata: {},
      };
    } },
    runtimeLedgerBinding: {} as never,
    cryptographicOperationId: "a0000000-0000-4000-8000-000000000001",
    observedAt: "2026-07-26T10:00:01.000Z",
    attestationId: "attestation-1",
    attestedAt: "2026-07-26T10:00:02.000Z",
    evidenceId: "f0000000-0000-4000-8000-000000000001",
    auditRecordId: "f0000000-0000-4000-8000-000000000002",
    persistedAt: "2026-07-26T10:00:04.000Z",
    evidenceAuditStore: { async appendIfAbsent(record) {
      if (evidenceIds.has(record.certificateId)) return false;
      evidenceIds.add(record.certificateId);
      return true;
    } },
  }, {
    bindAndAdmit(input) {
      return {
        admissionStatus: "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED",
        cryptographicAttestationAdmitted: true,
        attestationId: input.attestationId,
        cryptographicOperationId: input.cryptographicOperationId,
        cryptographicContextId: input.composition.compositionId,
        cryptographicOperationKind: "SIGN",
        providerKeyReference: keyId,
        targetBindingDigest: "a".repeat(64),
        outputArtifact: {
          artifactId: "signature-1", artifactKind: "SIGNATURE",
          artifactDigest:
            input.mathematicalVerification.signatureArtifactDigest,
          artifactDigestAlgorithm: "SHA-256",
        },
      } as never;
    },
  });
  assert(result.completed, "integrated production path completes");
  assert(result.completed && Boolean(result.evidenceId) &&
    /^[0-9a-f]{64}$/.test(result.auditRecordDigest),
    "P9X certificate reaches immutable evidence and audit");
  console.log("Integrated trusted SIGN production runner completed.");
}
run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
