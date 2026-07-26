import { describe, expect, it } from "vitest";
import {
  canonicalizeProductionErpOrders,
  PRODUCTION_ERP_ORDER_TRANSFORMATION,
  PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
  type CanonicalOrderFact,
} from "../canonicalization/authoritative.order.fact";
import type { AdapterExecutionResult } from "../adapter.runtime";
import {
  CANONICAL_ORDER_INTEGRITY_PROFILE,
  CANONICAL_ORDER_SERIALIZATION_VERSION,
  digestCanonicalOrderFact,
  persistCanonicalOrderFactBatch,
  readAndVerifyCanonicalOrderFact,
  serializeCanonicalOrderFact,
  type CanonicalFactAppendOnlyStore,
  type CanonicalFactStoredRecord,
} from "../canonicalization/canonical.order.integrity";
import {
  CanonicalFactD1AppendOnlyStore,
  type CanonicalFactD1Database,
} from "../canonicalization/canonical.order.integrity.d1";

const PERSISTED_AT = "2026-07-26T20:01:00.000Z";

function fact(): CanonicalOrderFact {
  const acquisition: Extract<AdapterExecutionResult, { ok: true }> = {
    ok: true,
    capability_id: "read_orders",
    connector_id: "erp-production-rest",
    connector_identity_id: "connector-identity:erp-production-rest",
    connector_revision: 1,
    acquisition_reference: "data-access:production-erp",
    authorization_reference: "authorization:production-erp",
    tenant_id: "tenant-001",
    source_system: "PRODUCTION_ERP",
    executed_at: "2026-07-26T20:00:00.000Z",
    output: {
      sourceRepresentation: "PRODUCTION_REST_ERP_ORDERS_V1",
      acquisition: {
        acquisitionReference: "data-access:production-erp",
        acquiredAt: "2026-07-26T20:00:00.000Z",
        tenantId: "tenant-001",
        companyId: "company-001",
        ownerId: "procurement-owner-001",
        sourceSystem: "PRODUCTION_ERP",
        connectorIdentityId: "connector-identity:erp-production-rest",
        connectorRevision: 1,
        authorizationReference: "authorization:production-erp",
        capabilityId: "read_orders",
      },
      orders: [{
        external_order_id: "ERP-1001",
        external_order_version: "7",
        company_id: "company-001",
        owner_id: "procurement-owner-001",
        sku: "MATERIAL-001",
        quantity_value: 12,
        quantity_unit: "EA",
        status: "OPEN",
        observed_at: "2026-07-26T19:55:00.000Z",
        effective_at: "2026-07-26T19:00:00.000Z",
        due_at: "2026-08-01T00:00:00.000Z",
      }],
    },
  };
  const result = canonicalizeProductionErpOrders(acquisition, {
    transformationId: PRODUCTION_ERP_ORDER_TRANSFORMATION,
    transformationVersion: PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
  });
  if (!result.ok || !result.facts[0]) throw new Error("fixture failed");
  return result.facts[0];
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as any).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function alteredFact(change: (value: any) => void): CanonicalOrderFact {
  const value = structuredClone(fact());
  change(value);
  return deepFreeze(value);
}

class MemoryAppendOnlyStore implements CanonicalFactAppendOnlyStore {
  records = new Map<string, CanonicalFactStoredRecord>();
  fail = false;
  incomplete = false;

  async appendBatch(records: readonly CanonicalFactStoredRecord[]) {
    if (this.fail) throw new Error(
      "raw storage error secret://credential infrastructure-db-id"
    );
    if (this.incomplete) return "INCOMPLETE" as any;
    const keys = records.map(record => `${record.tenantId}|${record.factId}`);
    const existing = keys.map(key => this.records.get(key));
    if (existing.some(Boolean)) {
      return existing.every((record, index) =>
        record &&
        JSON.stringify(record) === JSON.stringify(records[index]))
        ? "EXACT_REPLAY" as const
        : "CONFLICT" as const;
    }
    const sourceKeys = new Set(
      [...this.records.values()].map(sourceKey),
    );
    if (
      records.some(record => sourceKeys.has(sourceKey(record))) ||
      new Set(records.map(sourceKey)).size !== records.length
    ) return "CONFLICT";
    records.forEach((record, index) => {
      this.records.set(keys[index]!, structuredClone(record));
    });
    return "APPENDED" as const;
  }

  async read(tenantId: string, factId: string) {
    if (this.fail) throw new Error(
      "raw storage error secret://credential infrastructure-db-id"
    );
    const value = this.records.get(`${tenantId}|${factId}`);
    return value ? structuredClone(value) : null;
  }
}

function sourceKey(record: CanonicalFactStoredRecord): string {
  return [
    record.tenantId, record.sourceSystem,
    record.externalObjectId, record.externalObjectVersion,
  ].join("|");
}

async function persisted(store = new MemoryAppendOnlyStore()) {
  const result = await persistCanonicalOrderFactBatch(
    [fact()],
    PERSISTED_AT,
    store,
  );
  if (!result.persisted) throw new Error("persistence fixture failed");
  return { store, result };
}

async function tamper(
  mutate: (record: any) => void,
  denial: string,
) {
  const { store } = await persisted();
  const key = `${fact().owner.tenantId}|${fact().factId}`;
  const record = store.records.get(key)!;
  mutate(record);
  const result = await readAndVerifyCanonicalOrderFact(
    fact().owner.tenantId,
    fact().factId,
    store,
  );
  expect(result).toEqual({ verified: false, denial });
  expect("fact" in result).toBe(false);
}

function mutateCanonical(
  record: any,
  mutate: (envelope: any) => void,
) {
  const envelope = JSON.parse(record.canonicalJson);
  mutate(envelope);
  record.canonicalJson = JSON.stringify(envelope);
}

describe("Data Canonicalization — Canonical Fact Immutability & Integrity", () => {
  it("serializes the closed fact deterministically", () => {
    const result = serializeCanonicalOrderFact(fact());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new TextDecoder().decode(result.bytes)).toBe(result.canonicalJson);
    expect(JSON.parse(result.canonicalJson)).toMatchObject({
      serializationProfile: "INDUSTRIAL_ORDER_CANONICAL_JSON_V1",
      serializationVersion: CANONICAL_ORDER_SERIALIZATION_VERSION,
      fact: { factFamily: "INDUSTRIAL_ORDER", schemaVersion: "1.0.0" },
    });
  });

  it("repeats identical canonical bytes", () => {
    const first = serializeCanonicalOrderFact(fact());
    const second = serializeCanonicalOrderFact(fact());
    expect(first).toEqual(second);
  });

  it("ignores object insertion order while preserving canonical order", () => {
    const original: any = structuredClone(fact());
    const reverse = (value: any): any => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return value;
      }
      return Object.fromEntries(
        Object.entries(value).reverse().map(([key, child]) =>
          [key, reverse(child)]),
      );
    };
    expect(serializeCanonicalOrderFact(deepFreeze(reverse(original))))
      .toEqual(serializeCanonicalOrderFact(fact()));
  });

  it("creates a deterministic SHA-256 digest", () => {
    const serialized = serializeCanonicalOrderFact(fact());
    if (!serialized.ok) throw new Error("serialization failed");
    expect(digestCanonicalOrderFact(serialized.canonicalJson))
      .toBe(digestCanonicalOrderFact(serialized.canonicalJson));
    expect(digestCanonicalOrderFact(serialized.canonicalJson))
      .toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes the digest for distinct canonical business content", () => {
    const first = serializeCanonicalOrderFact(fact());
    const second = serializeCanonicalOrderFact(
      alteredFact(value => value.order.quantity.value = 13),
    );
    if (!first.ok || !second.ok) throw new Error("serialization failed");
    expect(digestCanonicalOrderFact(first.canonicalJson))
      .not.toBe(digestCanonicalOrderFact(second.canonicalJson));
  });

  it("persists and verifies one canonical fact", async () => {
    const original = fact();
    const snapshot = JSON.stringify(original);
    const { store, result } = await persisted();
    expect(result).toMatchObject({
      persisted: true,
      idempotent: false,
      records: [{
        factId: original.factId,
        evidence: {
          digestAlgorithm: "SHA-256",
          digestProfile: CANONICAL_ORDER_INTEGRITY_PROFILE,
          integrityStatus: "DIGEST_CREATED",
        },
      }],
    });
    const verified = await readAndVerifyCanonicalOrderFact(
      original.owner.tenantId,
      original.factId,
      store,
    );
    expect(verified).toMatchObject({
      verified: true,
      fact: original,
      verificationStatus: "VERIFIED",
    });
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it("treats exact repeated persistence as idempotent", async () => {
    const { store } = await persisted();
    expect(await persistCanonicalOrderFactBatch(
      [fact()], PERSISTED_AT, store,
    )).toMatchObject({ persisted: true, idempotent: true });
    expect(store.records.size).toBe(1);
  });

  it("rejects conflicting content under the same fact identity", async () => {
    const { store } = await persisted();
    expect(await persistCanonicalOrderFactBatch([
      alteredFact(value => value.order.quantity.value = 13),
    ], PERSISTED_AT, store)).toEqual({
      persisted: false,
      denial: "FACT_IDENTITY_CONFLICT",
    });
  });

  it("rejects conflicting external identity/version", async () => {
    const { store } = await persisted();
    const changed = alteredFact(value => value.factId += "-substitute");
    expect(await persistCanonicalOrderFactBatch(
      [changed], PERSISTED_AT, store,
    )).toEqual({ persisted: false, denial: "CANONICAL_FACT_INVALID" });
  });

  it("rejects mutable canonical facts", async () => {
    const mutable = structuredClone(fact());
    expect(await persistCanonicalOrderFactBatch(
      [mutable], PERSISTED_AT, new MemoryAppendOnlyStore(),
    )).toEqual({ persisted: false, denial: "CANONICAL_FACT_MUTABLE" });
  });

  it("rejects immutable fact identity substitution", async () => {
    expect(await persistCanonicalOrderFactBatch(
      [alteredFact(value => value.source.externalObjectVersion = "8")],
      PERSISTED_AT,
      new MemoryAppendOnlyStore(),
    )).toEqual({ persisted: false, denial: "CANONICAL_FACT_INVALID" });
  });

  it("rejects duplicate identities inside a batch atomically", async () => {
    const store = new MemoryAppendOnlyStore();
    expect(await persistCanonicalOrderFactBatch(
      [fact(), fact()], PERSISTED_AT, store,
    )).toEqual({ persisted: false, denial: "FACT_IDENTITY_CONFLICT" });
    expect(store.records.size).toBe(0);
  });

  it("rejects an invalid persistence time", async () => {
    expect(await persistCanonicalOrderFactBatch(
      [fact()], "tomorrow", new MemoryAppendOnlyStore(),
    )).toEqual({ persisted: false, denial: "PERSISTENCE_TIME_INVALID" });
  });

  it("rejects update-in-place and overwrite attempts", async () => {
    const { store } = await persisted();
    for (const value of [13, 14]) {
      expect(await persistCanonicalOrderFactBatch([
        alteredFact(f => f.order.quantity.value = value),
      ], PERSISTED_AT, store)).toMatchObject({
        persisted: false,
        denial: "FACT_IDENTITY_CONFLICT",
      });
    }
    expect(store.records.size).toBe(1);
  });

  it("rejects a missing fact record", async () => {
    expect(await readAndVerifyCanonicalOrderFact(
      "tenant-001", fact().factId, new MemoryAppendOnlyStore(),
    )).toEqual({ verified: false, denial: "FACT_RECORD_MISSING" });
  });

  it("rejects missing integrity evidence", async () => {
    await tamper(record => record.evidenceJson = "", "INTEGRITY_EVIDENCE_MISSING");
  });

  it.each([
    ["business content", (record: any) =>
      mutateCanonical(record, value => value.fact.order.quantity.value = 99),
      "FACT_INTEGRITY_FAILED"],
    ["owner", (record: any) =>
      mutateCanonical(record, value => value.fact.owner.ownerId = "owner-002"),
      "PERSISTED_REPRESENTATION_INVALID"],
    ["provenance", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.provenance.ownerId = "owner-002"),
      "PERSISTED_REPRESENTATION_INVALID"],
    ["source identity", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.source.systemId = "OTHER_ERP"),
      "PERSISTED_REPRESENTATION_INVALID"],
    ["external object version", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.source.externalObjectVersion = "8"),
      "PERSISTED_REPRESENTATION_INVALID"],
    ["connector identity", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.provenance.connectorIdentityId = "connector-identity:other"),
      "FACT_INTEGRITY_FAILED"],
    ["connector revision", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.provenance.connectorRevision = 2),
      "FACT_INTEGRITY_FAILED"],
    ["acquisition reference", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.provenance.acquisitionReference = "data-access:other"),
      "FACT_INTEGRITY_FAILED"],
    ["authorization reference", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.provenance.authorizationReference = "authorization:other"),
      "FACT_INTEGRITY_FAILED"],
    ["schema version", (record: any) =>
      mutateCanonical(record, value => value.fact.schemaVersion = "2.0.0"),
      "PERSISTED_REPRESENTATION_INVALID"],
    ["transformation version", (record: any) =>
      mutateCanonical(record, value =>
        value.fact.provenance.transformationVersion = "2.0.0"),
      "PERSISTED_REPRESENTATION_INVALID"],
    ["canonical serialization version", (record: any) =>
      mutateCanonical(record, value => value.serializationVersion = "2.0.0"),
      "PERSISTED_REPRESENTATION_INVALID"],
  ])("rejects modified %s", async (_name, mutate, denial) => {
    await tamper(mutate, denial);
  });

  it("rejects a cross-tenant persisted record", async () => {
    await tamper(record => record.tenantId = "tenant-002", "TENANT_BOUNDARY_DENIED");
  });

  it("rejects modified persisted company and owner columns", async () => {
    await tamper(record => record.companyId = "company-002", "FACT_INTEGRITY_FAILED");
    await tamper(record => record.ownerId = "owner-002", "FACT_INTEGRITY_FAILED");
  });

  it("rejects modified external-object identity", async () => {
    await tamper(record => record.externalObjectId = "ERP-2002", "FACT_INTEGRITY_FAILED");
  });

  it("rejects a modified digest", async () => {
    await tamper(record => record.digestValue = "0".repeat(64), "FACT_INTEGRITY_FAILED");
  });

  it("rejects fact/evidence substitution", async () => {
    await tamper(record => {
      const evidence = JSON.parse(record.evidenceJson);
      evidence.factId = "industrial-order:substituted";
      record.evidenceJson = JSON.stringify(evidence);
    }, "FACT_INTEGRITY_FAILED");
  });

  it("rejects malformed persisted JSON", async () => {
    await tamper(record => record.canonicalJson = "{", "PERSISTED_REPRESENTATION_INVALID");
  });

  it("contains storage exceptions without leaking details", async () => {
    const store = new MemoryAppendOnlyStore();
    store.fail = true;
    const serialized = JSON.stringify(await persistCanonicalOrderFactBatch(
      [fact()], PERSISTED_AT, store,
    ));
    expect(serialized).toBe(
      '{"persisted":false,"denial":"PERSISTENCE_FAILED"}'
    );
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("credential");
    expect(serialized).not.toContain("infrastructure-db-id");
  });

  it("uses one D1 batch as the append-only atomic boundary", async () => {
    let batchSize = 0;
    const db: CanonicalFactD1Database = {
      prepare(sql) {
        return {
          bind(...values: unknown[]) {
            return {
              sql,
              values,
              async first<T>() { return null as T | null; },
            };
          },
        };
      },
      async batch(statements) {
        batchSize = statements.length;
        return statements.map(() => ({ meta: { changes: 1 } }));
      },
    };
    expect(await persistCanonicalOrderFactBatch(
      [fact()], PERSISTED_AT, new CanonicalFactD1AppendOnlyStore(db),
    )).toMatchObject({ persisted: true, idempotent: false });
    expect(batchSize).toBe(1);
  });

  it("sanitizes a D1 batch infrastructure failure", async () => {
    const db: CanonicalFactD1Database = {
      prepare() {
        return {
          bind() {
            return { async first<T>() { return null as T | null; } };
          },
        };
      },
      async batch() {
        throw new Error("secret credential infrastructure-id");
      },
    };
    expect(await persistCanonicalOrderFactBatch(
      [fact()], PERSISTED_AT, new CanonicalFactD1AppendOnlyStore(db),
    )).toEqual({ persisted: false, denial: "PERSISTENCE_FAILED" });
  });

  it("does not return a successful partial batch", async () => {
    const store = new MemoryAppendOnlyStore();
    store.incomplete = true;
    expect(await persistCanonicalOrderFactBatch(
      [fact()], PERSISTED_AT, store,
    )).toEqual({
      persisted: false,
      denial: "BATCH_PERSISTENCE_INCOMPLETE",
    });
    expect(store.records.size).toBe(0);
  });

  it("keeps the connector outside persistence and integrity creation", () => {
    const serialized = serializeCanonicalOrderFact(fact());
    expect(serialized.ok).toBe(true);
    expect(fact()).not.toHaveProperty("digestValue");
    expect(fact()).not.toHaveProperty("persistenceReference");
  });
});
