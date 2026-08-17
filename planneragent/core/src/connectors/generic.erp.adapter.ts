import {
  READ_INVENTORY, READ_MASTER_BOM, READ_MOVEMENTS, READ_ORDERS,
  READ_PRODUCTION_PLAN,
} from "../industrial/capabilities";
import type { ConnectorExecutionAccess } from "../industrial/connector.access";
import { registerConnector, type IndustrialConnector } from "../industrial/system.registry";
import { preserveGovernedOperationsFactV1 } from "../industrial/preservation/governed.operational.fact.preservation.v1";

export const PRODUCTION_ERP_PROFILES = Object.freeze({
  ORDERS: "PRODUCTION_REST_ERP_ORDERS_V1",
  INVENTORY: "PRODUCTION_REST_ERP_INVENTORY_V1",
  MOVEMENTS: "PRODUCTION_REST_ERP_MOVEMENTS_V1",
  PRODUCTION_ORDERS: "PRODUCTION_REST_ERP_PRODUCTION_ORDERS_V1",
  MATERIAL_MOVEMENTS: "PRODUCTION_REST_ERP_MATERIAL_MOVEMENTS_V1",
  MASTER_BOM: "PRODUCTION_REST_ERP_MASTER_BOM_V1",
} as const);
export const PRODUCTION_ERP_ORDER_SOURCE_REPRESENTATION = PRODUCTION_ERP_PROFILES.ORDERS;
export type ProductionErpProfileName = keyof typeof PRODUCTION_ERP_PROFILES;
export type ProductionErpFailure =
  | "ERP_CONFIGURATION_INVALID" | "ERP_CAPABILITY_NOT_CONFIGURED"
  | "ERP_PROFILE_UNSUPPORTED" | "ERP_PROFILE_VERSION_UNSUPPORTED"
  | "ERP_ENDPOINT_PATH_INVALID" | "ERP_WRITE_OPERATION_PROHIBITED"
  | "ERP_REDIRECT_PROHIBITED" | "ERP_AUTHENTICATION_PROFILE_INVALID"
  | "ERP_PROVIDER_TIMEOUT" | "ERP_RESPONSE_TOO_LARGE"
  | "ERP_CONTENT_TYPE_INVALID" | "ERP_RESPONSE_SCHEMA_INVALID"
  | "ERP_REQUIRED_FIELD_MISSING" | "ERP_UNKNOWN_FIELD"
  | "ERP_VALUE_TYPE_INVALID" | "ERP_NUMERIC_COERCION_PROHIBITED"
  | "ERP_NON_FINITE_NUMBER" | "ERP_DATE_AMBIGUOUS"
  | "ERP_DUPLICATE_IDENTITY" | "ERP_SOURCE_IDENTITY_CONTRADICTION"
  | "ERP_CAPABILITY_PAYLOAD_MISMATCH" | "ERP_ACQUISITION_FAILED";

export type ProductionErpProfilePaths = Readonly<Partial<Record<ProductionErpProfileName, string>>>;
export type ProductionErpConnectorConfig = Readonly<{
  baseUrl: string; tenantId: string; companyId: string; ownerId: string;
  sourceSystem: string; sourceRegion: string; credentialReference: string;
  requestTimeoutMs: number; maxResponseBytes?: number;
  authenticationProfile?: "BEARER_TOKEN_V1"; healthPath?: string;
  profilePaths?: ProductionErpProfilePaths;
}>;
export type ProductionErpConnectorDependencies = Readonly<{ fetch: typeof fetch; now: () => number }>;
export type ProductionErpEnv = Readonly<{
  INDUSTRIAL_ERP_BASE_URL?: string; INDUSTRIAL_ERP_TENANT_ID?: string;
  INDUSTRIAL_ERP_COMPANY_ID?: string; INDUSTRIAL_ERP_OWNER_ID?: string;
  INDUSTRIAL_ERP_SOURCE_SYSTEM?: string; INDUSTRIAL_ERP_SOURCE_REGION?: string;
  INDUSTRIAL_ERP_CREDENTIAL_REFERENCE?: string; INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS?: string;
  INDUSTRIAL_ERP_MAX_RESPONSE_BYTES?: string; INDUSTRIAL_ERP_HEALTH_PATH?: string;
  INDUSTRIAL_ERP_ORDERS_PATH?: string; INDUSTRIAL_ERP_INVENTORY_PATH?: string;
  INDUSTRIAL_ERP_MOVEMENTS_PATH?: string; INDUSTRIAL_ERP_PRODUCTION_ORDERS_PATH?: string;
  INDUSTRIAL_ERP_MATERIAL_MOVEMENTS_PATH?: string; INDUSTRIAL_ERP_MASTER_BOM_PATH?: string;
}>;

const CONNECTOR_ID = "erp-production-rest";
const CONNECTOR_IDENTITY_ID = "connector-identity:erp-production-rest";
const DEFAULT_MAX_RESPONSE_BYTES = 1_000_000;
let initializedConfiguration: string | undefined;

export class ProductionErpConnectorError extends Error {
  readonly code: ProductionErpFailure;
  constructor(code: ProductionErpFailure) {
    super(code === "ERP_CONFIGURATION_INVALID" ? "Invalid production ERP connector configuration" : "Production ERP connector request failed"); this.name = "ProductionErpConnectorError"; this.code = code;
  }
}
const fail = (code: ProductionErpFailure): never => { throw new ProductionErpConnectorError(code); };
function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze); Object.freeze(value);
  }
  return value;
}
function identifier(value: string, label: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(value)) throw new Error(`Invalid production ERP ${label}`);
  return value;
}
function relativePath(value: string): string {
  if (!/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/.test(value) || value.includes("//") ||
    value.split("/").some(part => part === "." || part === "..") || /[?#]/.test(value)) {
    throw new ProductionErpConnectorError("ERP_ENDPOINT_PATH_INVALID");
  }
  return value.length > 1 ? value.replace(/\/$/, "") : value;
}
export function validateProductionErpConnectorConfig(input: ProductionErpConnectorConfig): ProductionErpConnectorConfig {
  let url: URL; try { url = new URL(input.baseUrl); } catch { throw new ProductionErpConnectorError("ERP_CONFIGURATION_INVALID"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
    !Number.isInteger(input.requestTimeoutMs) || input.requestTimeoutMs < 1 || input.requestTimeoutMs > 30_000 ||
    (input.authenticationProfile ?? "BEARER_TOKEN_V1") !== "BEARER_TOKEN_V1") {
    throw new ProductionErpConnectorError("ERP_CONFIGURATION_INVALID");
  }
  const max = input.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  if (!Number.isSafeInteger(max) || max < 1 || max > 10_000_000) throw new ProductionErpConnectorError("ERP_CONFIGURATION_INVALID");
  if (!/^secret:\/\/[A-Za-z0-9][A-Za-z0-9/._-]{0,255}$/.test(input.credentialReference)) fail("ERP_AUTHENTICATION_PROFILE_INVALID");
  if (!/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(input.sourceRegion)) throw new ProductionErpConnectorError("ERP_CONFIGURATION_INVALID");
  const supplied = input.profilePaths ?? { ORDERS: "/orders" }; // preserves the frozen first production connector configuration
  const profilePaths: Partial<Record<ProductionErpProfileName, string>> = {};
  for (const [name, path] of Object.entries(supplied)) {
    if (!(name in PRODUCTION_ERP_PROFILES) || typeof path !== "string") fail("ERP_PROFILE_UNSUPPORTED");
    profilePaths[name as ProductionErpProfileName] = relativePath(path);
  }
  if (Object.keys(profilePaths).length === 0) throw new ProductionErpConnectorError("ERP_CONFIGURATION_INVALID");
  return deepFreeze({ baseUrl: url.toString().replace(/\/$/, ""), tenantId: identifier(input.tenantId, "tenant"),
    companyId: identifier(input.companyId, "company"), ownerId: identifier(input.ownerId, "owner"),
    sourceSystem: identifier(input.sourceSystem, "source system"), sourceRegion: input.sourceRegion,
    credentialReference: input.credentialReference, requestTimeoutMs: input.requestTimeoutMs,
    maxResponseBytes: max, authenticationProfile: "BEARER_TOKEN_V1" as const,
    healthPath: relativePath(input.healthPath ?? "/health"), profilePaths });
}

type ProfileDefinition = Readonly<{ name: ProductionErpProfileName; capabilityId: string; collection: string;
  maxResponseBytes: number; identity: (row: Record<string, unknown>) => string; normalize: (row: Record<string, unknown>) => Record<string, string | number> }>;
const requiredString = (row: Record<string, unknown>, field: string): string => {
  if (!(field in row)) fail("ERP_REQUIRED_FIELD_MISSING"); if (typeof row[field] !== "string" || row[field] === "") fail("ERP_VALUE_TYPE_INVALID"); return row[field] as string;
};
const number = (row: Record<string, unknown>, field: string, positive = false): number => {
  if (!(field in row)) fail("ERP_REQUIRED_FIELD_MISSING");
  if (typeof row[field] === "string") fail("ERP_NUMERIC_COERCION_PROHIBITED");
  if (typeof row[field] !== "number") fail("ERP_VALUE_TYPE_INVALID");
  if (!Number.isFinite(row[field])) fail("ERP_NON_FINITE_NUMBER");
  if (positive ? (row[field] as number) <= 0 : (row[field] as number) < 0) fail("ERP_VALUE_TYPE_INVALID"); return row[field] as number;
};
const timestamp = (row: Record<string, unknown>, field: string): string => {
  const value = requiredString(row, field); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value))) fail("ERP_DATE_AMBIGUOUS"); return value;
};
const unit = (row: Record<string, unknown>): string => { const value = requiredString(row, "unit"); if (!/^(EA|KG|G|L|M|M2|M3)$/.test(value)) fail("ERP_VALUE_TYPE_INVALID"); return value; };
const closed = (row: Record<string, unknown>, fields: readonly string[]) => {
  for (const key of Object.keys(row)) if (!fields.includes(key)) fail("ERP_UNKNOWN_FIELD");
};
const source = (row: Record<string, unknown>, config: ProductionErpConnectorConfig) => {
  if (requiredString(row, "company_id") !== config.companyId || requiredString(row, "source_system") !== config.sourceSystem) fail("ERP_SOURCE_IDENTITY_CONTRADICTION");
};
const MOVEMENT_ATTRIBUTION_FIELDS = Object.freeze(["order_ref","delivery_ref","shipment_ref","production_order_ref","destination_ref","source_location_ref","destination_location_ref","movement_line_ref","reservation_ref","allocation_ref"] as const);
function movementAttribution(row:Record<string,unknown>):Record<string,string>{const result:Record<string,string>={};for(const field of MOVEMENT_ATTRIBUTION_FIELDS)if(row[field]!==undefined)result[field]=requiredString(row,field);return result;}

const DEFINITIONS: Readonly<Record<ProductionErpProfileName, ProfileDefinition>> = Object.freeze({
  ORDERS: { name: "ORDERS", capabilityId: READ_ORDERS.id, collection: "orders",
    maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES,
    identity: r => requiredString(r, "external_order_id"), normalize: r => ({ orderId: requiredString(r, "external_order_id"), sku: requiredString(r, "sku"), qty: number(r, "quantity_value") }) },
  INVENTORY: { name: "INVENTORY", capabilityId: READ_INVENTORY.id, collection: "inventory",
    maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES,
    identity: r => requiredString(r, "inventory_id"), normalize: r => ({ sku: requiredString(r, "sku"), qty: number(r, "quantity") }) },
  MOVEMENTS: { name: "MOVEMENTS", capabilityId: READ_MOVEMENTS.id, collection: "movements",
    maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES,
    identity: r => requiredString(r, "movement_id"), normalize: r => ({ sku: requiredString(r, "sku"), qty: number(r, "quantity"), type: requiredString(r, "type"), ...movementAttribution(r) }) },
  PRODUCTION_ORDERS: { name: "PRODUCTION_ORDERS", capabilityId: READ_PRODUCTION_PLAN.id, collection: "productionOrders",
    maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES,
    identity: r => requiredString(r, "production_order_id"), normalize: r => ({ order: requiredString(r, "production_order_id"), article: requiredString(r, "article"), quantity: number(r, "quantity", true), ...(r.planned_output_available_at !== undefined ? { planned_output_available_at: timestamp(r, "planned_output_available_at") } : {}) }) },
  MATERIAL_MOVEMENTS: { name: "MATERIAL_MOVEMENTS", capabilityId: READ_MOVEMENTS.id, collection: "materialMovements",
    maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES,
    identity: r => requiredString(r, "movement_id"), normalize: r => ({ order: requiredString(r, "production_order_id"), article: requiredString(r, "article"), quantity: number(r, "quantity", true), type: requiredString(r, "type"), production_order_ref:requiredString(r,"production_order_id"), ...movementAttribution(r) }) },
  MASTER_BOM: { name: "MASTER_BOM", capabilityId: READ_MASTER_BOM.id, collection: "masterBom",
    maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES,
    identity: r => `${requiredString(r, "parent")}:${requiredString(r, "component")}`, normalize: r => ({ parent: requiredString(r, "parent"), component: requiredString(r, "component"), ratio: number(r, "ratio", true) }) },
});
const FIELDS: Readonly<Record<ProductionErpProfileName, readonly string[]>> = Object.freeze({
  ORDERS: ["external_order_id", "external_order_version", "company_id", "owner_id", "source_system", "sku", "quantity_value", "quantity_unit", "status", "observed_at", "effective_at", "due_at"],
  INVENTORY: ["inventory_id", "company_id", "source_system", "warehouse_id", "sku", "quantity", "unit", "observed_at"],
  MOVEMENTS: ["movement_id", "company_id", "source_system", "sku", "quantity", "type", "unit", "occurred_at", ...MOVEMENT_ATTRIBUTION_FIELDS],
  PRODUCTION_ORDERS: ["production_order_id", "company_id", "source_system", "article", "output_article", "quantity", "unit", "scheduled_at", "planned_output_available_at"],
  MATERIAL_MOVEMENTS: ["movement_id", "production_order_id", "company_id", "source_system", "article", "quantity", "type", "unit", "occurred_at", ...MOVEMENT_ATTRIBUTION_FIELDS],
  MASTER_BOM: ["company_id", "source_system", "parent", "component", "ratio", "unit", "revision", "valid_from"],
});
function validateRow(name: ProductionErpProfileName, row: unknown, config: ProductionErpConnectorConfig): Record<string, unknown> {
  if (!row || typeof row !== "object" || Array.isArray(row)) fail("ERP_RESPONSE_SCHEMA_INVALID");
  const value = row as Record<string, unknown>; closed(value, FIELDS[name]);
  if (name === "ORDERS") { if (requiredString(value, "company_id") !== config.companyId || requiredString(value, "owner_id") !== config.ownerId) fail("ERP_SOURCE_IDENTITY_CONTRADICTION"); requiredString(value, "external_order_version"); requiredString(value, "quantity_unit"); requiredString(value, "status"); timestamp(value, "observed_at"); timestamp(value, "effective_at"); timestamp(value, "due_at"); }
  else source(value, config);
  if (name === "INVENTORY") { requiredString(value, "warehouse_id"); unit(value); timestamp(value, "observed_at"); }
  if (name === "MOVEMENTS") { if (!/^(RECEIPT|ISSUE|TRANSFER)$/.test(requiredString(value, "type"))) fail("ERP_CAPABILITY_PAYLOAD_MISMATCH"); unit(value); timestamp(value, "occurred_at"); }
  if (name === "PRODUCTION_ORDERS") { if (requiredString(value, "article") !== requiredString(value, "output_article")) fail("ERP_CAPABILITY_PAYLOAD_MISMATCH"); unit(value); timestamp(value, "scheduled_at"); if(value.planned_output_available_at!==undefined)timestamp(value,"planned_output_available_at"); }
  if (name === "MATERIAL_MOVEMENTS") { if (requiredString(value, "type") !== "CONSUMPTION") fail("ERP_CAPABILITY_PAYLOAD_MISMATCH");if(value.production_order_ref!==undefined&&requiredString(value,"production_order_ref")!==requiredString(value,"production_order_id"))fail("ERP_SOURCE_IDENTITY_CONTRADICTION"); unit(value); timestamp(value, "occurred_at"); }
  if(name==="MOVEMENTS"||name==="MATERIAL_MOVEMENTS")movementAttribution(value);
  if (name === "MASTER_BOM") { requiredString(value, "revision"); unit(value); timestamp(value, "valid_from"); }
  DEFINITIONS[name].normalize(value); return value;
}

async function fetchWithTimeout(d: ProductionErpConnectorDependencies, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController(); const handle = setTimeout(() => controller.abort(), timeoutMs);
  try { return await d.fetch(url, { ...init, signal: controller.signal }); }
  catch { throw new ProductionErpConnectorError(controller.signal.aborted ? "ERP_PROVIDER_TIMEOUT" : "ERP_ACQUISITION_FAILED"); }
  finally { clearTimeout(handle); }
}
async function readBoundedBody(response: Response, limit: number): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const item = await reader.read(); if (item.done) break;
      length += item.value.length; if (length > limit) { await reader.cancel(); fail("ERP_RESPONSE_TOO_LARGE"); }
      chunks.push(item.value.slice());
    }
  } catch (error) {
    if (error instanceof ProductionErpConnectorError) throw error;
    fail("ERP_ACQUISITION_FAILED");
  }
  const output = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
  return output;
}
function assertAdmission(config: ProductionErpConnectorConfig, access: ConnectorExecutionAccess) {
  const a = access.dataPolicyAdmission;
  if (a.decision !== "ADMITTED" || a.connectorIdentityId !== CONNECTOR_IDENTITY_ID || a.credentialReference !== config.credentialReference ||
    access.credential.credentialReference !== config.credentialReference || !access.credential.secret || a.context.tenantId !== config.tenantId ||
    a.context.sourceSystem !== config.sourceSystem || a.context.sourceRegion !== config.sourceRegion ||
    a.context.transportEvidence.scheme !== "HTTPS" || !a.context.transportEvidence.secure ||
    !a.context.encryptionEvidence.encryptedInTransit || !a.context.encryptionEvidence.encryptedAtRest) fail("ERP_ACQUISITION_FAILED");
}
function selectProfile(capabilityId: string, payload: Record<string, unknown>, paths: ProductionErpProfilePaths): ProductionErpProfileName {
  const candidates = (Object.keys(paths) as ProductionErpProfileName[]).filter(name => DEFINITIONS[name].capabilityId === capabilityId);
  if (candidates.length === 0) fail("ERP_CAPABILITY_NOT_CONFIGURED");
  if (Object.keys(payload).some(key => key !== "providerProfile")) fail("ERP_CAPABILITY_PAYLOAD_MISMATCH");
  if (payload.providerProfile !== undefined && typeof payload.providerProfile !== "string") fail("ERP_PROFILE_UNSUPPORTED");
  const named = payload.providerProfile ? candidates.find(name => PRODUCTION_ERP_PROFILES[name] === payload.providerProfile) : candidates.length === 1 ? candidates[0] : undefined;
  if (!named) throw new ProductionErpConnectorError("ERP_PROFILE_UNSUPPORTED"); return named;
}

export function createProductionErpConnector(input: ProductionErpConnectorConfig, dependencies: ProductionErpConnectorDependencies = { fetch, now: Date.now }): IndustrialConnector {
  const config = validateProductionErpConnectorConfig(input); const paths = config.profilePaths!;
  const capabilities = [...new Set((Object.keys(paths) as ProductionErpProfileName[]).map(name => DEFINITIONS[name].capabilityId))]
    .map(id => Object.values(DEFINITIONS).find(definition => definition.capabilityId === id)!)
    .map(definition => [READ_ORDERS, READ_INVENTORY, READ_MOVEMENTS, READ_PRODUCTION_PLAN, READ_MASTER_BOM].find(c => c.id === definition.capabilityId)!);
  return deepFreeze({ id: CONNECTOR_ID, vendor: "PRODUCTION_REST_ERP",
    identity: { connectorId: CONNECTOR_ID, identityId: CONNECTOR_IDENTITY_ID, credentialReference: config.credentialReference },
    dataPolicyBinding: { tenantId: config.tenantId, sourceSystem: config.sourceSystem, sourceRegion: config.sourceRegion, transportScheme: "HTTPS" }, capabilities,
    async health() { const started = dependencies.now(); try { const response = await fetchWithTimeout(dependencies, `${config.baseUrl}${config.healthPath}`, { method: "HEAD", redirect: "error" }, config.requestTimeoutMs); return deepFreeze({ ok: response.ok && response.status < 300, connectorIdentityId: CONNECTOR_IDENTITY_ID, checkedAt: new Date(dependencies.now()).toISOString(), latencyMs: Math.max(0, dependencies.now() - started) }); } catch { return deepFreeze({ ok: false, connectorIdentityId: CONNECTOR_IDENTITY_ID, checkedAt: new Date(dependencies.now()).toISOString(), latencyMs: Math.max(0, dependencies.now() - started) }); } },
    async execute(capabilityId: string, payload: Record<string, unknown>, access: ConnectorExecutionAccess) {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(String(payload?.method).toUpperCase())) fail("ERP_WRITE_OPERATION_PROHIBITED");
      assertAdmission(config, access); const name = selectProfile(capabilityId, payload, paths); const definition = DEFINITIONS[name];
      const response = await fetchWithTimeout(dependencies, `${config.baseUrl}${paths[name]}`, { method: "GET", redirect: "error", headers: { Accept: "application/json", Authorization: `Bearer ${access.credential.secret}`, "X-PlannerAgent-Tenant": access.workload.tenantId, "X-PlannerAgent-Data-Access-Context": access.dataPolicyAdmission.context.contextId } }, config.requestTimeoutMs);
      if (response.status >= 300 && response.status < 400) fail("ERP_REDIRECT_PROHIBITED");
      if (!response.ok) fail("ERP_ACQUISITION_FAILED");
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) fail("ERP_CONTENT_TYPE_INVALID");
      const responseLimit = Math.min(config.maxResponseBytes!, definition.maxResponseBytes);
      const declared = Number(response.headers.get("content-length")); if (Number.isFinite(declared) && declared > responseLimit) fail("ERP_RESPONSE_TOO_LARGE");
      const bytes = await readBoundedBody(response, responseLimit);
      let sourceText: string; try { sourceText = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes); } catch { throw new ProductionErpConnectorError("ERP_RESPONSE_SCHEMA_INVALID"); }
      if (/:\s*(?:NaN|[+-]?Infinity)(?:\s*[,}])/i.test(sourceText)) fail("ERP_NON_FINITE_NUMBER");
      let body: unknown; try { body = JSON.parse(sourceText); } catch { fail("ERP_RESPONSE_SCHEMA_INVALID"); }
      if (!body || typeof body !== "object" || Array.isArray(body)) fail("ERP_RESPONSE_SCHEMA_INVALID");
      const object = body as Record<string, unknown>; closed(object, ["schema_version", definition.collection, "source_system"]);
      if (object.schema_version !== PRODUCTION_ERP_PROFILES[name]) fail(typeof object.schema_version === "string" ? "ERP_PROFILE_VERSION_UNSUPPORTED" : "ERP_REQUIRED_FIELD_MISSING");
      if (object.source_system !== undefined && object.source_system !== config.sourceSystem) fail("ERP_SOURCE_IDENTITY_CONTRADICTION");
      if (!Array.isArray(object[definition.collection])) fail("ERP_REQUIRED_FIELD_MISSING");
      const identities = new Set<string>(); const rows = (object[definition.collection] as unknown[]).map(raw => { const row = validateRow(name, raw, config); const id = definition.identity(row); if (identities.has(id)) fail("ERP_DUPLICATE_IDENTITY"); identities.add(id); return deepFreeze({ ...row }); });
      const cognitionRows = rows.map(row => deepFreeze(definition.normalize(row)));
      const acquiredAt = new Date(dependencies.now()).toISOString();
      const governedFacts = await Promise.all(rows.map(row => preserveGovernedOperationsFactV1(name, row, {
        tenantId: config.tenantId, companyId: config.companyId, sourceSystem: config.sourceSystem,
        connectorIdentityId: CONNECTOR_IDENTITY_ID, connectorRevision: access.dataPolicyAdmission.connectorRevision,
        acquisitionReference: access.dataPolicyAdmission.context.contextId,
        authorizationReference: access.dataPolicyAdmission.authorizationReference, acquiredAt,
        capabilityId, sourceRepresentation: PRODUCTION_ERP_PROFILES[name],
      })));
      return deepFreeze({ sourceRepresentation: PRODUCTION_ERP_PROFILES[name], sourceRepresentationVersion: "1", providerProfile: PRODUCTION_ERP_PROFILES[name],
        acquisition: { acquisitionReference: access.dataPolicyAdmission.context.contextId, acquiredAt, tenantId: config.tenantId, companyId: config.companyId, ownerId: config.ownerId, sourceSystem: config.sourceSystem, sourceRegion: config.sourceRegion, connectorIdentityId: CONNECTOR_IDENTITY_ID, connectorRevision: access.dataPolicyAdmission.connectorRevision, authorizationReference: access.dataPolicyAdmission.authorizationReference, capabilityId, transportEvidence: access.dataPolicyAdmission.context.transportEvidence, encryptionEvidence: access.dataPolicyAdmission.context.encryptionEvidence },
        [definition.collection]: rows, governedFacts, cognitionLane: name === "PRODUCTION_ORDERS" ? "movord" : name === "MATERIAL_MOVEMENTS" ? "movmag" : name === "MASTER_BOM" ? "masterBom" : definition.collection, cognitionRows });
    } });
}

export function initializeProductionErpConnector(env: ProductionErpEnv): boolean {
  const common = [env.INDUSTRIAL_ERP_BASE_URL, env.INDUSTRIAL_ERP_TENANT_ID, env.INDUSTRIAL_ERP_COMPANY_ID, env.INDUSTRIAL_ERP_OWNER_ID, env.INDUSTRIAL_ERP_SOURCE_SYSTEM, env.INDUSTRIAL_ERP_SOURCE_REGION, env.INDUSTRIAL_ERP_CREDENTIAL_REFERENCE, env.INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS];
  const pathValues = [env.INDUSTRIAL_ERP_ORDERS_PATH, env.INDUSTRIAL_ERP_INVENTORY_PATH, env.INDUSTRIAL_ERP_MOVEMENTS_PATH, env.INDUSTRIAL_ERP_PRODUCTION_ORDERS_PATH, env.INDUSTRIAL_ERP_MATERIAL_MOVEMENTS_PATH, env.INDUSTRIAL_ERP_MASTER_BOM_PATH];
  if ([...common, ...pathValues].every(value => value === undefined)) return false;
  if (common.some(value => !value) || pathValues.every(value => !value)) throw new ProductionErpConnectorError("ERP_CONFIGURATION_INVALID");
  const profilePaths = Object.fromEntries((["ORDERS", "INVENTORY", "MOVEMENTS", "PRODUCTION_ORDERS", "MATERIAL_MOVEMENTS", "MASTER_BOM"] as const).flatMap((name, index) => pathValues[index] ? [[name, pathValues[index]]] : []));
  const config = validateProductionErpConnectorConfig({ baseUrl: env.INDUSTRIAL_ERP_BASE_URL!, tenantId: env.INDUSTRIAL_ERP_TENANT_ID!, companyId: env.INDUSTRIAL_ERP_COMPANY_ID!, ownerId: env.INDUSTRIAL_ERP_OWNER_ID!, sourceSystem: env.INDUSTRIAL_ERP_SOURCE_SYSTEM!, sourceRegion: env.INDUSTRIAL_ERP_SOURCE_REGION!, credentialReference: env.INDUSTRIAL_ERP_CREDENTIAL_REFERENCE!, requestTimeoutMs: Number(env.INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS), maxResponseBytes: env.INDUSTRIAL_ERP_MAX_RESPONSE_BYTES ? Number(env.INDUSTRIAL_ERP_MAX_RESPONSE_BYTES) : undefined, healthPath: env.INDUSTRIAL_ERP_HEALTH_PATH, profilePaths });
  const fingerprint = JSON.stringify(config); if (initializedConfiguration) { if (initializedConfiguration !== fingerprint) throw new ProductionErpConnectorError("ERP_CONFIGURATION_INVALID"); return true; }
  registerConnector(createProductionErpConnector(config)); initializedConfiguration = fingerprint; return true;
}
