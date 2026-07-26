import type {
  CanonicalFactAppendOnlyStore,
  CanonicalFactStoredRecord,
} from "./canonical.order.integrity";

export interface CanonicalFactD1Database {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>;
    };
  };
  batch(
    statements: readonly unknown[],
  ): Promise<readonly { meta?: { changes?: number } }[]>;
}

function same(
  left: CanonicalFactStoredRecord,
  right: CanonicalFactStoredRecord,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class CanonicalFactD1AppendOnlyStore
implements CanonicalFactAppendOnlyStore {
  constructor(private readonly db: CanonicalFactD1Database) {}

  async read(
    tenantId: string,
    factId: string,
  ): Promise<CanonicalFactStoredRecord | null> {
    return this.db.prepare(`
      SELECT
        persistence_reference AS persistenceReference,
        fact_id AS factId, tenant_id AS tenantId,
        company_id AS companyId, owner_id AS ownerId,
        source_system AS sourceSystem,
        external_object_id AS externalObjectId,
        external_object_version AS externalObjectVersion,
        canonical_serialization_version AS canonicalSerializationVersion,
        canonical_json AS canonicalJson,
        digest_algorithm AS digestAlgorithm,
        digest_profile AS digestProfile, digest_value AS digestValue,
        evidence_json AS evidenceJson, persisted_at AS persistedAt
      FROM canonical_industrial_facts
      WHERE tenant_id = ? AND fact_id = ?
      LIMIT 1
    `).bind(tenantId, factId).first<CanonicalFactStoredRecord>();
  }

  async appendBatch(
    records: readonly CanonicalFactStoredRecord[],
  ): Promise<"APPENDED" | "EXACT_REPLAY" | "CONFLICT"> {
    const existing = await Promise.all(
      records.map(record => this.read(record.tenantId, record.factId)),
    );
    if (existing.some(Boolean)) {
      return existing.every((value, index) =>
        !!value && same(value, records[index]!))
        ? "EXACT_REPLAY"
        : "CONFLICT";
    }
    const statements = records.map(record => this.db.prepare(`
      INSERT INTO canonical_industrial_facts (
        persistence_reference, fact_id, tenant_id, company_id, owner_id,
        source_system, external_object_id, external_object_version,
        canonical_serialization_version, canonical_json,
        digest_algorithm, digest_profile, digest_value,
        evidence_json, persisted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      record.persistenceReference, record.factId, record.tenantId,
      record.companyId, record.ownerId, record.sourceSystem,
      record.externalObjectId, record.externalObjectVersion,
      record.canonicalSerializationVersion, record.canonicalJson,
      record.digestAlgorithm, record.digestProfile, record.digestValue,
      record.evidenceJson, record.persistedAt,
    ));
    try {
      const results = await this.db.batch(statements);
      return results.length === records.length &&
        results.every(result => result.meta?.changes === 1)
        ? "APPENDED"
        : "CONFLICT";
    } catch {
      const raced = await Promise.all(
        records.map(record => this.read(record.tenantId, record.factId)),
      );
      if (raced.every((value, index) =>
        !!value && same(value, records[index]!))) return "EXACT_REPLAY";
      if (raced.some(Boolean)) return "CONFLICT";
      throw new Error("Canonical fact batch persistence failed");
    }
  }
}
