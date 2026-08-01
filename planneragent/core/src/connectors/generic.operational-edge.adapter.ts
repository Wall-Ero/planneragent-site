import { READ_EDGE_OBSERVATIONS } from "../industrial/capabilities";
import type { ConnectorExecutionAccess } from "../industrial/connector.access";
import { registerConnector, type IndustrialConnector } from "../industrial/system.registry";

export const OPERATIONAL_EDGE_PROFILE = "GENERIC_READ_ONLY_OPERATIONAL_EDGE_V1" as const;
export const OPERATIONAL_EDGE_PROFILE_VERSION = "1" as const;
export const OPERATIONAL_EDGE_REPRESENTATION = "GENERIC_OPERATIONAL_EDGE_OBSERVATIONS_V1" as const;

export type OperationalEdgeConnectorConfig = Readonly<{
  profile: typeof OPERATIONAL_EDGE_PROFILE;
  profileVersion: typeof OPERATIONAL_EDGE_PROFILE_VERSION;
  baseUrl: string;
  observationsPath: string;
  healthPath?: string;
  tenantId: string;
  companyId: string;
  ownerId: string;
  sourceSystem: string;
  sourceRegion: string;
  credentialReference: string;
  authenticationProfile: "BEARER_TOKEN_V1";
  requestTimeoutMs: number;
  maxResponseBytes?: number;
  maxObservations?: number;
}>;
export type OperationalEdgeConnectorDependencies = Readonly<{ fetch: typeof fetch; now: () => number }>;
export type OperationalEdgeConnectorEnv = Readonly<Record<string, string | undefined>>;
export type OperationalEdgeFailure =
  | "EDGE_CONFIGURATION_INVALID" | "EDGE_PROFILE_UNSUPPORTED" | "EDGE_PROFILE_VERSION_UNSUPPORTED"
  | "EDGE_ENDPOINT_INVALID" | "EDGE_AUTHENTICATION_PROFILE_INVALID" | "EDGE_WRITE_OPERATION_PROHIBITED"
  | "EDGE_CAPABILITY_PAYLOAD_MISMATCH" | "EDGE_PROVIDER_TIMEOUT" | "EDGE_PROVIDER_UNREACHABLE"
  | "EDGE_REDIRECT_PROHIBITED" | "EDGE_RESPONSE_TOO_LARGE" | "EDGE_CONTENT_TYPE_INVALID"
  | "EDGE_SCHEMA_INVALID" | "EDGE_REQUIRED_FIELD_MISSING" | "EDGE_UNKNOWN_FIELD"
  | "EDGE_VALUE_TYPE_INVALID" | "EDGE_DATE_FORMAT_INVALID" | "EDGE_DUPLICATE_OBSERVATION"
  | "EDGE_SOURCE_CONTRADICTION" | "EDGE_OBSERVATION_LIMIT_EXCEEDED" | "EDGE_ACQUISITION_FAILED";

const CONNECTOR_ID = "operational-edge-production-rest";
const IDENTITY_ID = "connector-identity:operational-edge-production-rest";
const DEFAULT_MAX_RESPONSE_BYTES = 1_000_000;
const DEFAULT_MAX_OBSERVATIONS = 10_000;
const MAX_JSON_DEPTH = 16;
const MAX_JSON_NODES = 100_000;
let initializedConfiguration: string | undefined;

export class OperationalEdgeConnectorError extends Error {
  constructor(readonly code: OperationalEdgeFailure) {
    super(code === "EDGE_CONFIGURATION_INVALID" ? "Invalid operational edge connector configuration" : "Operational edge connector request failed");
    this.name = "OperationalEdgeConnectorError";
  }
}
const fail = (code: OperationalEdgeFailure): never => { throw new OperationalEdgeConnectorError(code); };
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function identifier(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(value)) fail("EDGE_CONFIGURATION_INVALID");
  return value;
}
function relativePath(value: string): string {
  if (!/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/.test(value) || value.includes("//") || /[?#]/.test(value) || value.split("/").some(part => part === "." || part === "..")) fail("EDGE_ENDPOINT_INVALID");
  return value.length > 1 ? value.replace(/\/$/, "") : value;
}
export function validateOperationalEdgeConnectorConfig(input: OperationalEdgeConnectorConfig): OperationalEdgeConnectorConfig {
  if (input.profile !== OPERATIONAL_EDGE_PROFILE) fail("EDGE_PROFILE_UNSUPPORTED");
  if (input.profileVersion !== OPERATIONAL_EDGE_PROFILE_VERSION) fail("EDGE_PROFILE_VERSION_UNSUPPORTED");
  if (input.authenticationProfile !== "BEARER_TOKEN_V1" || !/^secret:\/\/[A-Za-z0-9][A-Za-z0-9/._-]{0,255}$/.test(input.credentialReference)) fail("EDGE_AUTHENTICATION_PROFILE_INVALID");
  let base: URL; try { base = new URL(input.baseUrl); } catch { return fail("EDGE_CONFIGURATION_INVALID"); }
  const maxResponseBytes = input.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  const maxObservations = input.maxObservations ?? DEFAULT_MAX_OBSERVATIONS;
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash ||
    !Number.isInteger(input.requestTimeoutMs) || input.requestTimeoutMs < 1 || input.requestTimeoutMs > 30_000 ||
    !Number.isSafeInteger(maxResponseBytes) || maxResponseBytes < 1 || maxResponseBytes > 10_000_000 ||
    !Number.isSafeInteger(maxObservations) || maxObservations < 1 || maxObservations > 100_000 ||
    !/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(input.sourceRegion)) fail("EDGE_CONFIGURATION_INVALID");
  return freeze({ ...input, baseUrl: base.toString().replace(/\/$/, ""), observationsPath: relativePath(input.observationsPath),
    healthPath: relativePath(input.healthPath ?? "/health"), tenantId: identifier(input.tenantId), companyId: identifier(input.companyId),
    ownerId: identifier(input.ownerId), sourceSystem: identifier(input.sourceSystem), maxResponseBytes, maxObservations }) as OperationalEdgeConnectorConfig;
}
async function fetchWithTimeout(dependencies: OperationalEdgeConnectorDependencies, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await dependencies.fetch(url, { ...init, signal: controller.signal }); }
  catch { return fail(controller.signal.aborted ? "EDGE_PROVIDER_TIMEOUT" : "EDGE_PROVIDER_UNREACHABLE"); }
  finally { clearTimeout(timer); }
}
async function readBounded(response: Response, limit: number): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try { for (;;) { const item = await reader.read(); if (item.done) break; length += item.value.length; if (length > limit) { await reader.cancel(); fail("EDGE_RESPONSE_TOO_LARGE"); } chunks.push(item.value.slice()); } }
  catch (error) { if (error instanceof OperationalEdgeConnectorError) throw error; return fail("EDGE_ACQUISITION_FAILED"); }
  const output = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; } return output;
}
function closed(object: Record<string, unknown>, allowed: readonly string[]) { for (const key of Object.keys(object)) if (!allowed.includes(key)) fail("EDGE_UNKNOWN_FIELD"); }
function requiredString(object: Record<string, unknown>, field: string): string {
  if (!(field in object)) fail("EDGE_REQUIRED_FIELD_MISSING");
  if (typeof object[field] !== "string" || object[field] === "") fail("EDGE_VALUE_TYPE_INVALID"); return object[field] as string;
}
function validateTimestamp(value: string) { if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value))) fail("EDGE_DATE_FORMAT_INVALID"); }
function validateJson(value: unknown, state: { nodes: number }, depth = 0): void {
  state.nodes += 1; if (state.nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) fail("EDGE_SCHEMA_INVALID");
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") { if (!Number.isFinite(value)) fail("EDGE_VALUE_TYPE_INVALID"); return; }
  if (Array.isArray(value)) { value.forEach(item => validateJson(item, state, depth + 1)); return; }
  if (typeof value === "object") { Object.values(value as Record<string, unknown>).forEach(item => validateJson(item, state, depth + 1)); return; }
  fail("EDGE_VALUE_TYPE_INVALID");
}
function assertAdmission(config: OperationalEdgeConnectorConfig, access: ConnectorExecutionAccess) {
  const admission = access.dataPolicyAdmission;
  if (admission.decision !== "ADMITTED" || admission.connectorIdentityId !== IDENTITY_ID || admission.capabilityId !== READ_EDGE_OBSERVATIONS.id ||
    admission.credentialReference !== config.credentialReference || access.credential.credentialReference !== config.credentialReference || !access.credential.secret ||
    admission.context.tenantId !== config.tenantId || admission.context.sourceSystem !== config.sourceSystem || admission.context.sourceRegion !== config.sourceRegion ||
    admission.context.transportEvidence.scheme !== "HTTPS" || !admission.context.transportEvidence.secure ||
    !admission.context.encryptionEvidence.encryptedInTransit || !admission.context.encryptionEvidence.encryptedAtRest) fail("EDGE_ACQUISITION_FAILED");
}

export function createOperationalEdgeConnector(input: OperationalEdgeConnectorConfig, dependencies: OperationalEdgeConnectorDependencies = { fetch, now: Date.now }): IndustrialConnector {
  const config = validateOperationalEdgeConnectorConfig(input);
  return freeze({ id: CONNECTOR_ID, vendor: "GENERIC_READ_ONLY_OPERATIONAL_EDGE",
    identity: { connectorId: CONNECTOR_ID, identityId: IDENTITY_ID, credentialReference: config.credentialReference },
    dataPolicyBinding: { tenantId: config.tenantId, sourceSystem: config.sourceSystem, sourceRegion: config.sourceRegion, transportScheme: "HTTPS" },
    capabilities: [READ_EDGE_OBSERVATIONS],
    async health() { const started = dependencies.now(); try { const response = await fetchWithTimeout(dependencies, `${config.baseUrl}${config.healthPath}`, { method: "HEAD", redirect: "error" }, config.requestTimeoutMs); return freeze({ ok: response.ok && response.status < 300, connectorIdentityId: IDENTITY_ID, checkedAt: new Date(dependencies.now()).toISOString(), latencyMs: Math.max(0, dependencies.now() - started) }); } catch { return freeze({ ok: false, connectorIdentityId: IDENTITY_ID, checkedAt: new Date(dependencies.now()).toISOString(), latencyMs: Math.max(0, dependencies.now() - started) }); } },
    async execute(capabilityId: string, payload: Record<string, unknown>, access: ConnectorExecutionAccess) {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(String(payload?.method).toUpperCase())) fail("EDGE_WRITE_OPERATION_PROHIBITED");
      if (capabilityId !== READ_EDGE_OBSERVATIONS.id || Object.keys(payload ?? {}).length !== 0) fail("EDGE_CAPABILITY_PAYLOAD_MISMATCH");
      assertAdmission(config, access);
      const response = await fetchWithTimeout(dependencies, `${config.baseUrl}${config.observationsPath}`, { method: "GET", redirect: "error", headers: { Accept: "application/json", Authorization: `Bearer ${access.credential.secret}`, "X-PlannerAgent-Tenant": access.workload.tenantId, "X-PlannerAgent-Data-Access-Context": access.dataPolicyAdmission.context.contextId } }, config.requestTimeoutMs);
      if (response.status >= 300 && response.status < 400) fail("EDGE_REDIRECT_PROHIBITED");
      if (!response.ok) fail("EDGE_ACQUISITION_FAILED");
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) fail("EDGE_CONTENT_TYPE_INVALID");
      const declared = Number(response.headers.get("content-length")); if (Number.isFinite(declared) && declared > config.maxResponseBytes!) fail("EDGE_RESPONSE_TOO_LARGE");
      const bytes = await readBounded(response, config.maxResponseBytes!);
      let text: string; try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes); } catch { return fail("EDGE_SCHEMA_INVALID"); }
      if (/:\s*(?:NaN|[+-]?Infinity)(?:\s*[,}])/i.test(text)) fail("EDGE_VALUE_TYPE_INVALID");
      let body: unknown; try { body = JSON.parse(text); } catch { return fail("EDGE_SCHEMA_INVALID"); }
      if (!body || typeof body !== "object" || Array.isArray(body)) fail("EDGE_SCHEMA_INVALID");
      const envelope = body as Record<string, unknown>; closed(envelope, ["schema_version", "source_system", "observations"]);
      if (envelope.schema_version !== OPERATIONAL_EDGE_REPRESENTATION) fail(typeof envelope.schema_version === "string" ? "EDGE_PROFILE_VERSION_UNSUPPORTED" : "EDGE_REQUIRED_FIELD_MISSING");
      if (requiredString(envelope, "source_system") !== config.sourceSystem) fail("EDGE_SOURCE_CONTRADICTION");
      if (!Array.isArray(envelope.observations)) fail("EDGE_REQUIRED_FIELD_MISSING");
      const rawObservations = envelope.observations as unknown[];
      if (rawObservations.length > config.maxObservations!) fail("EDGE_OBSERVATION_LIMIT_EXCEEDED");
      const identities = new Set<string>(); const observations = rawObservations.map((raw: unknown) => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("EDGE_SCHEMA_INVALID");
        const observation = raw as Record<string, unknown>; closed(observation, ["observation_id", "source_asset_id", "observed_at", "payload"]);
        const observationId = requiredString(observation, "observation_id"); if (identities.has(observationId)) fail("EDGE_DUPLICATE_OBSERVATION"); identities.add(observationId);
        requiredString(observation, "source_asset_id"); validateTimestamp(requiredString(observation, "observed_at"));
        if (!("payload" in observation) || !observation.payload || typeof observation.payload !== "object" || Array.isArray(observation.payload)) fail("EDGE_VALUE_TYPE_INVALID");
        validateJson(observation.payload, { nodes: 0 }); return freeze(structuredClone(observation));
      });
      return freeze({ sourceRepresentation: OPERATIONAL_EDGE_REPRESENTATION, sourceRepresentationVersion: "1", providerProfile: OPERATIONAL_EDGE_PROFILE,
        acquisition: { acquisitionReference: access.dataPolicyAdmission.context.contextId, acquiredAt: new Date(dependencies.now()).toISOString(), tenantId: config.tenantId,
          companyId: config.companyId, ownerId: config.ownerId, sourceSystem: config.sourceSystem, sourceRegion: config.sourceRegion, connectorIdentityId: IDENTITY_ID,
          connectorRevision: access.dataPolicyAdmission.connectorRevision, authorizationReference: access.dataPolicyAdmission.authorizationReference,
          capabilityId, transportEvidence: access.dataPolicyAdmission.context.transportEvidence, encryptionEvidence: access.dataPolicyAdmission.context.encryptionEvidence },
        observations: freeze(observations) });
    } }) as IndustrialConnector;
}

export function initializeOperationalEdgeConnector(env: OperationalEdgeConnectorEnv): boolean {
  const prefix = "INDUSTRIAL_EDGE_"; const any = Object.keys(env).some(key => key.startsWith(prefix) && env[key] !== undefined); if (!any) return false;
  const required = (name: string): string => { const value = env[`${prefix}${name}`]; if (!value) return fail("EDGE_CONFIGURATION_INVALID"); return value; };
  const config = validateOperationalEdgeConnectorConfig({ profile: required("PROFILE") as typeof OPERATIONAL_EDGE_PROFILE,
    profileVersion: required("PROFILE_VERSION") as typeof OPERATIONAL_EDGE_PROFILE_VERSION, baseUrl: required("BASE_URL"), observationsPath: required("OBSERVATIONS_PATH"),
    healthPath: env[`${prefix}HEALTH_PATH`], tenantId: required("TENANT_ID"), companyId: required("COMPANY_ID"), ownerId: required("OWNER_ID"),
    sourceSystem: required("SOURCE_SYSTEM"), sourceRegion: required("SOURCE_REGION"), credentialReference: required("CREDENTIAL_REFERENCE"),
    authenticationProfile: required("AUTHENTICATION_PROFILE") as "BEARER_TOKEN_V1", requestTimeoutMs: Number(required("REQUEST_TIMEOUT_MS")),
    maxResponseBytes: env[`${prefix}MAX_RESPONSE_BYTES`] ? Number(env[`${prefix}MAX_RESPONSE_BYTES`]) : undefined,
    maxObservations: env[`${prefix}MAX_OBSERVATIONS`] ? Number(env[`${prefix}MAX_OBSERVATIONS`]) : undefined });
  const fingerprint = JSON.stringify(config); if (initializedConfiguration) { if (initializedConfiguration !== fingerprint) fail("EDGE_CONFIGURATION_INVALID"); return true; }
  registerConnector(createOperationalEdgeConnector(config)); initializedConfiguration = fingerprint; return true;
}
