import { createHash, timingSafeEqual } from "node:crypto";
import {
  CANONICAL_ORDER_FACT_FAMILY,
  CANONICAL_ORDER_SCHEMA_VERSION,
  PRODUCTION_ERP_ORDER_TRANSFORMATION,
  PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
  type CanonicalOrderFact,
} from "./authoritative.order.fact";
import {
  PRODUCTION_ERP_ORDER_SOURCE_REPRESENTATION,
} from "../../connectors/generic.erp.adapter";

export const CANONICAL_ORDER_SERIALIZATION_VERSION = "1.0.0" as const;
export const CANONICAL_ORDER_INTEGRITY_PROFILE =
  "INDUSTRIAL_ORDER_SHA_256_V1" as const;

export type CanonicalFactIntegrityDenial =
  | "CANONICAL_FACT_INVALID"
  | "CANONICAL_FACT_MUTABLE"
  | "PERSISTENCE_TIME_INVALID"
  | "FACT_IDENTITY_CONFLICT"
  | "PERSISTENCE_FAILED"
  | "BATCH_PERSISTENCE_INCOMPLETE"
  | "FACT_RECORD_MISSING"
  | "INTEGRITY_EVIDENCE_MISSING"
  | "PERSISTED_REPRESENTATION_INVALID"
  | "INTEGRITY_EVIDENCE_INVALID"
  | "FACT_INTEGRITY_FAILED"
  | "TENANT_BOUNDARY_DENIED";

export type CanonicalFactIntegrityEvidence = Readonly<{
  evidenceId: string;
  factId: string;
  canonicalSerializationVersion:
    typeof CANONICAL_ORDER_SERIALIZATION_VERSION;
  digestAlgorithm: "SHA-256";
  digestProfile: typeof CANONICAL_ORDER_INTEGRITY_PROFILE;
  digestValue: string;
  canonicalSchemaVersion: typeof CANONICAL_ORDER_SCHEMA_VERSION;
  transformationVersion:
    typeof PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION;
  persistenceReference: string;
  createdAt: string;
  integrityStatus: "DIGEST_CREATED";
}>;

export type CanonicalFactStoredRecord = Readonly<{
  persistenceReference: string;
  factId: string;
  tenantId: string;
  companyId: string;
  ownerId: string;
  sourceSystem: string;
  externalObjectId: string;
  externalObjectVersion: string;
  canonicalSerializationVersion: string;
  canonicalJson: string;
  digestAlgorithm: string;
  digestProfile: string;
  digestValue: string;
  evidenceJson: string;
  persistedAt: string;
}>;

export interface CanonicalFactAppendOnlyStore {
  appendBatch(
    records: readonly CanonicalFactStoredRecord[],
  ): Promise<"APPENDED" | "EXACT_REPLAY" | "CONFLICT">;
  read(
    tenantId: string,
    factId: string,
  ): Promise<CanonicalFactStoredRecord | null>;
}

export type CanonicalFactPersistenceResult =
  | Readonly<{
      persisted: true;
      idempotent: boolean;
      records: readonly Readonly<{
        persistenceReference: string;
        factId: string;
        evidence: CanonicalFactIntegrityEvidence;
      }>[];
    }>
  | Readonly<{
      persisted: false;
      denial: CanonicalFactIntegrityDenial;
    }>;

export type CanonicalFactVerificationResult =
  | Readonly<{
      verified: true;
      fact: CanonicalOrderFact;
      evidence: CanonicalFactIntegrityEvidence;
      persistenceReference: string;
      verificationStatus: "VERIFIED";
    }>
  | Readonly<{
      verified: false;
      denial: CanonicalFactIntegrityDenial;
    }>;

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const HEX_256 = /^[0-9a-f]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,255}$/;

function denied<T extends "persisted" | "verified">(
  key: T,
  denial: CanonicalFactIntegrityDenial,
): any {
  return Object.freeze({ [key]: false, denial });
}

function exactKeys(value: unknown, keys: readonly string[]): boolean {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("\u001f") ===
      [...keys].sort().join("\u001f");
}

function canonicalTime(value: unknown): value is string {
  return typeof value === "string" && TIME.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function identityPart(value: string): string {
  return `${value.length}:${value}`;
}

function validFact(fact: unknown, requireFrozen: boolean): fact is CanonicalOrderFact {
  if (!exactKeys(fact, [
    "factId", "factFamily", "schemaVersion", "owner", "source",
    "observedAt", "effectiveAt", "order", "provenance",
  ])) return false;
  const f = fact as any;
  if (
    f.factFamily !== CANONICAL_ORDER_FACT_FAMILY ||
    f.schemaVersion !== CANONICAL_ORDER_SCHEMA_VERSION ||
    !IDENTIFIER.test(f.factId) ||
    !exactKeys(f.owner, ["tenantId", "companyId", "ownerId"]) ||
    !exactKeys(f.source, [
      "systemId", "externalObjectId", "externalObjectVersion",
    ]) ||
    !exactKeys(f.order, ["sku", "quantity", "status", "dueAt"]) ||
    !exactKeys(f.order.quantity, ["value", "unit"]) ||
    !exactKeys(f.provenance, [
      "acquisitionReference", "authorizationReference", "acquiredAt",
      "capabilityId", "connectorIdentityId", "connectorRevision",
      "sourceRepresentation", "transformationId", "transformationVersion",
      "canonicalSchemaVersion", "tenantId", "companyId", "ownerId",
      "sourceSystem", "externalObjectId", "externalObjectVersion",
    ])
  ) return false;
  const ids = [
    f.owner.tenantId, f.owner.companyId, f.owner.ownerId,
    f.source.systemId, f.source.externalObjectId,
    f.source.externalObjectVersion, f.order.sku,
    f.provenance.acquisitionReference,
    f.provenance.authorizationReference,
    f.provenance.connectorIdentityId,
  ];
  if (
    ids.some(value => typeof value !== "string" ||
      value === "UNKNOWN" || !IDENTIFIER.test(value)) ||
    !canonicalTime(f.observedAt) ||
    !canonicalTime(f.effectiveAt) ||
    !canonicalTime(f.order.dueAt) ||
    !canonicalTime(f.provenance.acquiredAt) ||
    typeof f.order.quantity.value !== "number" ||
    !Number.isFinite(f.order.quantity.value) ||
    f.order.quantity.value <= 0 ||
    f.order.quantity.unit !== "EACH" ||
    f.order.status !== "OPEN" ||
    !Number.isInteger(f.provenance.connectorRevision) ||
    f.provenance.connectorRevision < 1 ||
    f.provenance.capabilityId !== "read_orders" ||
    f.provenance.sourceRepresentation !==
      PRODUCTION_ERP_ORDER_SOURCE_REPRESENTATION ||
    f.provenance.transformationId !==
      PRODUCTION_ERP_ORDER_TRANSFORMATION ||
    f.provenance.transformationVersion !==
      PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION ||
    f.provenance.canonicalSchemaVersion !==
      CANONICAL_ORDER_SCHEMA_VERSION ||
    f.factId !==
      `industrial-order:${identityPart(f.owner.tenantId)}:` +
      `${identityPart(f.source.systemId)}:` +
      `${identityPart(f.source.externalObjectId)}:` +
      identityPart(f.source.externalObjectVersion) ||
    Date.parse(f.effectiveAt) > Date.parse(f.order.dueAt) ||
    Date.parse(f.observedAt) > Date.parse(f.provenance.acquiredAt) ||
    f.owner.tenantId !== f.provenance.tenantId ||
    f.owner.companyId !== f.provenance.companyId ||
    f.owner.ownerId !== f.provenance.ownerId ||
    f.source.systemId !== f.provenance.sourceSystem ||
    f.source.externalObjectId !== f.provenance.externalObjectId ||
    f.source.externalObjectVersion !== f.provenance.externalObjectVersion
  ) return false;
  return !requireFrozen || [
    f, f.owner, f.source, f.order, f.order.quantity, f.provenance,
  ].every(Object.isFrozen);
}

function projection(f: CanonicalOrderFact) {
  return {
    serializationProfile: "INDUSTRIAL_ORDER_CANONICAL_JSON_V1",
    serializationVersion: CANONICAL_ORDER_SERIALIZATION_VERSION,
    fact: {
      factId: f.factId,
      factFamily: f.factFamily,
      schemaVersion: f.schemaVersion,
      owner: {
        tenantId: f.owner.tenantId,
        companyId: f.owner.companyId,
        ownerId: f.owner.ownerId,
      },
      source: {
        systemId: f.source.systemId,
        externalObjectId: f.source.externalObjectId,
        externalObjectVersion: f.source.externalObjectVersion,
      },
      observedAt: f.observedAt,
      effectiveAt: f.effectiveAt,
      order: {
        sku: f.order.sku,
        quantity: {
          value: f.order.quantity.value,
          unit: f.order.quantity.unit,
        },
        status: f.order.status,
        dueAt: f.order.dueAt,
      },
      provenance: {
        acquisitionReference: f.provenance.acquisitionReference,
        authorizationReference: f.provenance.authorizationReference,
        acquiredAt: f.provenance.acquiredAt,
        capabilityId: f.provenance.capabilityId,
        connectorIdentityId: f.provenance.connectorIdentityId,
        connectorRevision: f.provenance.connectorRevision,
        sourceRepresentation: f.provenance.sourceRepresentation,
        transformationId: f.provenance.transformationId,
        transformationVersion: f.provenance.transformationVersion,
        canonicalSchemaVersion: f.provenance.canonicalSchemaVersion,
        tenantId: f.provenance.tenantId,
        companyId: f.provenance.companyId,
        ownerId: f.provenance.ownerId,
        sourceSystem: f.provenance.sourceSystem,
        externalObjectId: f.provenance.externalObjectId,
        externalObjectVersion: f.provenance.externalObjectVersion,
      },
    },
  };
}

export function serializeCanonicalOrderFact(
  fact: CanonicalOrderFact,
): Readonly<{ ok: true; canonicalJson: string; bytes: Uint8Array }> |
Readonly<{ ok: false; denial: CanonicalFactIntegrityDenial }> {
  if (!validFact(fact, false)) {
    return Object.freeze({ ok: false, denial: "CANONICAL_FACT_INVALID" });
  }
  if (!validFact(fact, true)) {
    return Object.freeze({ ok: false, denial: "CANONICAL_FACT_MUTABLE" });
  }
  const canonicalJson = JSON.stringify(projection(fact));
  return Object.freeze({
    ok: true,
    canonicalJson,
    bytes: new TextEncoder().encode(canonicalJson),
  });
}

export function digestCanonicalOrderFact(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

function persistenceReference(factId: string): string {
  return `canonical-fact-record:${factId}`;
}

function evidenceFor(
  fact: CanonicalOrderFact,
  canonicalJson: string,
  createdAt: string,
): CanonicalFactIntegrityEvidence {
  const digestValue = digestCanonicalOrderFact(canonicalJson);
  const reference = persistenceReference(fact.factId);
  return Object.freeze({
    evidenceId: `canonical-fact-integrity:${fact.factId}:${digestValue}`,
    factId: fact.factId,
    canonicalSerializationVersion: CANONICAL_ORDER_SERIALIZATION_VERSION,
    digestAlgorithm: "SHA-256",
    digestProfile: CANONICAL_ORDER_INTEGRITY_PROFILE,
    digestValue,
    canonicalSchemaVersion: CANONICAL_ORDER_SCHEMA_VERSION,
    transformationVersion: PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
    persistenceReference: reference,
    createdAt,
    integrityStatus: "DIGEST_CREATED",
  });
}

function storedRecord(
  fact: CanonicalOrderFact,
  canonicalJson: string,
  evidence: CanonicalFactIntegrityEvidence,
): CanonicalFactStoredRecord {
  return Object.freeze({
    persistenceReference: evidence.persistenceReference,
    factId: fact.factId,
    tenantId: fact.owner.tenantId,
    companyId: fact.owner.companyId,
    ownerId: fact.owner.ownerId,
    sourceSystem: fact.source.systemId,
    externalObjectId: fact.source.externalObjectId,
    externalObjectVersion: fact.source.externalObjectVersion,
    canonicalSerializationVersion: evidence.canonicalSerializationVersion,
    canonicalJson,
    digestAlgorithm: evidence.digestAlgorithm,
    digestProfile: evidence.digestProfile,
    digestValue: evidence.digestValue,
    evidenceJson: JSON.stringify(evidence),
    persistedAt: evidence.createdAt,
  });
}

export async function persistCanonicalOrderFactBatch(
  facts: readonly CanonicalOrderFact[],
  persistedAt: string,
  store: CanonicalFactAppendOnlyStore,
): Promise<CanonicalFactPersistenceResult> {
  if (!canonicalTime(persistedAt)) {
    return denied("persisted", "PERSISTENCE_TIME_INVALID");
  }
  if (facts.length === 0) {
    return denied("persisted", "BATCH_PERSISTENCE_INCOMPLETE");
  }
  const records: CanonicalFactStoredRecord[] = [];
  const outputs: {
    persistenceReference: string;
    factId: string;
    evidence: CanonicalFactIntegrityEvidence;
  }[] = [];
  const identities = new Set<string>();
  for (const fact of facts) {
    const serialized = serializeCanonicalOrderFact(fact);
    if ("denial" in serialized) {
      return denied("persisted", serialized.denial);
    }
    if (
      Date.parse(persistedAt) < Date.parse(fact.provenance.acquiredAt) ||
      identities.has(fact.factId)
    ) return denied("persisted", "FACT_IDENTITY_CONFLICT");
    identities.add(fact.factId);
    const evidence = evidenceFor(fact, serialized.canonicalJson, persistedAt);
    records.push(storedRecord(fact, serialized.canonicalJson, evidence));
    outputs.push(Object.freeze({
      persistenceReference: evidence.persistenceReference,
      factId: fact.factId,
      evidence,
    }));
  }
  try {
    const result = await store.appendBatch(Object.freeze(records));
    if (result === "CONFLICT") {
      return denied("persisted", "FACT_IDENTITY_CONFLICT");
    }
    if (result !== "APPENDED" && result !== "EXACT_REPLAY") {
      return denied("persisted", "BATCH_PERSISTENCE_INCOMPLETE");
    }
    return Object.freeze({
      persisted: true,
      idempotent: result === "EXACT_REPLAY",
      records: Object.freeze(outputs),
    });
  } catch {
    return denied("persisted", "PERSISTENCE_FAILED");
  }
}

function immutableFact(value: CanonicalOrderFact): CanonicalOrderFact {
  Object.freeze(value.owner);
  Object.freeze(value.source);
  Object.freeze(value.order.quantity);
  Object.freeze(value.order);
  Object.freeze(value.provenance);
  return Object.freeze(value);
}

function parseStoredFact(canonicalJson: string): CanonicalOrderFact | null {
  let envelope: any;
  try {
    envelope = JSON.parse(canonicalJson);
  } catch {
    return null;
  }
  if (
    !exactKeys(envelope, [
      "serializationProfile", "serializationVersion", "fact",
    ]) ||
    envelope.serializationProfile !== "INDUSTRIAL_ORDER_CANONICAL_JSON_V1" ||
    envelope.serializationVersion !== CANONICAL_ORDER_SERIALIZATION_VERSION ||
    !validFact(envelope.fact, false) ||
    JSON.stringify(projection(envelope.fact)) !== canonicalJson
  ) return null;
  return immutableFact(envelope.fact);
}

function safeDigestEqual(left: string, right: string): boolean {
  if (!HEX_256.test(left) || !HEX_256.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export async function readAndVerifyCanonicalOrderFact(
  tenantId: string,
  factId: string,
  store: CanonicalFactAppendOnlyStore,
): Promise<CanonicalFactVerificationResult> {
  let record: CanonicalFactStoredRecord | null;
  try {
    record = await store.read(tenantId, factId);
  } catch {
    return denied("verified", "PERSISTENCE_FAILED");
  }
  if (!record) return denied("verified", "FACT_RECORD_MISSING");
  if (record.tenantId !== tenantId || record.factId !== factId) {
    return denied("verified", "TENANT_BOUNDARY_DENIED");
  }
  if (
    !canonicalTime(record.persistedAt) ||
    !IDENTIFIER.test(record.persistenceReference)
  ) return denied("verified", "PERSISTED_REPRESENTATION_INVALID");
  const fact = parseStoredFact(record.canonicalJson);
  if (!fact) return denied("verified", "PERSISTED_REPRESENTATION_INVALID");
  if (Date.parse(record.persistedAt) < Date.parse(fact.provenance.acquiredAt)) {
    return denied("verified", "PERSISTED_REPRESENTATION_INVALID");
  }
  let evidence: CanonicalFactIntegrityEvidence;
  try {
    evidence = JSON.parse(record.evidenceJson);
  } catch {
    return denied("verified", "INTEGRITY_EVIDENCE_MISSING");
  }
  if (!exactKeys(evidence, [
    "evidenceId", "factId", "canonicalSerializationVersion",
    "digestAlgorithm", "digestProfile", "digestValue",
    "canonicalSchemaVersion", "transformationVersion",
    "persistenceReference", "createdAt", "integrityStatus",
  ])) return denied("verified", "INTEGRITY_EVIDENCE_INVALID");
  const digest = digestCanonicalOrderFact(record.canonicalJson);
  const expectedEvidence = evidenceFor(fact, record.canonicalJson, record.persistedAt);
  if (
    record.persistenceReference !== expectedEvidence.persistenceReference ||
    record.companyId !== fact.owner.companyId ||
    record.ownerId !== fact.owner.ownerId ||
    record.sourceSystem !== fact.source.systemId ||
    record.externalObjectId !== fact.source.externalObjectId ||
    record.externalObjectVersion !== fact.source.externalObjectVersion ||
    record.canonicalSerializationVersion !==
      CANONICAL_ORDER_SERIALIZATION_VERSION ||
    record.digestAlgorithm !== "SHA-256" ||
    record.digestProfile !== CANONICAL_ORDER_INTEGRITY_PROFILE ||
    !safeDigestEqual(record.digestValue, digest) ||
    !safeDigestEqual(evidence.digestValue, digest) ||
    JSON.stringify(evidence) !== JSON.stringify(expectedEvidence)
  ) return denied("verified", "FACT_INTEGRITY_FAILED");
  Object.freeze(evidence);
  return Object.freeze({
    verified: true,
    fact,
    evidence,
    persistenceReference: record.persistenceReference,
    verificationStatus: "VERIFIED",
  });
}
