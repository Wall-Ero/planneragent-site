import type { TrustedSignCompositionResult } from "../../../orchestration/trusted.sign.composition";
import type { AwsKmsSignExecutionResult } from "../../implementations/P9J.aws.kms.sign.execution";
import { createAwsKmsSignOperationFact } from "../P9V.aws.kms.sign.operation.fact";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const composition: TrustedSignCompositionResult = {
  composed: true, compositionId: "90000000-0000-4000-8000-000000000001",
  composedAt: "2026-07-26T10:00:00.000Z",
  governanceDecisionId: "20000000-0000-4000-8000-000000000001",
  infrastructureAuthorizationId: "30000000-0000-4000-8000-000000000001",
  mechanismsAuthorizationId: "60000000-0000-4000-8000-000000000001",
  subjectId: "80000000-0000-4000-8000-000000000001",
  tenantId: "tenant-1", companyId: "company-1",
  proofProfileId: "PLANNERAGENT_FDC_SIGN_V1", proofProfileVersion: "1",
  providerKeyReference: "arn:kms:key", providerAlgorithm: "RSASSA_PSS_SHA_256",
  messageType: "RAW", signingInput: new TextEncoder().encode("subject"),
};
const execution: AwsKmsSignExecutionResult = {
  executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
  providerCallAttempted: true, providerCallCompleted: true,
  operation: "SIGN", providerImplementation: "AWS_KMS",
  keyId: "arn:kms:key", signingAlgorithm: "RSASSA_PSS_SHA_256",
  signature: Uint8Array.from([1, 2, 3]),
};
const fact = createAwsKmsSignOperationFact(composition, execution,
  "a0000000-0000-4000-8000-000000000001", "2026-07-26T10:00:01.000Z");
assert(fact.created, "completed SIGN creates observed operation fact");
assert(fact.created && fact.operationFact.cryptographicOperationKind === "SIGN" &&
  fact.operationFact.outputArtifact?.artifactKind === "SIGNATURE",
  "P9V receives SIGN and signature identities");
assert(fact.created && !("signature" in fact.operationFact),
  "P9V fact does not contain raw signature bytes");
const mismatch = createAwsKmsSignOperationFact(composition,
  { ...execution, keyId: "arn:kms:other" },
  "a0000000-0000-4000-8000-000000000001", "2026-07-26T10:00:01.000Z");
assert(!mismatch.created && mismatch.denialReason === "SIGN_RESULT_INCOHERENT",
  "provider key substitution fails closed");
console.log("P9V AWS KMS SIGN operation fact runner completed.");
