import {
  OPERATIONAL_EDGE_PROFILE,
  OPERATIONAL_EDGE_PROFILE_VERSION,
  createOperationalEdgeConnector,
  validateOperationalEdgeConnectorConfig,
  type OperationalEdgeConnectorConfig,
  type OperationalEdgeConnectorDependencies,
} from "./generic.operational-edge.adapter";
import type { ConnectorExecutionAccess } from "../industrial/connector.access";
import { registerConnector, type IndustrialConnector } from "../industrial/system.registry";

export const INDUSTRIAL_SIGNAL_GATEWAY_PROFILE = "INDUSTRIAL_SIGNAL_GATEWAY_V1" as const;
export const INDUSTRIAL_SIGNAL_GATEWAY_PROFILE_VERSION = "1" as const;
export type IndustrialSignalValueType = "BOOLEAN" | "NUMBER" | "STRING" | "STATE";
export type IndustrialSignalQuality = "GOOD" | "UNCERTAIN" | "BAD" | "UNKNOWN";
export type IndustrialSignalGatewayConfig = Readonly<{
  profile: typeof INDUSTRIAL_SIGNAL_GATEWAY_PROFILE;
  profileVersion: typeof INDUSTRIAL_SIGNAL_GATEWAY_PROFILE_VERSION;
  edge: OperationalEdgeConnectorConfig;
}>;
export type IndustrialSignalGatewayEnv = Readonly<Record<string, string | undefined>>;
export type IndustrialSignalGatewayFailure =
  | "SIGNAL_CONFIGURATION_INVALID" | "SIGNAL_PROFILE_UNSUPPORTED" | "SIGNAL_PROFILE_VERSION_UNSUPPORTED"
  | "SIGNAL_SCHEMA_INVALID" | "SIGNAL_REQUIRED_FIELD_MISSING" | "SIGNAL_UNKNOWN_FIELD"
  | "SIGNAL_IDENTIFIER_INVALID" | "SIGNAL_VALUE_TYPE_UNSUPPORTED" | "SIGNAL_VALUE_INVALID"
  | "SIGNAL_STRING_LIMIT_EXCEEDED" | "SIGNAL_UNIT_INVALID" | "SIGNAL_QUALITY_UNSUPPORTED";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;
const UNIT = /^[A-Za-z0-9%/._*^-]{1,32}$/;
const QUALITY = new Set<IndustrialSignalQuality>(["GOOD", "UNCERTAIN", "BAD", "UNKNOWN"]);
const VALUE_TYPES = new Set<IndustrialSignalValueType>(["BOOLEAN", "NUMBER", "STRING", "STATE"]);
let initializedConfiguration: string | undefined;

export class IndustrialSignalGatewayError extends Error {
  constructor(readonly code: IndustrialSignalGatewayFailure) {
    super("Industrial signal gateway profile validation failed"); this.name = "IndustrialSignalGatewayError";
  }
}
const fail = (code: IndustrialSignalGatewayFailure): never => { throw new IndustrialSignalGatewayError(code); };
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function closed(object: Record<string, unknown>, allowed: readonly string[]) {
  for (const key of Object.keys(object)) if (!allowed.includes(key)) fail("SIGNAL_UNKNOWN_FIELD");
}
function requiredString(object: Record<string, unknown>, field: string): string {
  if (!(field in object)) fail("SIGNAL_REQUIRED_FIELD_MISSING");
  if (typeof object[field] !== "string" || object[field] === "") fail("SIGNAL_VALUE_INVALID");
  return object[field] as string;
}
function validatePayload(raw: unknown): void {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("SIGNAL_SCHEMA_INVALID");
  const payload = raw as Record<string, unknown>;
  closed(payload, ["signal_id", "value_type", "value", "unit", "quality"]);
  const signalId = requiredString(payload, "signal_id"); if (!IDENTIFIER.test(signalId)) fail("SIGNAL_IDENTIFIER_INVALID");
  const valueType = requiredString(payload, "value_type") as IndustrialSignalValueType;
  if (!VALUE_TYPES.has(valueType)) fail("SIGNAL_VALUE_TYPE_UNSUPPORTED");
  if (!("value" in payload)) fail("SIGNAL_REQUIRED_FIELD_MISSING");
  const value = payload.value;
  if (valueType === "BOOLEAN" && typeof value !== "boolean") fail("SIGNAL_VALUE_INVALID");
  if (valueType === "NUMBER" && (typeof value !== "number" || !Number.isFinite(value))) fail("SIGNAL_VALUE_INVALID");
  if ((valueType === "STRING" || valueType === "STATE") && (typeof value !== "string" || value.length === 0)) fail("SIGNAL_VALUE_INVALID");
  if (valueType === "STRING" && (value as string).length > 1_024) fail("SIGNAL_STRING_LIMIT_EXCEEDED");
  if (valueType === "STATE" && (value as string).length > 128) fail("SIGNAL_STRING_LIMIT_EXCEEDED");
  if (payload.unit !== undefined && (typeof payload.unit !== "string" || !UNIT.test(payload.unit))) fail("SIGNAL_UNIT_INVALID");
  if (payload.quality !== undefined && (typeof payload.quality !== "string" || !QUALITY.has(payload.quality as IndustrialSignalQuality))) fail("SIGNAL_QUALITY_UNSUPPORTED");
}

export function validateIndustrialSignalGatewayConfig(input: IndustrialSignalGatewayConfig): IndustrialSignalGatewayConfig {
  if (input.profile !== INDUSTRIAL_SIGNAL_GATEWAY_PROFILE) fail("SIGNAL_PROFILE_UNSUPPORTED");
  if (input.profileVersion !== INDUSTRIAL_SIGNAL_GATEWAY_PROFILE_VERSION) fail("SIGNAL_PROFILE_VERSION_UNSUPPORTED");
  const edge = validateOperationalEdgeConnectorConfig(input.edge);
  return freeze({ profile: INDUSTRIAL_SIGNAL_GATEWAY_PROFILE, profileVersion: INDUSTRIAL_SIGNAL_GATEWAY_PROFILE_VERSION, edge }) as IndustrialSignalGatewayConfig;
}

export function createIndustrialSignalGatewayProfile(input: IndustrialSignalGatewayConfig, dependencies: OperationalEdgeConnectorDependencies = { fetch, now: Date.now }): IndustrialConnector {
  const config = validateIndustrialSignalGatewayConfig(input);
  const edge = createOperationalEdgeConnector(config.edge, dependencies);
  return freeze({ id: edge.id, vendor: "INDUSTRIAL_SIGNAL_GATEWAY", identity: edge.identity,
    dataPolicyBinding: edge.dataPolicyBinding, capabilities: edge.capabilities, health: edge.health,
    async execute(capabilityId: string, payload: Record<string, unknown>, access: ConnectorExecutionAccess) {
      const acquired = await edge.execute(capabilityId, payload, access);
      if (!Array.isArray(acquired.observations)) fail("SIGNAL_SCHEMA_INVALID");
      const observations = acquired.observations as unknown[];
      for (const observation of observations) {
        if (!observation || typeof observation !== "object" || Array.isArray(observation)) fail("SIGNAL_SCHEMA_INVALID");
        validatePayload((observation as Record<string, unknown>).payload);
      }
      const copy = structuredClone(acquired) as Record<string, unknown>;
      copy.observationProfile = freeze({ profile: INDUSTRIAL_SIGNAL_GATEWAY_PROFILE, profileVersion: INDUSTRIAL_SIGNAL_GATEWAY_PROFILE_VERSION });
      return freeze(copy) as Record<string, unknown>;
    } }) as IndustrialConnector;
}

export function initializeIndustrialSignalGatewayProfile(env: IndustrialSignalGatewayEnv): boolean {
  const prefix = "INDUSTRIAL_SIGNAL_GATEWAY_";
  const any = Object.keys(env).some(key => key.startsWith(prefix) && env[key] !== undefined); if (!any) return false;
  const required = (name: string): string => { const value = env[`${prefix}${name}`]; if (!value) fail("SIGNAL_CONFIGURATION_INVALID"); return value as string; };
  const edge: OperationalEdgeConnectorConfig = {
    profile: OPERATIONAL_EDGE_PROFILE, profileVersion: OPERATIONAL_EDGE_PROFILE_VERSION,
    baseUrl: required("BASE_URL"), observationsPath: required("OBSERVATIONS_PATH"), ...(env[`${prefix}HEALTH_PATH`] ? { healthPath: env[`${prefix}HEALTH_PATH`]! } : {}),
    tenantId: required("TENANT_ID"), companyId: required("COMPANY_ID"), ownerId: required("OWNER_ID"), sourceSystem: required("SOURCE_SYSTEM"),
    sourceRegion: required("SOURCE_REGION"), credentialReference: required("CREDENTIAL_REFERENCE"), authenticationProfile: required("AUTHENTICATION_PROFILE") as "BEARER_TOKEN_V1",
    requestTimeoutMs: Number(required("REQUEST_TIMEOUT_MS")), maxResponseBytes: env[`${prefix}MAX_RESPONSE_BYTES`] ? Number(env[`${prefix}MAX_RESPONSE_BYTES`]) : undefined,
    maxObservations: env[`${prefix}MAX_OBSERVATIONS`] ? Number(env[`${prefix}MAX_OBSERVATIONS`]) : undefined,
  };
  const config = validateIndustrialSignalGatewayConfig({ profile: required("PROFILE") as typeof INDUSTRIAL_SIGNAL_GATEWAY_PROFILE,
    profileVersion: required("PROFILE_VERSION") as typeof INDUSTRIAL_SIGNAL_GATEWAY_PROFILE_VERSION, edge });
  const fingerprint = JSON.stringify(config); if (initializedConfiguration) { if (initializedConfiguration !== fingerprint) fail("SIGNAL_CONFIGURATION_INVALID"); return true; }
  registerConnector(createIndustrialSignalGatewayProfile(config)); initializedConfiguration = fingerprint; return true;
}
