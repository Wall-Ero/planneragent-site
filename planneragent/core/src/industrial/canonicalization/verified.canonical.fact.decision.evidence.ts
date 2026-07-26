import {
  CANONICAL_ORDER_FACT_FAMILY,
  CANONICAL_ORDER_SCHEMA_VERSION,
} from "./authoritative.order.fact";
import {
  CANONICAL_ORDER_INTEGRITY_PROFILE,
  CANONICAL_ORDER_SERIALIZATION_PROFILE,
  CANONICAL_ORDER_SERIALIZATION_VERSION,
  readAndVerifyCanonicalOrderFact,
  type CanonicalFactAppendOnlyStore,
  type CanonicalFactVerificationResult,
} from "./canonical.order.integrity";

export const INDUSTRIAL_ORDER_DECISION_EVIDENCE_PROFILE =
  "INDUSTRIAL_ORDER_DECISION_EVIDENCE_V1" as const;
export const INDUSTRIAL_ORDER_DECISION_EVIDENCE_VERSION = "1" as const;

export type VerifiedCanonicalFactDecisionEvidence = Readonly<{
  decisionEvidenceId: string;
  evidenceProfile: typeof INDUSTRIAL_ORDER_DECISION_EVIDENCE_PROFILE;
  evidenceProfileVersion: typeof INDUSTRIAL_ORDER_DECISION_EVIDENCE_VERSION;
  evidenceKind: "VERIFIED_CANONICAL_FACT_DECISION_EVIDENCE";
  assuranceBoundary: "DATA_SOVEREIGNTY_INTEGRITY_VERIFIED";
  factReference: Readonly<{
    factId: string;
    factFamily: typeof CANONICAL_ORDER_FACT_FAMILY;
    canonicalSchemaVersion: typeof CANONICAL_ORDER_SCHEMA_VERSION;
  }>;
  authority: Readonly<{
    tenantId: string;
    companyId: string;
    ownerId: string;
  }>;
  sourceReference: Readonly<{
    sourceSystem: string;
    externalObjectId: string;
    externalObjectVersion: string;
  }>;
  acquisitionReference: Readonly<{
    connectorIdentityId: string;
    connectorRevision: number;
    acquisitionReference: string;
    authorizationReference: string;
  }>;
  transformationReference: Readonly<{
    transformationId: string;
    transformationVersion: string;
  }>;
  integrityReference: Readonly<{
    canonicalSerializationProfile:
      typeof CANONICAL_ORDER_SERIALIZATION_PROFILE;
    canonicalSerializationVersion:
      typeof CANONICAL_ORDER_SERIALIZATION_VERSION;
    integrityProfile: typeof CANONICAL_ORDER_INTEGRITY_PROFILE;
    digestAlgorithm: "SHA-256";
    canonicalDigest: string;
    persistenceReference: string;
    integrityEvidenceId: string;
    verificationReference: string;
    verificationStatus: "VERIFIED";
  }>;
  temporalReference: Readonly<{
    observedAt: string;
    effectiveAt: string;
    acquiredAt: string;
    integrityCreatedAt: string;
  }>;
  decisionInputReference: Readonly<{
    referenceType: "VERIFIED_CANONICAL_FACT_DECISION_EVIDENCE";
    referenceProfileVersion: "1";
    referencedEvidenceId: string;
    referencedFactId: string;
    tenantId: string;
    companyId: string;
    immutableLocator: string;
  }>;
}>;

export type VerifiedCanonicalFactDecisionEvidenceAdmission =
  | Readonly<{
      admitted: true;
      evidence: VerifiedCanonicalFactDecisionEvidence;
    }>
  | Readonly<{
      admitted: false;
      denial:
        | "CANONICAL_FACT_VERIFICATION_DENIED"
        | "CANONICAL_FACT_VERIFICATION_MALFORMED"
        | "CANONICAL_FACT_PROFILE_UNSUPPORTED"
        | "CANONICAL_FACT_LINEAGE_INCOHERENT"
        | "DECISION_EVIDENCE_BATCH_CONFLICT"
        | "DECISION_EVIDENCE_ADMISSION_FAILED";
    }>;

export type VerifiedCanonicalFactDecisionEvidenceBatchAdmission =
  | Readonly<{
      admitted: true;
      evidence: readonly VerifiedCanonicalFactDecisionEvidence[];
    }>
  | Extract<
      VerifiedCanonicalFactDecisionEvidenceAdmission,
      { admitted: false }
    >;

export type CanonicalFactDecisionEvidenceRequest = Readonly<{
  tenantId: string;
  factId: string;
}>;

function deny(
  denial: Extract<
    VerifiedCanonicalFactDecisionEvidenceAdmission,
    { admitted: false }
  >["denial"],
): Extract<
  VerifiedCanonicalFactDecisionEvidenceAdmission,
  { admitted: false }
> {
  return Object.freeze({ admitted: false, denial });
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function verificationIsAuthoritative(
  result: CanonicalFactVerificationResult,
): result is Extract<CanonicalFactVerificationResult, { verified: true }> {
  if (!result.verified) return false;
  const { fact, evidence } = result;
  return Object.isFrozen(result) &&
    Object.isFrozen(fact) &&
    Object.isFrozen(fact.owner) &&
    Object.isFrozen(fact.source) &&
    Object.isFrozen(fact.provenance) &&
    Object.isFrozen(evidence) &&
    result.verificationStatus === "VERIFIED" &&
    fact.factFamily === CANONICAL_ORDER_FACT_FAMILY &&
    fact.schemaVersion === CANONICAL_ORDER_SCHEMA_VERSION &&
    fact.provenance.canonicalSchemaVersion ===
      CANONICAL_ORDER_SCHEMA_VERSION &&
    fact.provenance.transformationId.length > 0 &&
    fact.provenance.transformationVersion.length > 0 &&
    evidence.factId === fact.factId &&
    evidence.canonicalSchemaVersion === fact.schemaVersion &&
    evidence.transformationVersion ===
      fact.provenance.transformationVersion &&
    evidence.canonicalSerializationVersion ===
      CANONICAL_ORDER_SERIALIZATION_VERSION &&
    evidence.digestAlgorithm === "SHA-256" &&
    evidence.digestProfile === CANONICAL_ORDER_INTEGRITY_PROFILE &&
    evidence.persistenceReference === result.persistenceReference &&
    fact.owner.tenantId === fact.provenance.tenantId &&
    fact.owner.companyId === fact.provenance.companyId &&
    fact.owner.ownerId === fact.provenance.ownerId &&
    fact.source.systemId === fact.provenance.sourceSystem &&
    fact.source.externalObjectId === fact.provenance.externalObjectId &&
    fact.source.externalObjectVersion ===
      fact.provenance.externalObjectVersion;
}

function materialize(
  verification: Extract<CanonicalFactVerificationResult, { verified: true }>,
): VerifiedCanonicalFactDecisionEvidence {
  const { fact, evidence } = verification;
  const verificationReference =
    `wu6-readback-verification:${evidence.evidenceId}`;
  const decisionEvidenceId =
    `canonical-decision-evidence:${evidence.evidenceId}`;
  return deepFreeze({
    decisionEvidenceId,
    evidenceProfile: INDUSTRIAL_ORDER_DECISION_EVIDENCE_PROFILE,
    evidenceProfileVersion: INDUSTRIAL_ORDER_DECISION_EVIDENCE_VERSION,
    evidenceKind: "VERIFIED_CANONICAL_FACT_DECISION_EVIDENCE",
    assuranceBoundary: "DATA_SOVEREIGNTY_INTEGRITY_VERIFIED",
    factReference: {
      factId: fact.factId,
      factFamily: fact.factFamily,
      canonicalSchemaVersion: fact.schemaVersion,
    },
    authority: {
      tenantId: fact.owner.tenantId,
      companyId: fact.owner.companyId,
      ownerId: fact.owner.ownerId,
    },
    sourceReference: {
      sourceSystem: fact.source.systemId,
      externalObjectId: fact.source.externalObjectId,
      externalObjectVersion: fact.source.externalObjectVersion,
    },
    acquisitionReference: {
      connectorIdentityId: fact.provenance.connectorIdentityId,
      connectorRevision: fact.provenance.connectorRevision,
      acquisitionReference: fact.provenance.acquisitionReference,
      authorizationReference: fact.provenance.authorizationReference,
    },
    transformationReference: {
      transformationId: fact.provenance.transformationId,
      transformationVersion: fact.provenance.transformationVersion,
    },
    integrityReference: {
      canonicalSerializationProfile:
        CANONICAL_ORDER_SERIALIZATION_PROFILE,
      canonicalSerializationVersion:
        evidence.canonicalSerializationVersion,
      integrityProfile: evidence.digestProfile,
      digestAlgorithm: evidence.digestAlgorithm,
      canonicalDigest: evidence.digestValue,
      persistenceReference: evidence.persistenceReference,
      integrityEvidenceId: evidence.evidenceId,
      verificationReference,
      verificationStatus: verification.verificationStatus,
    },
    temporalReference: {
      observedAt: fact.observedAt,
      effectiveAt: fact.effectiveAt,
      acquiredAt: fact.provenance.acquiredAt,
      integrityCreatedAt: evidence.createdAt,
    },
    decisionInputReference: {
      referenceType: "VERIFIED_CANONICAL_FACT_DECISION_EVIDENCE",
      referenceProfileVersion: "1",
      referencedEvidenceId: decisionEvidenceId,
      referencedFactId: fact.factId,
      tenantId: fact.owner.tenantId,
      companyId: fact.owner.companyId,
      immutableLocator: evidence.persistenceReference,
    },
  });
}

export async function admitVerifiedCanonicalFactAsDecisionEvidence(
  request: CanonicalFactDecisionEvidenceRequest,
  store: CanonicalFactAppendOnlyStore,
): Promise<VerifiedCanonicalFactDecisionEvidenceAdmission> {
  let verification: CanonicalFactVerificationResult;
  try {
    verification = await readAndVerifyCanonicalOrderFact(
      request.tenantId,
      request.factId,
      store,
    );
  } catch {
    return deny("DECISION_EVIDENCE_ADMISSION_FAILED");
  }
  if (!verification.verified) {
    return deny("CANONICAL_FACT_VERIFICATION_DENIED");
  }
  if (!verificationIsAuthoritative(verification)) {
    return deny("CANONICAL_FACT_VERIFICATION_MALFORMED");
  }
  if (
    verification.fact.factFamily !== CANONICAL_ORDER_FACT_FAMILY ||
    verification.fact.schemaVersion !== CANONICAL_ORDER_SCHEMA_VERSION
  ) return deny("CANONICAL_FACT_PROFILE_UNSUPPORTED");
  return Object.freeze({
    admitted: true,
    evidence: materialize(verification),
  });
}

export async function admitVerifiedCanonicalFactBatchAsDecisionEvidence(
  requests: readonly CanonicalFactDecisionEvidenceRequest[],
  store: CanonicalFactAppendOnlyStore,
): Promise<VerifiedCanonicalFactDecisionEvidenceBatchAdmission> {
  if (requests.length === 0) {
    return deny("DECISION_EVIDENCE_BATCH_CONFLICT");
  }
  const unique = new Map<string, CanonicalFactDecisionEvidenceRequest>();
  for (const request of requests) {
    const key = `${request.tenantId.length}:${request.tenantId}:` +
      `${request.factId.length}:${request.factId}`;
    if (!unique.has(key)) unique.set(key, request);
  }
  const evidence: VerifiedCanonicalFactDecisionEvidence[] = [];
  for (const request of unique.values()) {
    const admission = await admitVerifiedCanonicalFactAsDecisionEvidence(
      request,
      store,
    );
    if ("denial" in admission) return admission;
    evidence.push(admission.evidence);
  }
  const identities = new Set(evidence.map(value => value.decisionEvidenceId));
  if (identities.size !== evidence.length) {
    return deny("DECISION_EVIDENCE_BATCH_CONFLICT");
  }
  return Object.freeze({
    admitted: true,
    evidence: Object.freeze(evidence),
  });
}
