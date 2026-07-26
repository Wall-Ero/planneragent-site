import {
  PRODUCTION_ERP_ORDER_SOURCE_REPRESENTATION,
} from "../../connectors/generic.erp.adapter";
import type { AdapterExecutionResult } from "../adapter.runtime";

export const CANONICAL_ORDER_FACT_FAMILY = "INDUSTRIAL_ORDER" as const;
export const CANONICAL_ORDER_SCHEMA_VERSION = "1.0.0" as const;
export const PRODUCTION_ERP_ORDER_TRANSFORMATION =
  "PRODUCTION_REST_ERP_ORDER_TO_CANONICAL_ORDER" as const;
export const PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION = "1.0.0" as const;

export type CanonicalOrderDenial =
  | "ACQUISITION_NOT_ADMITTED"
  | "ACQUISITION_LINEAGE_INVALID"
  | "SOURCE_REPRESENTATION_MISSING"
  | "SOURCE_REPRESENTATION_UNSUPPORTED"
  | "TRANSFORMATION_UNSUPPORTED"
  | "ORDER_REQUIRED_FIELD_MISSING"
  | "ORDER_SOURCE_FIELD_UNSUPPORTED"
  | "ORDER_IDENTIFIER_INVALID"
  | "ORDER_DATE_INVALID"
  | "ORDER_TEMPORAL_CONTRADICTION"
  | "ORDER_NUMERIC_INVALID"
  | "ORDER_UNIT_UNSUPPORTED"
  | "ORDER_STATUS_UNSUPPORTED"
  | "ORDER_OWNERSHIP_CONTRADICTION"
  | "ORDER_DUPLICATE_EXTERNAL_ID";

export type CanonicalOrderFact = Readonly<{
  factId: string;
  factFamily: typeof CANONICAL_ORDER_FACT_FAMILY;
  schemaVersion: typeof CANONICAL_ORDER_SCHEMA_VERSION;
  owner: Readonly<{
    tenantId: string;
    companyId: string;
    ownerId: string;
  }>;
  source: Readonly<{
    systemId: string;
    externalObjectId: string;
    externalObjectVersion: string;
  }>;
  observedAt: string;
  effectiveAt: string;
  order: Readonly<{
    sku: string;
    quantity: Readonly<{ value: number; unit: "EACH" }>;
    status: "OPEN";
    dueAt: string;
  }>;
  provenance: Readonly<{
    acquisitionReference: string;
    authorizationReference: string;
    acquiredAt: string;
    capabilityId: "read_orders";
    connectorIdentityId: string;
    connectorRevision: number;
    sourceRepresentation: typeof PRODUCTION_ERP_ORDER_SOURCE_REPRESENTATION;
    transformationId: typeof PRODUCTION_ERP_ORDER_TRANSFORMATION;
    transformationVersion: typeof PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION;
    canonicalSchemaVersion: typeof CANONICAL_ORDER_SCHEMA_VERSION;
    tenantId: string;
    companyId: string;
    ownerId: string;
    sourceSystem: string;
    externalObjectId: string;
    externalObjectVersion: string;
  }>;
}>;

export type CanonicalOrderResult =
  | Readonly<{ ok: true; facts: readonly CanonicalOrderFact[] }>
  | Readonly<{ ok: false; denial: CanonicalOrderDenial }>;

type TransformationReference = Readonly<{
  transformationId: string;
  transformationVersion: string;
}>;

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;
const SOURCE_ORDER_KEYS = [
  "company_id",
  "due_at",
  "effective_at",
  "external_order_id",
  "external_order_version",
  "observed_at",
  "owner_id",
  "quantity_unit",
  "quantity_value",
  "sku",
  "status",
] as const;

function reject(denial: CanonicalOrderDenial): CanonicalOrderResult {
  return Object.freeze({ ok: false, denial });
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function identifier(value: unknown): value is string {
  return typeof value === "string" &&
    value !== "UNKNOWN" &&
    IDENTIFIER.test(value);
}

function canonicalDate(value: unknown): value is string {
  return typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function hasExactKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === SOURCE_ORDER_KEYS.length &&
    keys.every((key, index) => key === SOURCE_ORDER_KEYS[index]);
}

function freezeFact(fact: CanonicalOrderFact): CanonicalOrderFact {
  Object.freeze(fact.owner);
  Object.freeze(fact.source);
  Object.freeze(fact.order.quantity);
  Object.freeze(fact.order);
  Object.freeze(fact.provenance);
  return Object.freeze(fact);
}

function identityPart(value: string): string {
  return `${value.length}:${value}`;
}

export function canonicalizeProductionErpOrders(
  acquisition: AdapterExecutionResult,
  transformation: TransformationReference
): CanonicalOrderResult {
  if (!acquisition.ok) {
    return reject("ACQUISITION_NOT_ADMITTED");
  }
  if (
    transformation.transformationId !== PRODUCTION_ERP_ORDER_TRANSFORMATION ||
    transformation.transformationVersion !==
      PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION
  ) {
    return reject("TRANSFORMATION_UNSUPPORTED");
  }
  if (
    acquisition.capability_id !== "read_orders" ||
    acquisition.connector_id !== "erp-production-rest" ||
    acquisition.connector_identity_id !==
      "connector-identity:erp-production-rest" ||
    !Number.isInteger(acquisition.connector_revision) ||
    acquisition.connector_revision < 1
  ) {
    return reject("ACQUISITION_LINEAGE_INVALID");
  }

  const output = record(acquisition.output);
  if (!output || !Object.hasOwn(output, "sourceRepresentation")) {
    return reject("SOURCE_REPRESENTATION_MISSING");
  }
  if (
    output.sourceRepresentation !==
      PRODUCTION_ERP_ORDER_SOURCE_REPRESENTATION
  ) {
    return reject("SOURCE_REPRESENTATION_UNSUPPORTED");
  }
  const lineage = record(output.acquisition);
  if (
    !lineage ||
    !identifier(lineage.acquisitionReference) ||
    !canonicalDate(lineage.acquiredAt) ||
    !identifier(lineage.tenantId) ||
    !identifier(lineage.companyId) ||
    !identifier(lineage.ownerId) ||
    !identifier(lineage.sourceSystem) ||
    !identifier(lineage.connectorIdentityId) ||
    !Number.isInteger(lineage.connectorRevision) ||
    !identifier(lineage.authorizationReference) ||
    lineage.capabilityId !== "read_orders"
  ) {
    return reject("ACQUISITION_LINEAGE_INVALID");
  }
  if (
    lineage.acquisitionReference !== acquisition.acquisition_reference ||
    lineage.authorizationReference !== acquisition.authorization_reference ||
    lineage.tenantId !== acquisition.tenant_id ||
    lineage.sourceSystem !== acquisition.source_system ||
    lineage.connectorIdentityId !== acquisition.connector_identity_id ||
    lineage.connectorRevision !== acquisition.connector_revision
  ) {
    return reject("ACQUISITION_LINEAGE_INVALID");
  }
  if (!Array.isArray(output.orders)) {
    return reject("ORDER_REQUIRED_FIELD_MISSING");
  }

  const facts: CanonicalOrderFact[] = [];
  const identities = new Set<string>();
  for (const candidate of output.orders) {
    const order = record(candidate);
    if (!order) {
      return reject("ORDER_REQUIRED_FIELD_MISSING");
    }
    if (!hasExactKeys(order)) {
      const missing = SOURCE_ORDER_KEYS.some(key => !Object.hasOwn(order, key));
      return reject(
        missing ? "ORDER_REQUIRED_FIELD_MISSING" : "ORDER_SOURCE_FIELD_UNSUPPORTED"
      );
    }
    if (
      !identifier(order.external_order_id) ||
      !identifier(order.external_order_version) ||
      !identifier(order.company_id) ||
      !identifier(order.owner_id) ||
      !identifier(order.sku)
    ) {
      return reject("ORDER_IDENTIFIER_INVALID");
    }
    if (
      order.company_id !== lineage.companyId ||
      order.owner_id !== lineage.ownerId
    ) {
      return reject("ORDER_OWNERSHIP_CONTRADICTION");
    }
    if (
      !canonicalDate(order.observed_at) ||
      !canonicalDate(order.effective_at) ||
      !canonicalDate(order.due_at)
    ) {
      return reject("ORDER_DATE_INVALID");
    }
    if (
      Date.parse(order.effective_at) > Date.parse(order.due_at) ||
      Date.parse(order.observed_at) > Date.parse(lineage.acquiredAt)
    ) {
      return reject("ORDER_TEMPORAL_CONTRADICTION");
    }
    if (
      typeof order.quantity_value !== "number" ||
      !Number.isFinite(order.quantity_value) ||
      order.quantity_value <= 0
    ) {
      return reject("ORDER_NUMERIC_INVALID");
    }
    if (order.quantity_unit !== "EA") {
      return reject("ORDER_UNIT_UNSUPPORTED");
    }
    if (order.status !== "OPEN") {
      return reject("ORDER_STATUS_UNSUPPORTED");
    }

    const sourceIdentity = [
      lineage.sourceSystem,
      order.external_order_id,
      order.external_order_version,
    ].map(identityPart).join(":");
    if (identities.has(sourceIdentity)) {
      return reject("ORDER_DUPLICATE_EXTERNAL_ID");
    }
    identities.add(sourceIdentity);

    const owner = Object.freeze({
      tenantId: lineage.tenantId,
      companyId: lineage.companyId,
      ownerId: lineage.ownerId,
    });
    const source = Object.freeze({
      systemId: lineage.sourceSystem,
      externalObjectId: order.external_order_id,
      externalObjectVersion: order.external_order_version,
    });
    const provenance = Object.freeze({
      acquisitionReference: lineage.acquisitionReference,
      authorizationReference: lineage.authorizationReference,
      acquiredAt: lineage.acquiredAt,
      capabilityId: "read_orders" as const,
      connectorIdentityId: lineage.connectorIdentityId,
      connectorRevision: lineage.connectorRevision,
      sourceRepresentation: PRODUCTION_ERP_ORDER_SOURCE_REPRESENTATION,
      transformationId: PRODUCTION_ERP_ORDER_TRANSFORMATION,
      transformationVersion: PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
      canonicalSchemaVersion: CANONICAL_ORDER_SCHEMA_VERSION,
      tenantId: lineage.tenantId,
      companyId: lineage.companyId,
      ownerId: lineage.ownerId,
      sourceSystem: lineage.sourceSystem,
      externalObjectId: order.external_order_id,
      externalObjectVersion: order.external_order_version,
    });
    facts.push(freezeFact({
      factId:
        `industrial-order:${identityPart(lineage.tenantId)}:` +
        `${identityPart(lineage.sourceSystem)}:` +
        `${identityPart(order.external_order_id)}:` +
        identityPart(order.external_order_version),
      factFamily: CANONICAL_ORDER_FACT_FAMILY,
      schemaVersion: CANONICAL_ORDER_SCHEMA_VERSION,
      owner,
      source,
      observedAt: order.observed_at,
      effectiveAt: order.effective_at,
      order: Object.freeze({
        sku: order.sku,
        quantity: Object.freeze({
          value: order.quantity_value,
          unit: "EACH" as const,
        }),
        status: "OPEN" as const,
        dueAt: order.due_at,
      }),
      provenance,
    }));
  }

  return Object.freeze({ ok: true, facts: Object.freeze(facts) });
}
