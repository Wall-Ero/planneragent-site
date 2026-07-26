import type { SignCommandOutput } from "@aws-sdk/client-kms";
import { decideGovernanceSignRequest } from "../governance/governance.sign.decision";
import { authorizeInfrastructureSigningKeyUsage } from "../infrastructure/signing.key.usage.authorization";
import { materializeFinancialDecisionCommitSubjectV1, type ImmutableApplicationReferenceV1 } from "../mechanisms/financial.decision.commit.subject";
import { authorizeMechanismsProofProfile } from "../mechanisms/signing.proof.profile.authorization";
import { composeTrustedSignPreCall } from "../orchestration/trusted.sign.composition";
import { mapAwsKmsSignAdapterRequest } from "../provider/adapters/P9I.aws.kms.sign.request";
import { executeAwsKmsSign, type AwsKmsSignClient } from "../provider/implementations/P9J.aws.kms.sign.execution";
import { createAwsKmsSignOperationFact } from "../provider/runtime/P9V.aws.kms.sign.operation.fact";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function run(): Promise<void> {
  const tenantId = "tenant-1";
  const companyId = "company-1";
  const subjectId = "80000000-0000-4000-8000-000000000001";
  const ref = (type: string, id: string): ImmutableApplicationReferenceV1 => ({
    referenceType: type, referenceProfileVersion: "1", referencedId: id,
    referencedObjectVersion: "1", tenantId, companyId,
    immutableLocator: `app://${type}/${id}/1`,
  });
  const subject = materializeFinancialDecisionCommitSubjectV1({
    financialCommitId: "70000000-0000-4000-8000-000000000001",
    tenantId, companyId, commitmentTime: "2026-07-26T10:00:00.000Z",
    procurementRequirementReference: ref("PROCUREMENT_REQUIREMENT", "pr-1"),
    procurementCategoryReference: ref("PROCUREMENT_CATEGORY", "material"),
    counterpartyReference: ref("COUNTERPARTY", "cp-1"),
    monetaryValue: { monetaryValueProfileVersion: "1", minorUnits: "5000",
      currency: "EUR", currencyRegistryVersion: "1" },
    decisionReference: ref("FINANCIAL_DECISION", "decision-1"),
    authorityPolicyLineageReference: ref("AUTHORITY_POLICY_LINEAGE", "ap-1"),
    humanAccountabilityReference: ref("HUMAN_ACCOUNTABILITY", "ha-1"),
  }, () => subjectId);
  const governance = decideGovernanceSignRequest({
    decisionId: "20000000-0000-4000-8000-000000000001",
    decidedAt: "2026-07-26T10:00:00.000Z", determination: "AUTHORIZE",
    request: { requestId: "10000000-0000-4000-8000-000000000001",
      tenantId, companyId, operation: "SIGN", subjectId,
      authorityReference: "authority-1",
      requestedAt: "2026-07-26T10:00:00.000Z",
      validFrom: "2026-07-26T09:00:00.000Z",
      validUntil: "2026-07-26T11:00:00.000Z" },
  });
  const infrastructure = authorizeInfrastructureSigningKeyUsage({
    authorizationId: "30000000-0000-4000-8000-000000000001",
    authorizedAt: "2026-07-26T10:00:00.000Z",
    governanceDecision: governance,
    request: { requestId: "40000000-0000-4000-8000-000000000001",
      governanceDecisionReference: governance.decisionId,
      logicalSigningKeyId: "signing-key-1", providerMappingId: "mapping-1",
      tenantId, companyId, requestedAt: "2026-07-26T10:00:00.000Z",
      validFrom: "2026-07-26T09:00:00.000Z",
      validUntil: "2026-07-26T11:00:00.000Z" },
    availableMappings: [{ mappingId: "mapping-1", mappingVersion: "1",
      logicalSigningKeyId: "signing-key-1", providerContract: "KEY_MANAGEMENT",
      providerImplementation: "AWS_KMS",
      providerKeyReference: "arn:aws:kms:eu-west-1:111122223333:key/example",
      keyFamily: "RSA", keySizeBits: 2048, keyPurpose: "SIGN_VERIFY",
      tenantId, companyId, enabled: true,
      validFrom: "2026-07-26T09:00:00.000Z",
      validUntil: "2026-07-26T11:00:00.000Z" }],
  });
  const mechanisms = authorizeMechanismsProofProfile({
    requestId: "50000000-0000-4000-8000-000000000001",
    profileId: "PLANNERAGENT_FDC_SIGN_V1", profileVersion: "1",
  }, "60000000-0000-4000-8000-000000000001",
  "2026-07-26T10:00:00.000Z");
  const composition = composeTrustedSignPreCall({
    compositionId: "90000000-0000-4000-8000-000000000001",
    composedAt: "2026-07-26T10:00:00.000Z",
    governanceDecision: governance,
    infrastructureAuthorization: infrastructure,
    mechanismsAuthorization: mechanisms,
    subjectMaterialization: subject,
  });
  const adapter = mapAwsKmsSignAdapterRequest(
    composition, "aws-kms-eu-west-1", "workload-identity",
  );
  if (!adapter.mapped) throw new Error(adapter.denialReason);

  let calls = 0;
  const client: AwsKmsSignClient = {
    async send(command): Promise<SignCommandOutput> {
      calls += 1;
      assert(command.input.MessageType === "RAW",
        "provider receives exact RAW semantics");
      return {
        KeyId: adapter.adapterRequest.providerResourceId,
        SigningAlgorithm: "RSASSA_PSS_SHA_256",
        Signature: Uint8Array.from([10, 20, 30, 40]),
        $metadata: {},
      };
    },
  };
  const execution = await executeAwsKmsSign(adapter.adapterRequest, client);
  const operationFact = createAwsKmsSignOperationFact(
    composition, execution,
    "a0000000-0000-4000-8000-000000000001",
    "2026-07-26T10:00:01.000Z",
  );
  assert(governance.decision === "AUTHORIZED", "Governance authorizes legitimacy");
  assert(infrastructure.decision === "AUTHORIZED", "Infrastructure authorizes key usage");
  assert(mechanisms.decision === "AUTHORIZED", "Mechanisms authorizes exact tuple");
  assert(composition.composed, "trusted pre-call composition completes");
  assert(calls === 1, "exactly one AWS KMS SIGN dispatch occurs");
  assert(execution.executionStatus === "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
    "provider execution completes");
  assert(operationFact.created &&
    operationFact.operationFact.cryptographicOperationKind === "SIGN",
    "completed SIGN is materialized for P9V binding");
  assert(operationFact.created &&
    operationFact.operationFact.providerKeyReference ===
      "arn:aws:kms:eu-west-1:111122223333:key/example",
    "authorized provider key remains coherent through P9V");
  console.log("Trusted SIGN pipeline integration runner completed.");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
