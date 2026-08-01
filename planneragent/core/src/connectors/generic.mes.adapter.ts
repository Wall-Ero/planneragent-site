import {
  PRODUCTION_ERP_PROFILES,
  ProductionErpConnectorError,
  createProductionErpConnector,
  validateProductionErpConnectorConfig,
  type ProductionErpConnectorDependencies,
  type ProductionErpConnectorConfig,
} from "./generic.erp.adapter";
import type { ConnectorExecutionAccess } from "../industrial/connector.access";
import { registerConnector, type IndustrialConnector } from "../industrial/system.registry";

export const MES_PROFILE = "GENERIC_READ_ONLY_MES_V1" as const;
export const MES_PROFILE_VERSION = "1" as const;
export const MES_REPRESENTATION_PROFILES = Object.freeze({
  PRODUCTION_ORDERS: PRODUCTION_ERP_PROFILES.PRODUCTION_ORDERS,
  MATERIAL_MOVEMENTS: PRODUCTION_ERP_PROFILES.MATERIAL_MOVEMENTS,
  INVENTORY: PRODUCTION_ERP_PROFILES.INVENTORY,
} as const);
export type MesLaneName = keyof typeof MES_REPRESENTATION_PROFILES;
export type MesConnectorConfig = Readonly<{
  profile: typeof MES_PROFILE; profileVersion: typeof MES_PROFILE_VERSION;
  baseUrl: string; healthPath?: string; tenantId: string; companyId: string; ownerId: string;
  sourceSystem: string; sourceRegion: string; credentialReference: string;
  authenticationProfile: "BEARER_TOKEN_V1"; requestTimeoutMs: number; maxResponseBytes?: number;
  profilePaths: Readonly<Partial<Record<MesLaneName, string>>>;
}>;
export type MesConnectorEnv = Readonly<Record<string, string | undefined>>;
export type MesFailure =
  | "MES_CONFIGURATION_INVALID" | "MES_PROFILE_UNSUPPORTED" | "MES_PROFILE_VERSION_UNSUPPORTED"
  | "MES_CAPABILITY_NOT_CONFIGURED" | "MES_ENDPOINT_INVALID" | "MES_AUTHENTICATION_PROFILE_INVALID"
  | "MES_PROVIDER_TIMEOUT" | "MES_RESPONSE_TOO_LARGE" | "MES_CONTENT_TYPE_INVALID"
  | "MES_SCHEMA_INVALID" | "MES_REQUIRED_FIELD_MISSING" | "MES_UNKNOWN_FIELD"
  | "MES_VALUE_TYPE_INVALID" | "MES_NUMERIC_FORMAT_INVALID" | "MES_DATE_FORMAT_INVALID"
  | "MES_DUPLICATE_IDENTITY" | "MES_SOURCE_CONTRADICTION" | "MES_CAPABILITY_PAYLOAD_MISMATCH"
  | "MES_WRITE_OPERATION_PROHIBITED" | "MES_REDIRECT_PROHIBITED" | "MES_ACQUISITION_FAILED";

const CONNECTOR_ID = "mes-production-rest";
const IDENTITY_ID = "connector-identity:mes-production-rest";
const GENERIC_IDENTITY_ID = "connector-identity:erp-production-rest";
const LANES = Object.keys(MES_REPRESENTATION_PROFILES) as MesLaneName[];
let initializedConfiguration: string | undefined;

export class MesConnectorError extends Error {
  constructor(readonly code: MesFailure) {
    super(code === "MES_CONFIGURATION_INVALID" ? "Invalid MES connector configuration" : "MES connector request failed");
    this.name = "MesConnectorError";
  }
}
const fail = (code: MesFailure): never => { throw new MesConnectorError(code); };
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function mapGeneric(error: unknown): never {
  if (!(error instanceof ProductionErpConnectorError)) throw error;
  const codes: Partial<Record<string, MesFailure>> = {
    ERP_CONFIGURATION_INVALID: "MES_CONFIGURATION_INVALID", ERP_CAPABILITY_NOT_CONFIGURED: "MES_CAPABILITY_NOT_CONFIGURED",
    ERP_PROFILE_UNSUPPORTED: "MES_PROFILE_UNSUPPORTED", ERP_PROFILE_VERSION_UNSUPPORTED: "MES_PROFILE_VERSION_UNSUPPORTED",
    ERP_ENDPOINT_PATH_INVALID: "MES_ENDPOINT_INVALID", ERP_AUTHENTICATION_PROFILE_INVALID: "MES_AUTHENTICATION_PROFILE_INVALID",
    ERP_WRITE_OPERATION_PROHIBITED: "MES_WRITE_OPERATION_PROHIBITED", ERP_REDIRECT_PROHIBITED: "MES_REDIRECT_PROHIBITED",
    ERP_PROVIDER_TIMEOUT: "MES_PROVIDER_TIMEOUT", ERP_RESPONSE_TOO_LARGE: "MES_RESPONSE_TOO_LARGE",
    ERP_CONTENT_TYPE_INVALID: "MES_CONTENT_TYPE_INVALID", ERP_RESPONSE_SCHEMA_INVALID: "MES_SCHEMA_INVALID",
    ERP_REQUIRED_FIELD_MISSING: "MES_REQUIRED_FIELD_MISSING", ERP_UNKNOWN_FIELD: "MES_UNKNOWN_FIELD",
    ERP_VALUE_TYPE_INVALID: "MES_VALUE_TYPE_INVALID", ERP_NUMERIC_COERCION_PROHIBITED: "MES_NUMERIC_FORMAT_INVALID",
    ERP_NON_FINITE_NUMBER: "MES_NUMERIC_FORMAT_INVALID", ERP_DATE_AMBIGUOUS: "MES_DATE_FORMAT_INVALID",
    ERP_DUPLICATE_IDENTITY: "MES_DUPLICATE_IDENTITY", ERP_SOURCE_IDENTITY_CONTRADICTION: "MES_SOURCE_CONTRADICTION",
    ERP_CAPABILITY_PAYLOAD_MISMATCH: "MES_CAPABILITY_PAYLOAD_MISMATCH", ERP_ACQUISITION_FAILED: "MES_ACQUISITION_FAILED",
  };
  return fail(codes[error.code] ?? "MES_ACQUISITION_FAILED");
}

export function validateMesConnectorConfig(input: MesConnectorConfig): MesConnectorConfig {
  if (input.profile !== MES_PROFILE) fail("MES_PROFILE_UNSUPPORTED");
  if (input.profileVersion !== MES_PROFILE_VERSION) fail("MES_PROFILE_VERSION_UNSUPPORTED");
  const paths: Partial<Record<MesLaneName, string>> = {};
  for (const [name, path] of Object.entries(input.profilePaths ?? {})) {
    if (!LANES.includes(name as MesLaneName) || typeof path !== "string") fail("MES_PROFILE_UNSUPPORTED");
    paths[name as MesLaneName] = path;
  }
  if (!Object.keys(paths).length) fail("MES_CONFIGURATION_INVALID");
  try {
    const generic = validateThroughGeneric({ ...input, profilePaths: paths });
    return freeze({ ...input, ...generic, profile: MES_PROFILE, profileVersion: MES_PROFILE_VERSION, profilePaths: generic.profilePaths as Readonly<Partial<Record<MesLaneName, string>>> }) as MesConnectorConfig;
  } catch (error) { return mapGeneric(error); }
}
function validateThroughGeneric(input: Omit<MesConnectorConfig, "profile" | "profileVersion">): ProductionErpConnectorConfig {
  return validateProductionErpConnectorConfig(input);
}

export function createMesConnector(input: MesConnectorConfig, dependencies: ProductionErpConnectorDependencies = { fetch, now: Date.now }): IndustrialConnector {
  const config = validateMesConnectorConfig(input);
  const generic = createProductionErpConnector(config, dependencies);
  return freeze({
    id: CONNECTOR_ID, vendor: "GENERIC_READ_ONLY_MES",
    identity: { connectorId: CONNECTOR_ID, identityId: IDENTITY_ID, credentialReference: config.credentialReference },
    dataPolicyBinding: generic.dataPolicyBinding, capabilities: generic.capabilities,
    async health() { const value = await generic.health(); return freeze({ ...value, connectorIdentityId: IDENTITY_ID }); },
    async execute(capabilityId: string, payload: Record<string, unknown>, access: ConnectorExecutionAccess) {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(String(payload?.method).toUpperCase())) fail("MES_WRITE_OPERATION_PROHIBITED");
      const admission = access.dataPolicyAdmission;
      const genericAccess = { ...access, dataPolicyAdmission: { ...admission, connectorIdentityId: GENERIC_IDENTITY_ID,
        context: { ...admission.context,
          transportEvidence: { ...admission.context.transportEvidence, connectorIdentityId: GENERIC_IDENTITY_ID },
          encryptionEvidence: { ...admission.context.encryptionEvidence, connectorIdentityId: GENERIC_IDENTITY_ID },
        } } } as ConnectorExecutionAccess;
      try {
        const output = await generic.execute(capabilityId, payload, genericAccess);
        const copy = structuredClone(output) as Record<string, any>;
        copy.acquisition.connectorIdentityId = IDENTITY_ID;
        copy.acquisition.transportEvidence.connectorIdentityId = IDENTITY_ID;
        copy.acquisition.encryptionEvidence.connectorIdentityId = IDENTITY_ID;
        copy.mes = { profile: MES_PROFILE, profileVersion: MES_PROFILE_VERSION };
        return freeze(copy) as Record<string, unknown>;
      } catch (error) { return mapGeneric(error); }
    },
  }) as IndustrialConnector;
}

export function initializeMesConnector(env: MesConnectorEnv): boolean {
  const prefix = "INDUSTRIAL_MES_"; const any = Object.keys(env).some(key => key.startsWith(prefix) && env[key] !== undefined);
  if (!any) return false;
  const required = (name: string): string => { const value = env[`${prefix}${name}`]; if (!value) return fail("MES_CONFIGURATION_INVALID"); return value; };
  const profilePaths: Partial<Record<MesLaneName, string>> = {};
  for (const name of LANES) { const value = env[`${prefix}${name}_PATH`]; if (value) profilePaths[name] = value; }
  const config = validateMesConnectorConfig({ profile: required("PROFILE") as typeof MES_PROFILE, profileVersion: required("PROFILE_VERSION") as typeof MES_PROFILE_VERSION,
    baseUrl: required("BASE_URL"), healthPath: env[`${prefix}HEALTH_PATH`], tenantId: required("TENANT_ID"), companyId: required("COMPANY_ID"),
    ownerId: required("OWNER_ID"), sourceSystem: required("SOURCE_SYSTEM"), sourceRegion: required("SOURCE_REGION"), credentialReference: required("CREDENTIAL_REFERENCE"),
    authenticationProfile: required("AUTHENTICATION_PROFILE") as "BEARER_TOKEN_V1", requestTimeoutMs: Number(required("REQUEST_TIMEOUT_MS")),
    maxResponseBytes: env[`${prefix}MAX_RESPONSE_BYTES`] ? Number(env[`${prefix}MAX_RESPONSE_BYTES`]) : undefined, profilePaths });
  const fingerprint = JSON.stringify(config);
  if (initializedConfiguration) { if (initializedConfiguration !== fingerprint) fail("MES_CONFIGURATION_INVALID"); return true; }
  registerConnector(createMesConnector(config)); initializedConfiguration = fingerprint; return true;
}
