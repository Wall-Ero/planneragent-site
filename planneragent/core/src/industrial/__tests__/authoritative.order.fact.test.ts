import { describe, expect, it } from "vitest";
import type { AdapterExecutionResult } from "../adapter.runtime";
import {
  CANONICAL_ORDER_FACT_FAMILY,
  CANONICAL_ORDER_SCHEMA_VERSION,
  canonicalizeProductionErpOrders,
  PRODUCTION_ERP_ORDER_TRANSFORMATION,
  PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
} from "../canonicalization/authoritative.order.fact";

const TRANSFORMATION = {
  transformationId: PRODUCTION_ERP_ORDER_TRANSFORMATION,
  transformationVersion: PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
};

function acquisition(): Extract<AdapterExecutionResult, { ok: true }> {
  return {
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
}

function clone(): any {
  return structuredClone(acquisition());
}

function expectDenied(
  value: AdapterExecutionResult,
  denial: string,
  transformation: {
    transformationId: string;
    transformationVersion: string;
  } = TRANSFORMATION
) {
  const result = canonicalizeProductionErpOrders(value, transformation);
  expect(result).toEqual({ ok: false, denial });
  expect("facts" in result).toBe(false);
}

describe("Data Canonicalization — Authoritative Order Fact Boundary", () => {
  it("creates exactly one closed canonical fact from admitted external data", () => {
    const result = canonicalizeProductionErpOrders(
      acquisition(),
      TRANSFORMATION
    );
    expect(result).toEqual({
      ok: true,
      facts: [{
        factId:
          "industrial-order:10:tenant-001:14:PRODUCTION_ERP:8:ERP-1001:1:7",
        factFamily: CANONICAL_ORDER_FACT_FAMILY,
        schemaVersion: CANONICAL_ORDER_SCHEMA_VERSION,
        owner: {
          tenantId: "tenant-001",
          companyId: "company-001",
          ownerId: "procurement-owner-001",
        },
        source: {
          systemId: "PRODUCTION_ERP",
          externalObjectId: "ERP-1001",
          externalObjectVersion: "7",
        },
        observedAt: "2026-07-26T19:55:00.000Z",
        effectiveAt: "2026-07-26T19:00:00.000Z",
        order: {
          sku: "MATERIAL-001",
          quantity: { value: 12, unit: "EACH" },
          status: "OPEN",
          dueAt: "2026-08-01T00:00:00.000Z",
        },
        provenance: {
          acquisitionReference: "data-access:production-erp",
          authorizationReference: "authorization:production-erp",
          acquiredAt: "2026-07-26T20:00:00.000Z",
          capabilityId: "read_orders",
          connectorIdentityId: "connector-identity:erp-production-rest",
          connectorRevision: 1,
          sourceRepresentation: "PRODUCTION_REST_ERP_ORDERS_V1",
          transformationId:
            "PRODUCTION_REST_ERP_ORDER_TO_CANONICAL_ORDER",
          transformationVersion: "1.0.0",
          canonicalSchemaVersion: "1.0.0",
          tenantId: "tenant-001",
          companyId: "company-001",
          ownerId: "procurement-owner-001",
          sourceSystem: "PRODUCTION_ERP",
          externalObjectId: "ERP-1001",
          externalObjectVersion: "7",
        },
      }],
    });
    expect((acquisition().output as any).factFamily).toBeUndefined();
  });

  it("is deterministic for repeated canonicalization", () => {
    expect(canonicalizeProductionErpOrders(acquisition(), TRANSFORMATION))
      .toEqual(canonicalizeProductionErpOrders(acquisition(), TRANSFORMATION));
  });

  it.each([
    ["missing external identity", (x: any) =>
      delete x.output.orders[0].external_order_id,
      "ORDER_REQUIRED_FIELD_MISSING"],
    ["malformed source identity", (x: any) =>
      x.source_system = "bad source", "ACQUISITION_LINEAGE_INVALID"],
    ["missing owner", (x: any) =>
      delete x.output.acquisition.ownerId, "ACQUISITION_LINEAGE_INVALID"],
    ["cross-tenant lineage", (x: any) =>
      x.output.acquisition.tenantId = "tenant-002",
      "ACQUISITION_LINEAGE_INVALID"],
    ["owner/source mismatch", (x: any) =>
      x.output.orders[0].owner_id = "owner-002",
      "ORDER_OWNERSHIP_CONTRADICTION"],
    ["missing source representation", (x: any) =>
      delete x.output.sourceRepresentation,
      "SOURCE_REPRESENTATION_MISSING"],
    ["unsupported source representation", (x: any) =>
      x.output.sourceRepresentation = "ERP_ORDERS_V2",
      "SOURCE_REPRESENTATION_UNSUPPORTED"],
    ["missing required business field", (x: any) =>
      delete x.output.orders[0].sku, "ORDER_REQUIRED_FIELD_MISSING"],
    ["invalid date", (x: any) =>
      x.output.orders[0].due_at = "tomorrow", "ORDER_DATE_INVALID"],
    ["temporal contradiction", (x: any) =>
      x.output.orders[0].effective_at = "2026-08-02T00:00:00.000Z",
      "ORDER_TEMPORAL_CONTRADICTION"],
    ["invalid numeric value", (x: any) =>
      x.output.orders[0].quantity_value = Number.NaN,
      "ORDER_NUMERIC_INVALID"],
    ["ambiguous unit", (x: any) =>
      x.output.orders[0].quantity_unit = "UNIT",
      "ORDER_UNIT_UNSUPPORTED"],
    ["ambiguous currency", (x: any) =>
      x.output.orders[0].currency = "USD",
      "ORDER_SOURCE_FIELD_UNSUPPORTED"],
    ["unsupported status", (x: any) =>
      x.output.orders[0].status = "UNKNOWN",
      "ORDER_STATUS_UNSUPPORTED"],
    ["unknown coercion", (x: any) =>
      x.output.orders[0].sku = "UNKNOWN", "ORDER_IDENTIFIER_INVALID"],
    ["silent default attempt", (x: any) =>
      x.output.orders[0].quantity_value = undefined,
      "ORDER_NUMERIC_INVALID"],
    ["source object substitution", (x: any) =>
      x.source_system = "SUBSTITUTED_ERP", "ACQUISITION_LINEAGE_INVALID"],
    ["connector identity substitution", (x: any) =>
      x.output.acquisition.connectorIdentityId = "connector-identity:other",
      "ACQUISITION_LINEAGE_INVALID"],
    ["connector revision substitution", (x: any) =>
      x.output.acquisition.connectorRevision = 2,
      "ACQUISITION_LINEAGE_INVALID"],
    ["acquisition reference substitution", (x: any) =>
      x.output.acquisition.acquisitionReference = "data-access:other",
      "ACQUISITION_LINEAGE_INVALID"],
    ["provider-specific field leakage", (x: any) =>
      x.output.orders[0].provider_internal_id = "secret",
      "ORDER_SOURCE_FIELD_UNSUPPORTED"],
  ])("rejects %s without producing a fact", (_name, mutate, denial) => {
    const value = clone();
    mutate(value);
    expectDenied(value, denial);
  });

  it("rejects transformation version substitution", () => {
    expectDenied(acquisition(), "TRANSFORMATION_UNSUPPORTED", {
      ...TRANSFORMATION,
      transformationVersion: "2.0.0",
    });
  });

  it("rejects duplicated exact source identities atomically", () => {
    const value = clone();
    value.output.orders.push(structuredClone(value.output.orders[0]));
    expectDenied(value, "ORDER_DUPLICATE_EXTERNAL_ID");
  });

  it("deeply freezes the canonical fact and provenance", () => {
    const result = canonicalizeProductionErpOrders(
      acquisition(),
      TRANSFORMATION
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.facts)).toBe(true);
    expect(Object.isFrozen(result.facts[0])).toBe(true);
    expect(Object.isFrozen(result.facts[0]?.owner)).toBe(true);
    expect(Object.isFrozen(result.facts[0]?.order.quantity)).toBe(true);
    expect(Object.isFrozen(result.facts[0]?.provenance)).toBe(true);
    expect(() => {
      (result.facts[0]!.provenance as any).ownerId = "mutated";
    }).toThrow();
    expect(() => {
      (result.facts[0]!.order.quantity as any).value = 99;
    }).toThrow();
  });

  it("rejects a denied acquisition result", () => {
    expectDenied(
      { ok: false, reason: "denied", denial: "TENANT_BOUNDARY_DENIED" },
      "ACQUISITION_NOT_ADMITTED"
    );
  });
});
