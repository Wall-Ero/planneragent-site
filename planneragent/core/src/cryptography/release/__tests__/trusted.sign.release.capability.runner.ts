import {
  validateTrustedSignReleaseCapability,
  type TrustedSignProductionConfiguration,
} from "../trusted.sign.release.capability";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const configuration: TrustedSignProductionConfiguration = {
  providerImplementation: "AWS_KMS",
  awsRegion: "eu-west-1",
  awsKmsKeyArn:
    "arn:aws:kms:eu-west-1:111122223333:key/12345678-1234-1234-1234-123456789abc",
  providerCredentialReference: "planneragent-workload-identity",
  replayDatabaseBinding: "TRUSTED_SIGN_REPLAY_DB",
  proofProfileId: "PLANNERAGENT_FDC_SIGN_V1",
  proofProfileVersion: "1",
  signingAlgorithm: "RSASSA_PSS_SHA_256",
  messageType: "RAW",
  antiReplayRequired: true,
  mathematicalVerificationRequired: true,
  p9xCertificationRequired: true,
};
const valid = validateTrustedSignReleaseCapability(configuration);
assert(valid.ready, "production configuration is release-capable");
assert(
  valid.ready &&
    valid.capabilityMatrix.provider === "AWS_KMS" &&
    valid.capabilityMatrix.signingAlgorithm === "RSASSA_PSS_SHA_256" &&
    valid.capabilityMatrix.messageType === "RAW",
  "capability matrix is closed to the frozen V1 tuple",
);
assert(valid.ready && Object.isFrozen(valid.capabilityMatrix),
  "release capability matrix is immutable");
const regionMismatch = validateTrustedSignReleaseCapability({
  ...configuration,
  awsRegion: "us-east-1",
});
assert(!regionMismatch.ready &&
  regionMismatch.failures.includes(
    "AWS_KMS_KEY_ARN_INVALID_OR_REGION_MISMATCH",
  ), "KMS key and configured region must agree");
const weakened = validateTrustedSignReleaseCapability({
  ...configuration,
  antiReplayRequired: false,
  mathematicalVerificationRequired: false,
  p9xCertificationRequired: false,
});
assert(!weakened.ready && weakened.failures.length === 3,
  "disabled security gates fail release validation");
const secret = validateTrustedSignReleaseCapability({
  ...configuration,
  providerCredentialReference: "aws-secret-access-key",
});
assert(!secret.ready &&
  secret.failures.includes("PROVIDER_CREDENTIAL_REFERENCE_INVALID"),
  "raw credential-like configuration is rejected");
console.log("Trusted SIGN release capability runner completed.");
