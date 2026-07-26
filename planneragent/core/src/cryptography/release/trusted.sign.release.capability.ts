export interface TrustedSignProductionConfiguration {
  readonly providerImplementation: string;
  readonly awsRegion: string;
  readonly awsKmsKeyArn: string;
  readonly providerCredentialReference: string;
  readonly replayDatabaseBinding: string;
  readonly proofProfileId: string;
  readonly proofProfileVersion: string;
  readonly signingAlgorithm: string;
  readonly messageType: string;
  readonly antiReplayRequired: boolean;
  readonly mathematicalVerificationRequired: boolean;
  readonly p9xCertificationRequired: boolean;
}

export type TrustedSignReleaseCapabilityValidationResult =
  | Readonly<{
      ready: true;
      capabilityMatrix: Readonly<{
        operation: "SIGN";
        provider: "AWS_KMS";
        keyPurpose: "SIGN_VERIFY";
        keySpec: "RSA_2048";
        proofProfile: "PLANNERAGENT_FDC_SIGN_V1@1";
        signingAlgorithm: "RSASSA_PSS_SHA_256";
        messageType: "RAW";
        verificationMaterial: "AWS_KMS_GET_PUBLIC_KEY_SPKI_DER";
        mathematicalVerification: "RSA_PSS_SHA_256";
        replayCoordination: "D1_ATOMIC_RESERVATION";
        authenticityCertification: "P9X.1";
      }>;
    }>
  | Readonly<{
      ready: false;
      failures: readonly string[];
    }>;

const REGION = /^[a-z]{2}(?:-gov)?-[a-z]+-\d$/;
const KEY_ARN =
  /^arn:aws(?:-us-gov)?:kms:([a-z]{2}(?:-gov)?-[a-z]+-\d):\d{12}:key\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SAFE_REFERENCE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function validateTrustedSignReleaseCapability(
  configuration: TrustedSignProductionConfiguration,
): TrustedSignReleaseCapabilityValidationResult {
  const failures: string[] = [];
  if (configuration.providerImplementation !== "AWS_KMS") {
    failures.push("UNSUPPORTED_PROVIDER");
  }
  if (!REGION.test(configuration.awsRegion)) {
    failures.push("AWS_REGION_INVALID");
  }
  const arn = KEY_ARN.exec(configuration.awsKmsKeyArn);
  if (!arn || arn[1] !== configuration.awsRegion) {
    failures.push("AWS_KMS_KEY_ARN_INVALID_OR_REGION_MISMATCH");
  }
  if (
    !SAFE_REFERENCE.test(configuration.providerCredentialReference) ||
    /secret|password|private.?key|access.?key/i.test(
      configuration.providerCredentialReference,
    )
  ) failures.push("PROVIDER_CREDENTIAL_REFERENCE_INVALID");
  if (configuration.replayDatabaseBinding !== "TRUSTED_SIGN_REPLAY_DB") {
    failures.push("REPLAY_DATABASE_BINDING_INVALID");
  }
  if (
    configuration.proofProfileId !== "PLANNERAGENT_FDC_SIGN_V1" ||
    configuration.proofProfileVersion !== "1"
  ) failures.push("PROOF_PROFILE_UNSUPPORTED");
  if (configuration.signingAlgorithm !== "RSASSA_PSS_SHA_256") {
    failures.push("SIGNING_ALGORITHM_UNSUPPORTED");
  }
  if (configuration.messageType !== "RAW") {
    failures.push("MESSAGE_TYPE_UNSUPPORTED");
  }
  if (!configuration.antiReplayRequired) {
    failures.push("ANTI_REPLAY_NOT_REQUIRED");
  }
  if (!configuration.mathematicalVerificationRequired) {
    failures.push("MATHEMATICAL_VERIFICATION_NOT_REQUIRED");
  }
  if (!configuration.p9xCertificationRequired) {
    failures.push("P9X_CERTIFICATION_NOT_REQUIRED");
  }
  if (failures.length > 0) {
    return Object.freeze({
      ready: false,
      failures: Object.freeze(failures),
    });
  }
  return Object.freeze({
    ready: true,
    capabilityMatrix: Object.freeze({
      operation: "SIGN",
      provider: "AWS_KMS",
      keyPurpose: "SIGN_VERIFY",
      keySpec: "RSA_2048",
      proofProfile: "PLANNERAGENT_FDC_SIGN_V1@1",
      signingAlgorithm: "RSASSA_PSS_SHA_256",
      messageType: "RAW",
      verificationMaterial: "AWS_KMS_GET_PUBLIC_KEY_SPKI_DER",
      mathematicalVerification: "RSA_PSS_SHA_256",
      replayCoordination: "D1_ATOMIC_RESERVATION",
      authenticityCertification: "P9X.1",
    }),
  });
}
