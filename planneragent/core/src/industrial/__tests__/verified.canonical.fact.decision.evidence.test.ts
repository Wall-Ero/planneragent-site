import { beforeAll, describe, expect, it } from "vitest";
import {
  createProductionErpConnector,
} from "../../connectors/generic.erp.adapter";
import { executeAdapter, type AdapterExecutionResult } from "../adapter.runtime";
import type { ConnectorAccessServices } from "../connector.access";
import { registerConnector } from "../system.registry";
import {
  canonicalizeProductionErpOrders,
  PRODUCTION_ERP_ORDER_TRANSFORMATION,
  PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
} from "../canonicalization/authoritative.order.fact";
import {
  persistCanonicalOrderFactBatch,
  type CanonicalFactAppendOnlyStore,
  type CanonicalFactStoredRecord,
} from "../canonicalization/canonical.order.integrity";
import {
  createVerifiedOrderDecisionEvidenceFromAcquisition,
} from "../canonicalization/canonical.order.decision.evidence.orchestration";
import {
  admitVerifiedCanonicalFactAsDecisionEvidence,
  admitVerifiedCanonicalFactBatchAsDecisionEvidence,
  INDUSTRIAL_ORDER_DECISION_EVIDENCE_PROFILE,
} from "../canonicalization/verified.canonical.fact.decision.evidence";
import { getFirstSigningProofProfile } from
  "../../cryptography/mechanisms/signing.proof.profile.authorization";

const NOW = Date.parse("2026-07-26T20:00:00.000Z");
const PERSISTED_AT = "2026-07-26T20:01:00.000Z";
const CONNECTOR_IDENTITY = "connector-identity:erp-production-rest";

function sourceOrder(id = "ERP-1001", version = "7") {
  return {
    external_order_id: id,
    external_order_version: version,
    company_id: "company-001",
    owner_id: "procurement-owner-001",
    sku: "MATERIAL-001",
    quantity_value: 12,
    quantity_unit: "EA",
    status: "OPEN",
    observed_at: "2026-07-26T19:55:00.000Z",
    effective_at: "2026-07-26T19:00:00.000Z",
    due_at: "2026-08-01T00:00:00.000Z",
  };
}

function acquisition(id = "ERP-1001", version = "7"):
Extract<AdapterExecutionResult, { ok: true }> {
  return {
    ok: true,
    capability_id: "read_orders",
    connector_id: "erp-production-rest",
    connector_identity_id: CONNECTOR_IDENTITY,
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
        connectorIdentityId: CONNECTOR_IDENTITY,
        connectorRevision: 1,
        authorizationReference: "authorization:production-erp",
        capabilityId: "read_orders",
      },
      orders: [sourceOrder(id, version)],
    },
  };
}

class MemoryStore implements CanonicalFactAppendOnlyStore {
  records = new Map<string, CanonicalFactStoredRecord>();
  fail = false;

  async appendBatch(records: readonly CanonicalFactStoredRecord[]) {
    if (this.fail) throw new Error(
      "raw storage error secret credential infrastructure-id"
    );
    const existing = records.map(record =>
      this.records.get(`${record.tenantId}|${record.factId}`));
    if (existing.some(Boolean)) {
      return existing.every((value, index) =>
        value &&
        JSON.stringify(value) === JSON.stringify(records[index]))
        ? "EXACT_REPLAY" as const
        : "CONFLICT" as const;
    }
    records.forEach(record => this.records.set(
      `${record.tenantId}|${record.factId}`,
      structuredClone(record),
    ));
    return "APPENDED" as const;
  }

  async read(tenantId: string, factId: string) {
    if (this.fail) throw new Error(
      "raw storage error secret credential infrastructure-id"
    );
    const value = this.records.get(`${tenantId}|${factId}`);
    return value ? structuredClone(value) : null;
  }
}

function canonicalFact(input = acquisition()) {
  const result = canonicalizeProductionErpOrders(input, {
    transformationId: PRODUCTION_ERP_ORDER_TRANSFORMATION,
    transformationVersion: PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
  });
  if (!result.ok || !result.facts[0]) throw new Error("fixture failed");
  return result.facts[0];
}

async function persisted(input = acquisition()) {
  const store = new MemoryStore();
  const fact = canonicalFact(input);
  const result = await persistCanonicalOrderFactBatch(
    [fact], PERSISTED_AT, store,
  );
  if (!result.persisted) throw new Error("fixture persistence failed");
  return { store, fact };
}

async function admitted(input = acquisition()) {
  const { store, fact } = await persisted(input);
  const result = await admitVerifiedCanonicalFactAsDecisionEvidence(
    { tenantId: fact.owner.tenantId, factId: fact.factId },
    store,
  );
  return { store, fact, result };
}

async function tamper(
  mutate: (record: any) => void,
) {
  const { store, fact } = await persisted();
  mutate(store.records.get(`${fact.owner.tenantId}|${fact.factId}`)!);
  const result = await admitVerifiedCanonicalFactAsDecisionEvidence(
    { tenantId: fact.owner.tenantId, factId: fact.factId },
    store,
  );
  expect(result).toEqual({
    admitted: false,
    denial: "CANONICAL_FACT_VERIFICATION_DENIED",
  });
  expect("evidence" in result).toBe(false);
}

function mutateCanonical(record: any, mutate: (envelope: any) => void) {
  const envelope = JSON.parse(record.canonicalJson);
  mutate(envelope);
  record.canonicalJson = JSON.stringify(envelope);
}

const access: ConnectorAccessServices = {
  async authenticateWorkload(value) {
    return {
      workloadId: value.workloadId,
      tenantId: value.tenantId,
      authenticationId: "authorization:production-erp",
    };
  },
  async authorizeConnectorUse(value) {
    return value.connectorIdentity.identityId === CONNECTOR_IDENTITY;
  },
  async resolveConnectorCredential(credentialReference) {
    return { credentialReference, secret: "production-credential" };
  },
};

function runtimeRequest() {
  const contextId = "data-access:production-erp";
  return {
    capability_id: "read_orders",
    payload: {},
    workload_identity: {
      workloadId: "planner-worker",
      tenantId: "tenant-001",
      authenticationEvidence: "valid",
    },
    data_access_context: {
      contextId,
      tenantId: "tenant-001",
      targetTenantId: "tenant-001",
      sourceSystem: "PRODUCTION_ERP",
      sourceRegion: "EU",
      targetRegion: "EU",
      runtimeLocality: "TENANT_LOCAL" as const,
      encryptionDomain: "EXECUTION_MEMORY" as const,
      encryptionEvidence: {
        contextId,
        connectorIdentityId: CONNECTOR_IDENTITY,
        domain: "EXECUTION_MEMORY" as const,
        encryptedInTransit: true,
        encryptedAtRest: true,
      },
      transportEvidence: {
        contextId,
        connectorIdentityId: CONNECTOR_IDENTITY,
        scheme: "HTTPS",
        secure: true,
      },
    },
  };
}

describe.sequential(
  "Data Sovereignty — Verified Canonical Fact Decision Evidence",
  () => {
    beforeAll(() => {
      registerConnector(createProductionErpConnector({
        baseUrl: "https://erp.production.example/api/v1",
        tenantId: "tenant-001",
        companyId: "company-001",
        ownerId: "procurement-owner-001",
        sourceSystem: "PRODUCTION_ERP",
        sourceRegion: "EU",
        credentialReference: "secret://connectors/production-erp",
        requestTimeoutMs: 100,
      }, {
        now: () => NOW,
        fetch: async input => String(input).endsWith("/health")
          ? new Response(null, { status: 204 })
          : new Response(JSON.stringify({
            schema_version: "PRODUCTION_REST_ERP_ORDERS_V1",
            orders: [sourceOrder()],
          }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      }));
    });

    it("admits a WU6-verified fact as deterministic decision evidence", async () => {
      const first = await admitted();
      const second = await admitVerifiedCanonicalFactAsDecisionEvidence(
        { tenantId: first.fact.owner.tenantId, factId: first.fact.factId },
        first.store,
      );
      expect(first.result).toEqual(second);
      expect(first.result).toMatchObject({
        admitted: true,
        evidence: {
          evidenceProfile: INDUSTRIAL_ORDER_DECISION_EVIDENCE_PROFILE,
          evidenceKind: "VERIFIED_CANONICAL_FACT_DECISION_EVIDENCE",
          assuranceBoundary: "DATA_SOVEREIGNTY_INTEGRITY_VERIFIED",
          factReference: { factFamily: "INDUSTRIAL_ORDER" },
          integrityReference: {
            canonicalSerializationProfile:
              "INDUSTRIAL_ORDER_CANONICAL_JSON_V1",
            integrityProfile: "INDUSTRIAL_ORDER_SHA_256_V1",
            verificationStatus: "VERIFIED",
          },
        },
      });
    });

    it("creates distinct evidence for distinct canonical facts", async () => {
      const first = await admitted(acquisition("ERP-1001", "7"));
      const second = await admitted(acquisition("ERP-1002", "1"));
      if (!first.result.admitted || !second.result.admitted) {
        throw new Error("admission failed");
      }
      expect(first.result.evidence.decisionEvidenceId)
        .not.toBe(second.result.evidence.decisionEvidenceId);
    });

    it("traverses the production connector through WU7", async () => {
      const acquired = await executeAdapter(
        runtimeRequest(), access, { now: () => NOW },
      );
      const result = await createVerifiedOrderDecisionEvidenceFromAcquisition(
        acquired, PERSISTED_AT, new MemoryStore(),
      );
      expect(result).toMatchObject({
        completed: true,
        evidence: [{
          evidenceProfile: INDUSTRIAL_ORDER_DECISION_EVIDENCE_PROFILE,
          factReference: {
            factId:
              "industrial-order:10:tenant-001:14:PRODUCTION_ERP:" +
              "8:ERP-1001:1:7",
          },
        }],
      });
    });

    it("does not fabricate or invoke Trust/FDC semantics", async () => {
      const profileBefore = structuredClone(getFirstSigningProofProfile());
      const { result } = await admitted();
      expect(getFirstSigningProofProfile()).toEqual(profileBefore);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("PLANNERAGENT_FDC_SIGN_V1");
      expect(serialized).not.toContain("FINANCIAL_DECISION_COMMIT_V1");
      expect(serialized).not.toContain("PLANNERAGENT_FDC_CANONICAL_V1");
      expect(serialized).not.toContain("PLANNERAGENT:FDC:SIGN:V1");
      expect(serialized).not.toContain("certificate");
      expect(serialized).not.toContain("signature");
    });

    it("ignores and rejects caller-supplied fake verification", async () => {
      const result = await admitVerifiedCanonicalFactAsDecisionEvidence(
        {
          tenantId: "tenant-001",
          factId: canonicalFact().factId,
          verified: true,
        } as any,
        new MemoryStore(),
      );
      expect(result).toEqual({
        admitted: false,
        denial: "CANONICAL_FACT_VERIFICATION_DENIED",
      });
    });

    it("rejects missing persisted fact", async () => {
      expect(await admitVerifiedCanonicalFactAsDecisionEvidence(
        { tenantId: "tenant-001", factId: canonicalFact().factId },
        new MemoryStore(),
      )).toEqual({
        admitted: false,
        denial: "CANONICAL_FACT_VERIFICATION_DENIED",
      });
    });

    it("rejects missing persistence evidence", async () => {
      await tamper(record => record.persistenceReference = "");
    });

    it("rejects missing integrity evidence", async () => {
      await tamper(record => record.evidenceJson = "");
    });

    it("rejects malformed persisted verification material", async () => {
      await tamper(record => record.canonicalJson = "{");
    });

    it.each([
      ["fact identity", (r: any) => r.factId = "industrial-order:other"],
      ["tenant", (r: any) => r.tenantId = "tenant-002"],
      ["company", (r: any) => r.companyId = "company-002"],
      ["owner", (r: any) => r.ownerId = "owner-002"],
      ["source system", (r: any) => r.sourceSystem = "OTHER_SOURCE"],
      ["external identity", (r: any) => r.externalObjectId = "ERP-2002"],
      ["external version", (r: any) => r.externalObjectVersion = "8"],
      ["digest", (r: any) => r.digestValue = "0".repeat(64)],
      ["persistence reference", (r: any) =>
        r.persistenceReference = "canonical-fact-record:other"],
      ["integrity profile", (r: any) => r.digestProfile = "OTHER_PROFILE"],
      ["integrity evidence", (r: any) => {
        const value = JSON.parse(r.evidenceJson);
        value.evidenceId = "canonical-fact-integrity:other";
        r.evidenceJson = JSON.stringify(value);
      }],
      ["connector identity", (r: any) => mutateCanonical(r, value =>
        value.fact.provenance.connectorIdentityId =
          "connector-identity:other")],
      ["connector revision", (r: any) => mutateCanonical(r, value =>
        value.fact.provenance.connectorRevision = 2)],
      ["acquisition reference", (r: any) => mutateCanonical(r, value =>
        value.fact.provenance.acquisitionReference = "data-access:other")],
      ["authorization reference", (r: any) => mutateCanonical(r, value =>
        value.fact.provenance.authorizationReference =
          "authorization:other")],
      ["transformation identity", (r: any) => mutateCanonical(r, value =>
        value.fact.provenance.transformationId = "OTHER_TRANSFORMATION")],
      ["transformation version", (r: any) => mutateCanonical(r, value =>
        value.fact.provenance.transformationVersion = "2.0.0")],
      ["schema version", (r: any) => mutateCanonical(r, value =>
        value.fact.schemaVersion = "2.0.0")],
      ["serialization profile", (r: any) => mutateCanonical(r, value =>
        value.serializationProfile = "OTHER_SERIALIZATION")],
    ])("rejects %s substitution", async (_name, mutate) => {
      await tamper(mutate);
    });

    it("derives the verification reference and ignores caller rebinding", async () => {
      const { result } = await admitted();
      if (!result.admitted) throw new Error("admission failed");
      expect(result.evidence.integrityReference.verificationReference)
        .toBe(
          `wu6-readback-verification:` +
          result.evidence.integrityReference.integrityEvidenceId
        );
    });

    it("deduplicates an exact repeated fact in a batch", async () => {
      const { store, fact } = await persisted();
      const request = { tenantId: fact.owner.tenantId, factId: fact.factId };
      const result =
        await admitVerifiedCanonicalFactBatchAsDecisionEvidence(
          [request, request], store,
        );
      expect(result.admitted).toBe(true);
      if (result.admitted) expect(result.evidence).toHaveLength(1);
    });

    it("denies a batch atomically when any fact is unverifiable", async () => {
      const { store, fact } = await persisted();
      const result =
        await admitVerifiedCanonicalFactBatchAsDecisionEvidence([
          { tenantId: fact.owner.tenantId, factId: fact.factId },
          { tenantId: fact.owner.tenantId, factId: "missing-fact" },
        ], store);
      expect(result).toEqual({
        admitted: false,
        denial: "CANONICAL_FACT_VERIFICATION_DENIED",
      });
      expect("evidence" in result).toBe(false);
    });

    it("returns deeply immutable, bounded and source-neutral evidence", async () => {
      const { result } = await admitted();
      if (!result.admitted) throw new Error("admission failed");
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.evidence)).toBe(true);
      expect(Object.isFrozen(result.evidence.integrityReference)).toBe(true);
      expect(Object.isFrozen(result.evidence.decisionInputReference))
        .toBe(true);
      expect(() => {
        (result.evidence.authority as any).ownerId = "mutated";
      }).toThrow();
      const keys = JSON.stringify(Object.keys(result.evidence));
      for (const forbidden of [
        "url", "http", "bearer", "endpoint", "providerPayload",
        "secret", "credential", "cryptographicInternal",
      ]) expect(keys.toLowerCase()).not.toContain(forbidden.toLowerCase());
    });

    it("contains storage failures without leaking internals", async () => {
      const store = new MemoryStore();
      store.fail = true;
      const serialized = JSON.stringify(
        await admitVerifiedCanonicalFactAsDecisionEvidence(
          { tenantId: "tenant-001", factId: canonicalFact().factId },
          store,
        )
      );
      expect(serialized).toBe(
        '{"admitted":false,"denial":"CANONICAL_FACT_VERIFICATION_DENIED"}'
      );
      expect(serialized).not.toContain("secret");
      expect(serialized).not.toContain("credential");
      expect(serialized).not.toContain("infrastructure-id");
    });
  },
);
