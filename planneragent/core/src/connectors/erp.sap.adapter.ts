import {
  PRODUCTION_ERP_PROFILES,
  ProductionErpConnectorError,
  createProductionErpConnector,
  type ProductionErpConnectorDependencies,
  type ProductionErpProfileName,
} from "./generic.erp.adapter";
import type { ConnectorExecutionAccess } from "../industrial/connector.access";
import { registerConnector, type IndustrialConnector } from "../industrial/system.registry";

export const SAP_PROFILE = "SAP_ODATA_V4_FACADE_V1" as const;
export const SAP_PROFILE_VERSION = "1" as const;
export type SapLaneConfig = Readonly<{ path: string; representationProfile: string }>;
export type SapConnectorConfig = Readonly<{
  profile: typeof SAP_PROFILE; profileVersion: typeof SAP_PROFILE_VERSION;
  baseUrl: string; healthPath: string; tenantId: string; companyId: string; ownerId: string;
  sourceSystem: string; sourceRegion: string; credentialReference: string;
  authenticationProfile: "BEARER_TOKEN_V1"; requestTimeoutMs: number;
  maxResponseBytes?: number; maxPages: number; maxRecords: number;
  lanes: Readonly<Partial<Record<ProductionErpProfileName, SapLaneConfig>>>;
}>;
export type SapConnectorEnv = Readonly<Record<string, string | undefined>>;
export type SapFailure =
  | "SAP_CONFIGURATION_INVALID" | "SAP_PROFILE_UNSUPPORTED" | "SAP_PROFILE_VERSION_UNSUPPORTED"
  | "SAP_CAPABILITY_NOT_CONFIGURED" | "SAP_ENDPOINT_INVALID" | "SAP_AUTHENTICATION_PROFILE_INVALID"
  | "SAP_PROVIDER_UNREACHABLE" | "SAP_PROVIDER_TIMEOUT" | "SAP_REDIRECT_PROHIBITED"
  | "SAP_RESPONSE_TOO_LARGE" | "SAP_CONTENT_TYPE_INVALID" | "SAP_ENVELOPE_INVALID"
  | "SAP_PROVIDER_ERROR_RESPONSE" | "SAP_SCHEMA_INVALID" | "SAP_REQUIRED_FIELD_MISSING"
  | "SAP_UNKNOWN_FIELD" | "SAP_VALUE_TYPE_INVALID" | "SAP_NUMERIC_FORMAT_INVALID"
  | "SAP_DATE_FORMAT_INVALID" | "SAP_UNIT_INVALID" | "SAP_DUPLICATE_IDENTITY"
  | "SAP_PAGINATION_INVALID" | "SAP_PAGINATION_LIMIT_EXCEEDED" | "SAP_SOURCE_CONTRADICTION"
  | "SAP_CAPABILITY_PAYLOAD_MISMATCH" | "SAP_WRITE_OPERATION_PROHIBITED" | "SAP_ACQUISITION_FAILED";

const CONNECTOR_ID = "erp-sap-odata-v4";
const IDENTITY_ID = "connector-identity:erp-sap-odata-v4";
const GENERIC_IDENTITY_ID = "connector-identity:erp-production-rest";
const NAMES = Object.keys(PRODUCTION_ERP_PROFILES) as ProductionErpProfileName[];
let initializedConfiguration: string | undefined;

export class SapConnectorError extends Error {
  constructor(readonly code: SapFailure) { super(code === "SAP_CONFIGURATION_INVALID" ? "Invalid SAP connector configuration" : "SAP connector request failed"); this.name = "SapConnectorError"; }
}
const fail = (code: SapFailure): never => { throw new SapConnectorError(code); };
function freeze<T>(value: T): Readonly<T> { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value as Record<string, unknown>).forEach(freeze); Object.freeze(value); } return value; }
function identifier(value: string): string { if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(value)) fail("SAP_CONFIGURATION_INVALID"); return value; }
function path(value: string): string { if (!/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/.test(value) || value.includes("//") || /[?#]/.test(value) || value.split("/").some(v => v === "." || v === "..")) fail("SAP_ENDPOINT_INVALID"); return value.length > 1 ? value.replace(/\/$/, "") : value; }

export function validateSapConnectorConfig(input: SapConnectorConfig): SapConnectorConfig {
  if (input.profile !== SAP_PROFILE) fail("SAP_PROFILE_UNSUPPORTED");
  if (input.profileVersion !== SAP_PROFILE_VERSION) fail("SAP_PROFILE_VERSION_UNSUPPORTED");
  if (input.authenticationProfile !== "BEARER_TOKEN_V1" || !/^secret:\/\/[A-Za-z0-9][A-Za-z0-9/._-]{0,255}$/.test(input.credentialReference)) fail("SAP_AUTHENTICATION_PROFILE_INVALID");
  let base: URL;
  try { base = new URL(input.baseUrl); } catch { return fail("SAP_CONFIGURATION_INVALID"); }
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || !Number.isInteger(input.requestTimeoutMs) || input.requestTimeoutMs < 1 || input.requestTimeoutMs > 30_000 || !Number.isSafeInteger(input.maxPages) || input.maxPages < 1 || input.maxPages > 100 || !Number.isSafeInteger(input.maxRecords) || input.maxRecords < 1 || input.maxRecords > 100_000) fail("SAP_CONFIGURATION_INVALID");
  const lanes: Partial<Record<ProductionErpProfileName, SapLaneConfig>> = {};
  for (const [name, lane] of Object.entries(input.lanes)) {
    if (!NAMES.includes(name as ProductionErpProfileName) || !lane) fail("SAP_PROFILE_UNSUPPORTED");
    const typed = name as ProductionErpProfileName;
    if (lane.representationProfile !== PRODUCTION_ERP_PROFILES[typed]) fail("SAP_PROFILE_UNSUPPORTED");
    lanes[typed] = freeze({ path: path(lane.path), representationProfile: lane.representationProfile });
  }
  if (!Object.keys(lanes).length) fail("SAP_CONFIGURATION_INVALID");
  return freeze({ ...input, baseUrl: base.toString().replace(/\/$/, ""), healthPath: path(input.healthPath), tenantId: identifier(input.tenantId), companyId: identifier(input.companyId), ownerId: identifier(input.ownerId), sourceSystem: identifier(input.sourceSystem), sourceRegion: identifier(input.sourceRegion), lanes: freeze(lanes) }) as SapConnectorConfig;
}

type Mapping = Readonly<{ collection: string; fields: Readonly<Record<string, string>>; optional?: readonly string[] }>;
const MAP: Readonly<Record<ProductionErpProfileName, Mapping>> = freeze({
  ORDERS: { collection: "orders", fields: { SalesOrder: "external_order_id", SalesOrderVersion: "external_order_version", CompanyCode: "company_id", OwnerId: "owner_id", SourceSystem: "source_system", Material: "sku", RequestedQuantity: "quantity_value", RequestedQuantityUnit: "quantity_unit", OverallStatus: "status", LastChangeDateTime: "observed_at", CreationDateTime: "effective_at", RequestedDeliveryDateTime: "due_at" } },
  INVENTORY: { collection: "inventory", fields: { InventoryItem: "inventory_id", CompanyCode: "company_id", SourceSystem: "source_system", StorageLocation: "warehouse_id", Material: "sku", Quantity: "quantity", Unit: "unit", LastChangeDateTime: "observed_at" } },
  MOVEMENTS: { collection: "movements", fields: { MaterialDocumentItem: "movement_id", CompanyCode: "company_id", SourceSystem: "source_system", Material: "sku", Quantity: "quantity", MovementType: "type", Unit: "unit", PostingDateTime: "occurred_at" } },
  PRODUCTION_ORDERS: { collection: "productionOrders", fields: { ManufacturingOrder: "production_order_id", CompanyCode: "company_id", SourceSystem: "source_system", Material: "article", OutputMaterial: "output_article", TotalQuantity: "quantity", Unit: "unit", ScheduledStartDateTime: "scheduled_at" } },
  MATERIAL_MOVEMENTS: { collection: "materialMovements", fields: { MaterialDocumentItem: "movement_id", ManufacturingOrder: "production_order_id", CompanyCode: "company_id", SourceSystem: "source_system", Material: "article", Quantity: "quantity", MovementType: "type", Unit: "unit", PostingDateTime: "occurred_at" } },
  MASTER_BOM: { collection: "masterBom", fields: { BillOfMaterial: "parent", BillOfMaterialItem: "component", CompanyCode: "company_id", SourceSystem: "source_system", ComponentQuantity: "ratio", Unit: "unit", RevisionLevel: "revision", ValidityStartDateTime: "valid_from" } },
});

function projectRow(name: ProductionErpProfileName, raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("SAP_SCHEMA_INVALID");
  const row = raw as Record<string, unknown>; const mapping = MAP[name]; const allowed = new Set(Object.keys(mapping.fields));
  for (const key of Object.keys(row)) if (!allowed.has(key)) fail("SAP_UNKNOWN_FIELD");
  const projected: Record<string, unknown> = {};
  for (const [sap, generic] of Object.entries(mapping.fields)) { if (!(sap in row)) fail("SAP_REQUIRED_FIELD_MISSING"); projected[generic] = row[sap]; }
  return projected;
}
function parseEnvelope(name: ProductionErpProfileName, body: unknown): { rows: Record<string, unknown>[]; next?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) fail("SAP_ENVELOPE_INVALID");
  const object = body as Record<string, unknown>; const allowed = new Set(["@odata.context", "@odata.nextLink", "value", "error"]);
  for (const key of Object.keys(object)) if (!allowed.has(key)) fail("SAP_UNKNOWN_FIELD");
  if ("error" in object) fail("SAP_PROVIDER_ERROR_RESPONSE");
  if (!Array.isArray(object.value)) fail("SAP_ENVELOPE_INVALID");
  if (object["@odata.context"] !== undefined && typeof object["@odata.context"] !== "string") fail("SAP_ENVELOPE_INVALID");
  if (object["@odata.nextLink"] !== undefined && typeof object["@odata.nextLink"] !== "string") fail("SAP_PAGINATION_INVALID");
  return { rows: (object.value as unknown[]).map((row: unknown) => projectRow(name, row)), next: object["@odata.nextLink"] as string | undefined };
}
function mapGeneric(error: unknown): never {
  if (!(error instanceof ProductionErpConnectorError)) throw error;
  const codes: Partial<Record<string, SapFailure>> = { ERP_CAPABILITY_NOT_CONFIGURED: "SAP_CAPABILITY_NOT_CONFIGURED", ERP_PROFILE_UNSUPPORTED: "SAP_PROFILE_UNSUPPORTED", ERP_WRITE_OPERATION_PROHIBITED: "SAP_WRITE_OPERATION_PROHIBITED", ERP_REDIRECT_PROHIBITED: "SAP_REDIRECT_PROHIBITED", ERP_PROVIDER_TIMEOUT: "SAP_PROVIDER_TIMEOUT", ERP_RESPONSE_TOO_LARGE: "SAP_RESPONSE_TOO_LARGE", ERP_CONTENT_TYPE_INVALID: "SAP_CONTENT_TYPE_INVALID", ERP_REQUIRED_FIELD_MISSING: "SAP_REQUIRED_FIELD_MISSING", ERP_UNKNOWN_FIELD: "SAP_UNKNOWN_FIELD", ERP_VALUE_TYPE_INVALID: "SAP_VALUE_TYPE_INVALID", ERP_NUMERIC_COERCION_PROHIBITED: "SAP_NUMERIC_FORMAT_INVALID", ERP_DATE_AMBIGUOUS: "SAP_DATE_FORMAT_INVALID", ERP_DUPLICATE_IDENTITY: "SAP_DUPLICATE_IDENTITY", ERP_SOURCE_IDENTITY_CONTRADICTION: "SAP_SOURCE_CONTRADICTION", ERP_CAPABILITY_PAYLOAD_MISMATCH: "SAP_CAPABILITY_PAYLOAD_MISMATCH" };
  return fail(codes[error.code] ?? "SAP_ACQUISITION_FAILED");
}

export function createSapConnector(input: SapConnectorConfig, dependencies: ProductionErpConnectorDependencies = { fetch, now: Date.now }): IndustrialConnector {
  const config = validateSapConnectorConfig(input); const genericPaths = Object.fromEntries(Object.entries(config.lanes).map(([name, lane]) => [name, lane!.path]));
  let active: ProductionErpProfileName | undefined; let translatedFailure: SapConnectorError | undefined;
  const translatingFetch: typeof fetch = async (url, init) => {
    const selected = active;
    if (!selected) return fail("SAP_ACQUISITION_FAILED");
    try {
    const origin = new URL(config.baseUrl).origin; let next = new URL(String(url)); const visited = new Set<string>(); const rows: Record<string, unknown>[] = [];
    for (let page = 1; ; page++) {
      if (page > config.maxPages) fail("SAP_PAGINATION_LIMIT_EXCEEDED");
      if (next.origin !== origin || visited.has(next.href)) fail("SAP_PAGINATION_INVALID"); visited.add(next.href);
      let response: Response;
      try { response = await dependencies.fetch(next.href, init); } catch { return fail("SAP_PROVIDER_UNREACHABLE"); }
      if (response.status >= 300 && response.status < 400) fail("SAP_REDIRECT_PROHIBITED");
      if (!response.ok) fail("SAP_PROVIDER_ERROR_RESPONSE");
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) fail("SAP_CONTENT_TYPE_INVALID");
      let body: unknown; try { body = await response.json(); } catch { fail("SAP_ENVELOPE_INVALID"); }
      const parsed = parseEnvelope(selected, body); rows.push(...parsed.rows); if (rows.length > config.maxRecords) fail("SAP_PAGINATION_LIMIT_EXCEEDED");
      if (!parsed.next) break; try { next = new URL(parsed.next, next); } catch { fail("SAP_PAGINATION_INVALID"); }
    }
    return new Response(JSON.stringify({ schema_version: PRODUCTION_ERP_PROFILES[selected], source_system: config.sourceSystem, [MAP[selected].collection]: rows }), { headers: { "content-type": "application/json" } });
    } catch (error) { if (error instanceof SapConnectorError) translatedFailure = error; throw error; }
  };
  const generic = createProductionErpConnector({ ...config, profilePaths: genericPaths }, { fetch: translatingFetch, now: dependencies.now });
  return freeze({ id: CONNECTOR_ID, vendor: "SAP_ODATA_V4_FACADE", identity: { connectorId: CONNECTOR_ID, identityId: IDENTITY_ID, credentialReference: config.credentialReference }, dataPolicyBinding: generic.dataPolicyBinding, capabilities: generic.capabilities,
    async health() { const started = dependencies.now(); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs); try { const response = await dependencies.fetch(`${config.baseUrl}${config.healthPath}`, { method: "HEAD", redirect: "error", signal: controller.signal }); return freeze({ ok: response.ok && response.status < 300, connectorIdentityId: IDENTITY_ID, checkedAt: new Date(dependencies.now()).toISOString(), latencyMs: Math.max(0, dependencies.now() - started) }); } catch { return freeze({ ok: false, connectorIdentityId: IDENTITY_ID, checkedAt: new Date(dependencies.now()).toISOString(), latencyMs: Math.max(0, dependencies.now() - started) }); } finally { clearTimeout(timer); } },
    async execute(capabilityId: string, payload: Record<string, unknown>, access: ConnectorExecutionAccess) {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(String(payload.method).toUpperCase())) fail("SAP_WRITE_OPERATION_PROHIBITED");
      const requested = payload.providerProfile; active = NAMES.find(name => config.lanes[name] && PRODUCTION_ERP_PROFILES[name] === requested) ?? NAMES.filter(name => config.lanes[name] && generic.capabilities.some(c => c.id === capabilityId)).find(name => name !== "MATERIAL_MOVEMENTS" || requested === PRODUCTION_ERP_PROFILES[name]);
      const admission = access.dataPolicyAdmission; const genericAccess = { ...access, dataPolicyAdmission: { ...admission, connectorIdentityId: GENERIC_IDENTITY_ID, context: { ...admission.context, transportEvidence: { ...admission.context.transportEvidence, connectorIdentityId: GENERIC_IDENTITY_ID }, encryptionEvidence: { ...admission.context.encryptionEvidence, connectorIdentityId: GENERIC_IDENTITY_ID } } } } as ConnectorExecutionAccess;
      translatedFailure = undefined;
      try { const output = await generic.execute(capabilityId, payload, genericAccess); const copy = structuredClone(output) as Record<string, any>; copy.acquisition.connectorIdentityId = IDENTITY_ID; copy.sap = { profile: SAP_PROFILE, profileVersion: SAP_PROFILE_VERSION }; return freeze(copy) as Record<string, unknown>; } catch (error) { if (translatedFailure) throw translatedFailure; return mapGeneric(error); } finally { active = undefined; translatedFailure = undefined; }
    }
  }) as IndustrialConnector;
}

export function initializeSapConnector(env: SapConnectorEnv): boolean {
  const prefix = "INDUSTRIAL_SAP_"; const any = Object.keys(env).some(key => key.startsWith(prefix) && env[key] !== undefined); if (!any) return false;
  const required = (name: string): string => { const value = env[`${prefix}${name}`]; if (!value) return fail("SAP_CONFIGURATION_INVALID"); return value; };
  const lanes: Partial<Record<ProductionErpProfileName, SapLaneConfig>> = {}; for (const name of NAMES) { const value = env[`${prefix}${name}_PATH`]; if (value) lanes[name] = { path: value, representationProfile: PRODUCTION_ERP_PROFILES[name] }; }
  const config = validateSapConnectorConfig({ profile: required("PROFILE") as typeof SAP_PROFILE, profileVersion: required("PROFILE_VERSION") as "1", baseUrl: required("BASE_URL"), healthPath: required("HEALTH_PATH"), tenantId: required("TENANT_ID"), companyId: required("COMPANY_ID"), ownerId: required("OWNER_ID"), sourceSystem: required("SOURCE_SYSTEM"), sourceRegion: required("SOURCE_REGION"), credentialReference: required("CREDENTIAL_REFERENCE"), authenticationProfile: required("AUTHENTICATION_PROFILE") as "BEARER_TOKEN_V1", requestTimeoutMs: Number(required("REQUEST_TIMEOUT_MS")), maxResponseBytes: env[`${prefix}MAX_RESPONSE_BYTES`] ? Number(env[`${prefix}MAX_RESPONSE_BYTES`]) : undefined, maxPages: Number(required("MAX_PAGES")), maxRecords: Number(required("MAX_RECORDS")), lanes });
  const fingerprint = JSON.stringify(config); if (initializedConfiguration) { if (initializedConfiguration !== fingerprint) fail("SAP_CONFIGURATION_INVALID"); return true; }
  registerConnector(createSapConnector(config)); initializedConfiguration = fingerprint; return true;
}
