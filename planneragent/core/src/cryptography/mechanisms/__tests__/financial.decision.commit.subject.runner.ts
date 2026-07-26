import {
  materializeFinancialDecisionCommitSubjectV1,
  type FinancialDecisionCommitSubjectFactsV1,
  type ImmutableApplicationReferenceV1,
} from "../financial.decision.commit.subject";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const reference = (
  referenceType: string,
  referencedId: string,
): ImmutableApplicationReferenceV1 => ({
  referenceType,
  referenceProfileVersion: "1",
  referencedId,
  referencedObjectVersion: "1",
  tenantId: "tenant-1",
  companyId: "company-1",
  immutableLocator: `app://${referenceType}/${referencedId}/1`,
});

const facts: FinancialDecisionCommitSubjectFactsV1 = {
  financialCommitId: "70000000-0000-4000-8000-000000000001",
  tenantId: "tenant-1",
  companyId: "company-1",
  commitmentTime: "2026-07-26T10:00:00.000Z",
  procurementRequirementReference: reference("PROCUREMENT_REQUIREMENT", "pr-1"),
  procurementCategoryReference: reference("PROCUREMENT_CATEGORY", "material"),
  counterpartyReference: reference("COUNTERPARTY", "counterparty-1"),
  monetaryValue: {
    monetaryValueProfileVersion: "1",
    minorUnits: "12500",
    currency: "EUR",
    currencyRegistryVersion: "1",
  },
  decisionReference: reference("FINANCIAL_DECISION", "decision-1"),
  authorityPolicyLineageReference: reference("AUTHORITY_POLICY_LINEAGE", "apl-1"),
  humanAccountabilityReference: reference("HUMAN_ACCOUNTABILITY", "ha-1"),
};

const subjectId = "80000000-0000-4000-8000-000000000001";
const first = materializeFinancialDecisionCommitSubjectV1(
  facts,
  () => subjectId,
);
const second = materializeFinancialDecisionCommitSubjectV1(
  facts,
  () => subjectId,
);
assert(first.materialized && second.materialized, "closed facts materialize");
assert(
  first.materialized &&
    second.materialized &&
    new TextDecoder().decode(first.canonicalSubjectBytes) ===
      new TextDecoder().decode(second.canonicalSubjectBytes),
  "identical facts produce identical canonical subject bytes",
);
assert(
  first.materialized &&
    first.subject.subjectId !== first.subject.financialCommitId,
  "subject and financial commitment identities remain distinct",
);
assert(
  first.materialized && Object.isFrozen(first.subject.purpose),
  "materialized subject is deeply immutable",
);

const unknown = materializeFinancialDecisionCommitSubjectV1(
  { ...facts, unexpected: "forbidden" } as FinancialDecisionCommitSubjectFactsV1,
  () => subjectId,
);
assert(
  !unknown.materialized && unknown.denialReason === "SUBJECT_FACTS_NOT_CLOSED",
  "unknown fields fail closed",
);
const scopeMismatch = materializeFinancialDecisionCommitSubjectV1(
  {
    ...facts,
    counterpartyReference: {
      ...facts.counterpartyReference,
      companyId: "company-2",
    },
  },
  () => subjectId,
);
assert(
  !scopeMismatch.materialized &&
    scopeMismatch.denialReason === "SUBJECT_REFERENCE_INVALID",
  "reference scope contradiction fails closed",
);
const nonCanonicalMoney = materializeFinancialDecisionCommitSubjectV1(
  {
    ...facts,
    monetaryValue: { ...facts.monetaryValue, minorUnits: "012500" },
  },
  () => subjectId,
);
assert(
  !nonCanonicalMoney.materialized &&
    nonCanonicalMoney.denialReason === "SUBJECT_MONETARY_VALUE_INVALID",
  "non-canonical monetary values fail closed",
);

console.log("Financial Decision Commit subject runner completed.");
