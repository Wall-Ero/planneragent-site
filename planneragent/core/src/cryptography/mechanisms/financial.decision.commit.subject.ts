// ============================================================
// PlannerAgent - Financial Decision Commit Signing Subject V1
// ============================================================
//
// A closed application object materialized before provider execution.
// This canonicalization is the pre-call signing-subject representation;
// it is independent from P9V completed-operation binding.
// ============================================================

export interface ImmutableApplicationReferenceV1 {
  readonly referenceType: string;
  readonly referenceProfileVersion: "1";
  readonly referencedId: string;
  readonly referencedObjectVersion: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly immutableLocator: string;
}

export interface ExactMonetaryValueV1 {
  readonly monetaryValueProfileVersion: "1";
  readonly minorUnits: string;
  readonly currency: "EUR" | "USD";
  readonly currencyRegistryVersion: "1";
}

export interface FinancialDecisionCommitSubjectV1 {
  readonly subjectType: "FINANCIAL_DECISION_COMMIT";
  readonly subjectSchemaVersion: "1";
  readonly subjectId: string;
  readonly financialCommitId: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly subjectDomain: "FINANCE";
  readonly commitmentTime: string;
  readonly commitmentKind: "SPEND";
  readonly purpose: Readonly<{
    purposeType: "PROCUREMENT";
    procurementRequirementReference:
      Readonly<ImmutableApplicationReferenceV1>;
    procurementCategoryReference:
      Readonly<ImmutableApplicationReferenceV1>;
  }>;
  readonly counterpartyReference:
    Readonly<ImmutableApplicationReferenceV1>;
  readonly monetaryValue: Readonly<ExactMonetaryValueV1>;
  readonly decisionReference:
    Readonly<ImmutableApplicationReferenceV1>;
  readonly authorityPolicyLineageReference:
    Readonly<ImmutableApplicationReferenceV1>;
  readonly humanAccountabilityReference:
    Readonly<ImmutableApplicationReferenceV1>;
  readonly constraints: readonly never[];
}

export interface FinancialDecisionCommitSubjectFactsV1 {
  readonly financialCommitId: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly commitmentTime: string;
  readonly procurementRequirementReference: ImmutableApplicationReferenceV1;
  readonly procurementCategoryReference: ImmutableApplicationReferenceV1;
  readonly counterpartyReference: ImmutableApplicationReferenceV1;
  readonly monetaryValue: ExactMonetaryValueV1;
  readonly decisionReference: ImmutableApplicationReferenceV1;
  readonly authorityPolicyLineageReference: ImmutableApplicationReferenceV1;
  readonly humanAccountabilityReference: ImmutableApplicationReferenceV1;
}

export type FinancialDecisionCommitSubjectDenialReason =
  | "SUBJECT_FACTS_NOT_CLOSED"
  | "SUBJECT_IDENTITY_INVALID"
  | "SUBJECT_TIMESTAMP_INVALID"
  | "SUBJECT_MONETARY_VALUE_INVALID"
  | "SUBJECT_REFERENCE_INVALID"
  | "SUBJECT_SCOPE_INCOHERENT";

export type FinancialDecisionCommitSubjectMaterialization =
  | Readonly<{
      materialized: true;
      subject: Readonly<FinancialDecisionCommitSubjectV1>;
      canonicalSubjectBytes: Uint8Array;
    }>
  | Readonly<{
      materialized: false;
      denialReason: FinancialDecisionCommitSubjectDenialReason;
    }>;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SCOPED_ID =
  /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{0,126}[A-Za-z0-9])?$/;
const UTC_MILLISECONDS =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MINOR_UNITS = /^(?:0|[1-9][0-9]*)$/;

const FACT_KEYS = [
  "financialCommitId",
  "tenantId",
  "companyId",
  "commitmentTime",
  "procurementRequirementReference",
  "procurementCategoryReference",
  "counterpartyReference",
  "monetaryValue",
  "decisionReference",
  "authorityPolicyLineageReference",
  "humanAccountabilityReference",
] as const;
const REFERENCE_KEYS = [
  "referenceType",
  "referenceProfileVersion",
  "referencedId",
  "referencedObjectVersion",
  "tenantId",
  "companyId",
  "immutableLocator",
] as const;
const MONEY_KEYS = [
  "monetaryValueProfileVersion",
  "minorUnits",
  "currency",
  "currencyRegistryVersion",
] as const;

function hasExactKeys(
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index]) &&
    !Object.values(value).includes(undefined);
}

function exactTime(value: string): boolean {
  return UTC_MILLISECONDS.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function validReference(
  value: unknown,
  tenantId: string,
  companyId: string,
): value is ImmutableApplicationReferenceV1 {
  if (!hasExactKeys(value, REFERENCE_KEYS)) return false;
  return typeof value.referenceType === "string" &&
    SCOPED_ID.test(value.referenceType) &&
    value.referenceProfileVersion === "1" &&
    typeof value.referencedId === "string" &&
    SCOPED_ID.test(value.referencedId) &&
    typeof value.referencedObjectVersion === "string" &&
    /^[1-9][0-9]*$/.test(value.referencedObjectVersion) &&
    value.tenantId === tenantId &&
    value.companyId === companyId &&
    typeof value.immutableLocator === "string" &&
    value.immutableLocator.length > 0;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

function deny(
  denialReason: FinancialDecisionCommitSubjectDenialReason,
): FinancialDecisionCommitSubjectMaterialization {
  return Object.freeze({ materialized: false, denialReason });
}

export function materializeFinancialDecisionCommitSubjectV1(
  facts: FinancialDecisionCommitSubjectFactsV1,
  createSubjectId: () => string,
): FinancialDecisionCommitSubjectMaterialization {
  if (!hasExactKeys(facts, FACT_KEYS)) return deny("SUBJECT_FACTS_NOT_CLOSED");
  if (
    !UUID_V4.test(facts.financialCommitId) ||
    !SCOPED_ID.test(facts.tenantId) ||
    !SCOPED_ID.test(facts.companyId) ||
    facts.tenantId === facts.companyId
  ) return deny("SUBJECT_IDENTITY_INVALID");
  if (!exactTime(facts.commitmentTime)) return deny("SUBJECT_TIMESTAMP_INVALID");

  if (
    !hasExactKeys(facts.monetaryValue, MONEY_KEYS) ||
    facts.monetaryValue.monetaryValueProfileVersion !== "1" ||
    facts.monetaryValue.currencyRegistryVersion !== "1" ||
    !["EUR", "USD"].includes(facts.monetaryValue.currency) ||
    !MINOR_UNITS.test(facts.monetaryValue.minorUnits) ||
    BigInt(facts.monetaryValue.minorUnits) <= 0n
  ) return deny("SUBJECT_MONETARY_VALUE_INVALID");

  const references = [
    facts.procurementRequirementReference,
    facts.procurementCategoryReference,
    facts.counterpartyReference,
    facts.decisionReference,
    facts.authorityPolicyLineageReference,
    facts.humanAccountabilityReference,
  ];
  if (
    references.some(reference =>
      !validReference(reference, facts.tenantId, facts.companyId)
    )
  ) return deny("SUBJECT_REFERENCE_INVALID");

  const subjectId = createSubjectId();
  if (!UUID_V4.test(subjectId) || subjectId === facts.financialCommitId) {
    return deny("SUBJECT_IDENTITY_INVALID");
  }

  const subject: FinancialDecisionCommitSubjectV1 = deepFreeze({
    subjectType: "FINANCIAL_DECISION_COMMIT",
    subjectSchemaVersion: "1",
    subjectId,
    financialCommitId: facts.financialCommitId,
    tenantId: facts.tenantId,
    companyId: facts.companyId,
    subjectDomain: "FINANCE",
    commitmentTime: facts.commitmentTime,
    commitmentKind: "SPEND",
    purpose: {
      purposeType: "PROCUREMENT",
      procurementRequirementReference: { ...facts.procurementRequirementReference },
      procurementCategoryReference: { ...facts.procurementCategoryReference },
    },
    counterpartyReference: { ...facts.counterpartyReference },
    monetaryValue: { ...facts.monetaryValue },
    decisionReference: { ...facts.decisionReference },
    authorityPolicyLineageReference: {
      ...facts.authorityPolicyLineageReference,
    },
    humanAccountabilityReference: {
      ...facts.humanAccountabilityReference,
    },
    constraints: [],
  });

  const canonicalSubjectBytes = new TextEncoder().encode(JSON.stringify(subject));
  return Object.freeze({
    materialized: true,
    subject,
    canonicalSubjectBytes,
  });
}
