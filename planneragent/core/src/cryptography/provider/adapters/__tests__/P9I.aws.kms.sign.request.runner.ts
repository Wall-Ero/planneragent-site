import { mapAwsKmsSignAdapterRequest } from "../P9I.aws.kms.sign.request";
import type { TrustedSignCompositionResult } from "../../../orchestration/trusted.sign.composition";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const composition: TrustedSignCompositionResult = Object.freeze({
  composed: true,
  compositionId: "90000000-0000-4000-8000-000000000001",
  composedAt: "2026-07-26T10:00:00.000Z",
  governanceDecisionId: "20000000-0000-4000-8000-000000000001",
  infrastructureAuthorizationId: "30000000-0000-4000-8000-000000000001",
  mechanismsAuthorizationId: "60000000-0000-4000-8000-000000000001",
  subjectId: "80000000-0000-4000-8000-000000000001",
  proofProfileId: "PLANNERAGENT_FDC_SIGN_V1",
  proofProfileVersion: "1",
  providerKeyReference: "arn:aws:kms:eu-west-1:111122223333:key/example",
  providerAlgorithm: "RSASSA_PSS_SHA_256",
  messageType: "RAW",
  signingInput: new TextEncoder().encode('{"subject":"exact"}'),
});
const mapped = mapAwsKmsSignAdapterRequest(
  composition, "aws-kms-eu-west-1", "workload-identity",
);
assert(mapped.mapped, "trusted composition maps to SIGN adapter request");
assert(mapped.mapped && mapped.adapterRequest.operation === "SIGN" &&
  mapped.adapterRequest.providerImplementation === "AWS_KMS",
  "operation and provider are translated exactly");
assert(mapped.mapped &&
  mapped.adapterRequest.executionMetadata?.messageType === "RAW" &&
  mapped.adapterRequest.executionMetadata?.signingAlgorithm ===
    "RSASSA_PSS_SHA_256",
  "RAW and signing algorithm are preserved without reinterpretation");
const denied = mapAwsKmsSignAdapterRequest({
  composed: false, compositionId: composition.compositionId,
  composedAt: composition.composedAt,
  denialReason: "AUTHORITATIVE_RESULTS_INCOHERENT",
}, "aws-kms-eu-west-1", "workload-identity");
assert(!denied.mapped &&
  denied.denialReason === "TRUSTED_SIGN_COMPOSITION_REQUIRED",
  "untrusted input never reaches provider translation");
console.log("AWS KMS SIGN adapter request runner completed.");
