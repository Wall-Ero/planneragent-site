import { constants, generateKeyPairSync, sign } from "node:crypto";
import { GetPublicKeyCommand, SignCommand } from "@aws-sdk/client-kms";
import type { TrustedSignCompositionResult } from "../trusted.sign.composition";
import { runTrustedSignProductionSmoke } from "../trusted.sign.production.smoke";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function run(): Promise<void> {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });
  const keyId = "arn:aws:kms:eu-west-1:111122223333:key/example";
  const composition: Extract<TrustedSignCompositionResult, { composed: true }> = {
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
    signingInput: new TextEncoder().encode('{"subject":"canonical"}'),
  };
  const keys = new Set<string>();
  const smoke = await runTrustedSignProductionSmoke({
    composition,
    reservationId: "e0000000-0000-4000-8000-000000000001",
    reservedAt: "2026-07-26T10:00:01.000Z",
    providerConfigurationRef: "aws-kms-eu-west-1",
    providerCredentialRef: "workload-identity",
    verifiedAt: "2026-07-26T10:00:02.000Z",
    certificateId: "d0000000-0000-4000-8000-000000000001",
    certifiedAt: "2026-07-26T10:00:03.000Z",
    replayStore: { async reserveIfAbsent(value) {
      if (keys.has(value.replayKey)) return false;
      keys.add(value.replayKey);
      return true;
    } },
    signClient: { async send(command) {
      assert(command instanceof SignCommand, "smoke dispatches AWS SignCommand");
      return {
        KeyId: keyId,
        SigningAlgorithm: "RSASSA_PSS_SHA_256",
        Signature: new Uint8Array(sign("sha256", composition.signingInput, {
          key: privateKey,
          padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: 32,
        })),
        $metadata: {},
      };
    } },
    verificationMaterialClient: { async send(command) {
      assert(command instanceof GetPublicKeyCommand,
        "smoke dispatches AWS GetPublicKeyCommand");
      return {
        KeyId: keyId, KeyUsage: "SIGN_VERIFY", KeySpec: "RSA_2048",
        SigningAlgorithms: ["RSASSA_PSS_SHA_256"],
        PublicKey: new Uint8Array(publicKey.export({
          format: "der", type: "spki",
        })),
        $metadata: {},
      };
    } },
    async bindAndAdmitAttestation(_composition, _execution, mathematical) {
      return {
        admissionStatus: "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED",
        cryptographicAttestationAdmitted: true,
        attestationId: "attestation-1",
        cryptographicOperationId: "operation-1",
        cryptographicContextId: composition.compositionId,
        cryptographicOperationKind: "SIGN",
        providerKeyReference: keyId,
        targetBindingDigest: "a".repeat(64),
        outputArtifact: {
          artifactId: "signature-1", artifactKind: "SIGNATURE",
          artifactDigest: mathematical.signatureArtifactDigest,
          artifactDigestAlgorithm: "SHA-256",
        },
      } as never;
    },
  });
  assert(smoke.completed, "production SIGN smoke path reaches P9X");
  assert(smoke.completed && smoke.certificate.certificate.certifiedAt ===
    "2026-07-26T10:00:03.000Z",
    "production smoke returns immutable authenticity certificate");
  console.log("Trusted SIGN production smoke runner completed.");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
