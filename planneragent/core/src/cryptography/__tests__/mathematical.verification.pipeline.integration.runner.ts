import {
  constants,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import type { GetPublicKeyCommandOutput } from "@aws-sdk/client-kms";
import type { TrustedSignCompositionResult } from "../orchestration/trusted.sign.composition";
import type { AwsKmsSignExecutionResult } from "../provider/implementations/P9J.aws.kms.sign.execution";
import { acquireAwsKmsVerificationMaterial } from "../provider/implementations/P9J.aws.kms.verification.material.acquisition";
import { verifyVerificationMaterialIntegrity } from "../mechanisms/verification.material.integrity";
import { verifySignatureMathematically } from "../mechanisms/signature.mathematical.verification";
import type { ProviderCryptographicAttestationAdmissionResult } from "../provider/runtime/P9W.provider.cryptographic.attestation.verification.admission";
import { integrateP9WMathematicalSignatureVerification } from "../provider/runtime/P9W.mathematical.signature.verification.integration";
import { certifyP9XSignatureAuthenticity } from "../provider/runtime/P9X.signature.authenticity.certification";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function run(): Promise<void> {
  const keyId = "arn:aws:kms:eu-west-1:111122223333:key/example";
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });
  const message = new TextEncoder().encode('{"subject":"canonical"}');
  const signature = new Uint8Array(sign("sha256", message, {
    key: privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  }));
  const composition: TrustedSignCompositionResult = {
    composed: true,
    compositionId: "90000000-0000-4000-8000-000000000001",
    composedAt: "2026-07-26T10:00:00.000Z",
    governanceDecisionId: "20000000-0000-4000-8000-000000000001",
    infrastructureAuthorizationId: "30000000-0000-4000-8000-000000000001",
    mechanismsAuthorizationId: "60000000-0000-4000-8000-000000000001",
    subjectId: "80000000-0000-4000-8000-000000000001",
    tenantId: "tenant-1",
    companyId: "company-1",
    proofProfileId: "PLANNERAGENT_FDC_SIGN_V1",
    proofProfileVersion: "1",
    providerKeyReference: keyId,
    providerAlgorithm: "RSASSA_PSS_SHA_256",
    messageType: "RAW",
    signingInput: message,
  };
  const execution: AwsKmsSignExecutionResult = {
    executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
    providerCallAttempted: true,
    providerCallCompleted: true,
    operation: "SIGN",
    providerImplementation: "AWS_KMS",
    keyId,
    signingAlgorithm: "RSASSA_PSS_SHA_256",
    signature,
  };
  const acquisition = await acquireAwsKmsVerificationMaterial(
    composition,
    execution,
    {
      async send(): Promise<GetPublicKeyCommandOutput> {
        return {
          KeyId: keyId,
          KeyUsage: "SIGN_VERIFY",
          KeySpec: "RSA_2048",
          SigningAlgorithms: ["RSASSA_PSS_SHA_256"],
          PublicKey: new Uint8Array(publicKey.export({
            format: "der",
            type: "spki",
          })),
          $metadata: {},
        };
      },
    },
  );
  const integrity = verifyVerificationMaterialIntegrity(acquisition);
  const mathematical = verifySignatureMathematically(
    composition,
    execution,
    integrity,
    "2026-07-26T10:00:02.000Z",
  );
  if (!mathematical.verified) throw new Error(mathematical.denialReason);

  const admission = {
    admissionStatus: "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED",
    cryptographicAttestationAdmitted: true,
    attestationId: "attestation-1",
    cryptographicOperationId: "operation-1",
    cryptographicContextId: composition.compositionId,
    cryptographicOperationKind: "SIGN",
    providerKeyReference: keyId,
    targetBindingDigest: "a".repeat(64),
    outputArtifact: {
      artifactId: "signature-1",
      artifactKind: "SIGNATURE",
      artifactDigest: mathematical.signatureArtifactDigest,
      artifactDigestAlgorithm: "SHA-256",
    },
  } as ProviderCryptographicAttestationAdmissionResult;
  const integrated = integrateP9WMathematicalSignatureVerification(
    admission,
    mathematical,
  );
  const certified = certifyP9XSignatureAuthenticity(
    integrated,
    "d0000000-0000-4000-8000-000000000001",
    "2026-07-26T10:00:03.000Z",
  );

  assert(acquisition.acquired, "verification material acquired");
  assert(integrity.verified, "verification material integrity established");
  assert(mathematical.verified, "signature mathematically verified");
  assert(integrated.integrated, "mathematical result integrated with P9W");
  assert(certified.certified, "minimal P9X authenticity certified");
  assert(
    certified.certified &&
      !certified.certificate.signerIdentityCertified &&
      !certified.certificate.authorityCertified,
    "pipeline does not overclaim signer identity or authority",
  );
  console.log("Mathematical verification pipeline integration runner completed.");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
