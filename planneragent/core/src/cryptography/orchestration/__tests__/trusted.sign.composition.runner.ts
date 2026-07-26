import { decideGovernanceSignRequest } from "../../governance/governance.sign.decision";
import { authorizeInfrastructureSigningKeyUsage } from "../../infrastructure/signing.key.usage.authorization";
import { materializeFinancialDecisionCommitSubjectV1, type ImmutableApplicationReferenceV1 } from "../../mechanisms/financial.decision.commit.subject";
import { authorizeMechanismsProofProfile } from "../../mechanisms/signing.proof.profile.authorization";
import { composeTrustedSignPreCall } from "../trusted.sign.composition";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
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
  monetaryValue: { monetaryValueProfileVersion: "1", minorUnits: "100",
    currency: "EUR", currencyRegistryVersion: "1" },
  decisionReference: ref("FINANCIAL_DECISION", "d-1"),
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
  authorizedAt: "2026-07-26T10:00:00.000Z", governanceDecision: governance,
  request: { requestId: "40000000-0000-4000-8000-000000000001",
    governanceDecisionReference: governance.decisionId,
    logicalSigningKeyId: "key-1", providerMappingId: "mapping-1",
    tenantId, companyId, requestedAt: "2026-07-26T10:00:00.000Z",
    validFrom: "2026-07-26T09:00:00.000Z",
    validUntil: "2026-07-26T11:00:00.000Z" },
  availableMappings: [{ mappingId: "mapping-1", mappingVersion: "1",
    logicalSigningKeyId: "key-1", providerContract: "KEY_MANAGEMENT",
    providerImplementation: "AWS_KMS", providerKeyReference: "arn:kms:key",
    keyFamily: "RSA", keySizeBits: 2048, keyPurpose: "SIGN_VERIFY",
    tenantId, companyId, enabled: true,
    validFrom: "2026-07-26T09:00:00.000Z",
    validUntil: "2026-07-26T11:00:00.000Z" }],
});
const mechanisms = authorizeMechanismsProofProfile({
  requestId: "50000000-0000-4000-8000-000000000001",
  profileId: "PLANNERAGENT_FDC_SIGN_V1", profileVersion: "1",
}, "60000000-0000-4000-8000-000000000001", "2026-07-26T10:00:00.000Z");
const input = { compositionId: "90000000-0000-4000-8000-000000000001",
  composedAt: "2026-07-26T10:00:00.000Z", governanceDecision: governance,
  infrastructureAuthorization: infrastructure,
  mechanismsAuthorization: mechanisms, subjectMaterialization: subject };
const composed = composeTrustedSignPreCall(input);
assert(composed.composed, "authoritative results compose");
assert(composed.composed && composed.messageType === "RAW", "RAW input is preserved");
assert(composed.composed && Object.isFrozen(composed), "composition is immutable");
assert(composeTrustedSignPreCall({ ...input,
  composedAt: "2026-07-26T12:00:00.000Z" }).composed === false,
  "expired authority fails closed");
const wrongSubject = materializeFinancialDecisionCommitSubjectV1({
  ...(subject.materialized ? {
    financialCommitId: subject.subject.financialCommitId, tenantId, companyId,
    commitmentTime: subject.subject.commitmentTime,
    procurementRequirementReference: subject.subject.purpose.procurementRequirementReference,
    procurementCategoryReference: subject.subject.purpose.procurementCategoryReference,
    counterpartyReference: subject.subject.counterpartyReference,
    monetaryValue: subject.subject.monetaryValue,
    decisionReference: subject.subject.decisionReference,
    authorityPolicyLineageReference: subject.subject.authorityPolicyLineageReference,
    humanAccountabilityReference: subject.subject.humanAccountabilityReference,
  } : {} as never),
}, () => "80000000-0000-4000-8000-000000000002");
const incoherent = composeTrustedSignPreCall({ ...input, subjectMaterialization: wrongSubject });
assert(!incoherent.composed && incoherent.denialReason === "AUTHORITATIVE_RESULTS_INCOHERENT",
  "cross-family identity contradiction fails closed");
console.log("Trusted SIGN composition runner completed.");
