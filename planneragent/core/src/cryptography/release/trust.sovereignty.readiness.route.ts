import {
  validateTrustedSignReleaseCapability,
} from "./trusted.sign.release.capability";

export interface TrustSovereigntyReadinessEnvironment {
  readonly TRUSTED_SIGN_REPLAY_DB?: unknown;
  readonly TRUSTED_SIGN_EVIDENCE_DB?: unknown;
  readonly TRUSTED_SIGN_AWS_REGION?: string;
  readonly TRUSTED_SIGN_AWS_KMS_KEY_ARN?: string;
  readonly TRUSTED_SIGN_AWS_CREDENTIAL_REFERENCE?: string;
}

export function trustSovereigntyReadinessResponse(
  env: TrustSovereigntyReadinessEnvironment,
): Response {
  const capability = validateTrustedSignReleaseCapability({
    providerImplementation: "AWS_KMS",
    awsRegion: env.TRUSTED_SIGN_AWS_REGION ?? "",
    awsKmsKeyArn: env.TRUSTED_SIGN_AWS_KMS_KEY_ARN ?? "",
    providerCredentialReference:
      env.TRUSTED_SIGN_AWS_CREDENTIAL_REFERENCE ?? "",
    replayDatabaseBinding: env.TRUSTED_SIGN_REPLAY_DB
      ? "TRUSTED_SIGN_REPLAY_DB"
      : "",
    proofProfileId: "PLANNERAGENT_FDC_SIGN_V1",
    proofProfileVersion: "1",
    signingAlgorithm: "RSASSA_PSS_SHA_256",
    messageType: "RAW",
    antiReplayRequired: true,
    mathematicalVerificationRequired: true,
    p9xCertificationRequired: true,
  });
  const evidenceConfigured = Boolean(env.TRUSTED_SIGN_EVIDENCE_DB);
  const ready = capability.ready && evidenceConfigured;
  return new Response(JSON.stringify({
    ready,
    architecture: "COMPLETE",
    productionIntegration: "COMPLETE",
    productionConfiguration: ready ? "VALID" : "INVALID",
    failures: [
      ...(capability.ready ? [] : capability.failures),
      ...(evidenceConfigured ? [] : ["EVIDENCE_DATABASE_BINDING_MISSING"]),
    ],
  }), {
    status: ready ? 200 : 503,
    headers: { "Content-Type": "application/json" },
  });
}
