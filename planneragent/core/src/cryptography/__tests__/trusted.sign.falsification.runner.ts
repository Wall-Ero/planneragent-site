import {
  constants,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import type { TrustedSignCompositionResult } from "../orchestration/trusted.sign.composition";
import {
  reserveTrustedSignExecution,
  type TrustedSignReplayReservationStore,
} from "../orchestration/trusted.sign.anti.replay";
import type { AwsKmsSignExecutionResult } from "../provider/implementations/P9J.aws.kms.sign.execution";
import { verifyVerificationMaterialIntegrity } from "../mechanisms/verification.material.integrity";
import { verifySignatureMathematically } from "../mechanisms/signature.mathematical.verification";
import type { ProviderCryptographicAttestationAdmissionResult } from "../provider/runtime/P9W.provider.cryptographic.attestation.verification.admission";
import { integrateP9WMathematicalSignatureVerification } from "../provider/runtime/P9W.mathematical.signature.verification.integration";
import { certifyP9XSignatureAuthenticity } from "../provider/runtime/P9X.signature.authenticity.certification";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
class Store implements TrustedSignReplayReservationStore {
  private readonly keys = new Set<string>();
  async reserveIfAbsent(value: { replayKey: string }): Promise<boolean> {
    if (this.keys.has(value.replayKey)) return false;
    this.keys.add(value.replayKey);
    return true;
  }
}

async function run(): Promise<void> {
  const keyId = "arn:aws:kms:eu-west-1:111122223333:key/example";
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });
  const { publicKey: otherPublicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });
  const message = new TextEncoder().encode('{"subject":"canonical"}');
  const signature = new Uint8Array(sign("sha256", message, {
    key: privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  }));
  const composition: Extract<TrustedSignCompositionResult, { composed: true }> = {
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
  const execution: Extract<AwsKmsSignExecutionResult, {
    executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED";
  }> = {
    executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
    providerCallAttempted: true,
    providerCallCompleted: true,
    operation: "SIGN",
    providerImplementation: "AWS_KMS",
    keyId,
    signingAlgorithm: "RSASSA_PSS_SHA_256",
    signature,
  };
  const acquired = {
    acquired: true as const,
    providerImplementation: "AWS_KMS" as const,
    providerKeyReference: keyId,
    keyUsage: "SIGN_VERIFY" as const,
    keySpec: "RSA_2048" as const,
    supportedSigningAlgorithms: ["RSASSA_PSS_SHA_256"] as const,
    verificationMaterialFormat: "SPKI_DER" as const,
    verificationMaterial: new Uint8Array(publicKey.export({
      format: "der",
      type: "spki",
    })),
  };
  const material = verifyVerificationMaterialIntegrity(acquired);
  const mathematical = verifySignatureMathematically(
    composition, execution, material, "2026-07-26T10:00:02.000Z",
  );
  assert(mathematical.verified, "control signature verifies");

  const replayStore = new Store();
  await reserveTrustedSignExecution(
    composition, "e0000000-0000-4000-8000-000000000001",
    "2026-07-26T10:00:01.000Z", replayStore,
  );
  const replay = await reserveTrustedSignExecution(
    { ...composition,
      compositionId: "90000000-0000-4000-8000-000000000002" },
    "e0000000-0000-4000-8000-000000000002",
    "2026-07-26T10:00:01.000Z", replayStore,
  );
  assert(!replay.reserved && replay.denialReason === "SIGN_REPLAY_DETECTED",
    "falsification: replay fails closed");

  const changedSubject = verifySignatureMathematically(
    { ...composition, signingInput: new TextEncoder().encode("tampered") },
    execution, material, "2026-07-26T10:00:02.000Z",
  );
  assert(!changedSubject.verified &&
    changedSubject.denialReason === "SIGNATURE_MATHEMATICALLY_INVALID",
    "falsification: subject mutation fails closed");
  const changedSignatureBytes = signature.slice();
  changedSignatureBytes[changedSignatureBytes.length - 1] ^= 1;
  const changedSignature = verifySignatureMathematically(
    composition, { ...execution, signature: changedSignatureBytes },
    material, "2026-07-26T10:00:02.000Z",
  );
  assert(!changedSignature.verified &&
    changedSignature.denialReason === "SIGNATURE_MATHEMATICALLY_INVALID",
    "falsification: signature mutation fails closed");
  const substitutedMaterial = verifyVerificationMaterialIntegrity({
    ...acquired,
    verificationMaterial: new Uint8Array(otherPublicKey.export({
      format: "der",
      type: "spki",
    })),
  });
  const substitutedKey = verifySignatureMathematically(
    composition, execution, substitutedMaterial,
    "2026-07-26T10:00:02.000Z",
  );
  assert(!substitutedKey.verified &&
    substitutedKey.denialReason === "SIGNATURE_MATHEMATICALLY_INVALID",
    "falsification: verification-key substitution fails closed");
  const corruptDer = verifyVerificationMaterialIntegrity({
    ...acquired,
    verificationMaterial: new Uint8Array([48, 1, 0]),
  });
  assert(!corruptDer.verified &&
    corruptDer.denialReason === "VERIFICATION_MATERIAL_DER_INVALID",
    "falsification: corrupt SPKI fails closed");

  if (!mathematical.verified) throw new Error("unreachable");
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
      artifactDigest: "f".repeat(64),
      artifactDigestAlgorithm: "SHA-256",
    },
  } as ProviderCryptographicAttestationAdmissionResult;
  const incoherentP9W = integrateP9WMathematicalSignatureVerification(
    admission, mathematical,
  );
  assert(!incoherentP9W.integrated &&
    incoherentP9W.denialReason === "P9W_MATHEMATICAL_CONTEXT_INCOHERENT",
    "falsification: P9W artifact substitution fails closed");
  const uncertified = certifyP9XSignatureAuthenticity(
    incoherentP9W, "d0000000-0000-4000-8000-000000000001",
    "2026-07-26T10:00:03.000Z",
  );
  assert(!uncertified.certified &&
    uncertified.denialReason ===
      "P9W_MATHEMATICAL_VERIFICATION_NOT_INTEGRATED",
    "falsification: P9X refuses incoherent P9W result");
  console.log("Trusted SIGN falsification runner completed.");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
