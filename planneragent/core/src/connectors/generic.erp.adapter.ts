import { READ_ORDERS } from "../industrial/capabilities";
import type { ConnectorExecutionAccess } from "../industrial/connector.access";
import {
  registerConnector,
  type IndustrialConnector,
} from "../industrial/system.registry";

export type ProductionErpConnectorConfig = Readonly<{
  baseUrl: string;
  tenantId: string;
  sourceSystem: string;
  sourceRegion: string;
  credentialReference: string;
  requestTimeoutMs: number;
}>;

export type ProductionErpConnectorDependencies = Readonly<{
  fetch: typeof fetch;
  now: () => number;
}>;

type ProductionErpEnv = Readonly<{
  INDUSTRIAL_ERP_BASE_URL?: string;
  INDUSTRIAL_ERP_TENANT_ID?: string;
  INDUSTRIAL_ERP_SOURCE_SYSTEM?: string;
  INDUSTRIAL_ERP_SOURCE_REGION?: string;
  INDUSTRIAL_ERP_CREDENTIAL_REFERENCE?: string;
  INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS?: string;
}>;

const CONNECTOR_ID = "erp-production-rest";
const CONNECTOR_IDENTITY_ID = "connector-identity:erp-production-rest";
const MAX_RESPONSE_BYTES = 1_000_000;
let initializedConfiguration: string | undefined;

class ProductionErpConnectorError extends Error {
  constructor() {
    super("Production ERP connector request failed");
    this.name = "ProductionErpConnectorError";
  }
}

function requireIdentifier(value: string, field: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(value)) {
    throw new Error(`Invalid production ERP ${field}`);
  }
  return value;
}

function requireCredentialReference(value: string): string {
  if (!/^secret:\/\/[A-Za-z0-9][A-Za-z0-9/._-]{0,255}$/.test(value)) {
    throw new Error("Invalid production ERP credential reference");
  }
  return value;
}

function requireRegion(value: string): string {
  if (!/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(value)) {
    throw new Error("Invalid production ERP source region");
  }
  return value;
}

export function validateProductionErpConnectorConfig(
  config: ProductionErpConnectorConfig
): ProductionErpConnectorConfig {
  const url = new URL(config.baseUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !Number.isInteger(config.requestTimeoutMs) ||
    config.requestTimeoutMs < 1 ||
    config.requestTimeoutMs > 30_000
  ) {
    throw new Error("Invalid production ERP connector configuration");
  }

  return Object.freeze({
    baseUrl: url.toString().replace(/\/$/, ""),
    tenantId: requireIdentifier(config.tenantId, "tenant"),
    sourceSystem: requireIdentifier(config.sourceSystem, "source system"),
    sourceRegion: requireRegion(config.sourceRegion),
    credentialReference: requireCredentialReference(
      config.credentialReference
    ),
    requestTimeoutMs: config.requestTimeoutMs,
  });
}

async function fetchWithTimeout(
  dependencies: ProductionErpConnectorDependencies,
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await dependencies.fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch {
    throw new ProductionErpConnectorError();
  } finally {
    clearTimeout(timeout);
  }
}

async function readOrdersResponse(response: Response) {
  if (
    !response.ok ||
    !response.headers.get("content-type")?.toLowerCase().includes(
      "application/json"
    )
  ) {
    throw new ProductionErpConnectorError();
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new ProductionErpConnectorError();
  }

  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) {
    throw new ProductionErpConnectorError();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new ProductionErpConnectorError();
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !Array.isArray((payload as { orders?: unknown }).orders)
  ) {
    throw new ProductionErpConnectorError();
  }

  return Object.freeze({
    orders: Object.freeze([
      ...(payload as { orders: unknown[] }).orders,
    ]),
  });
}

function assertRuntimeAdmission(
  config: ProductionErpConnectorConfig,
  access: ConnectorExecutionAccess
): void {
  const admission = access.dataPolicyAdmission;
  if (
    admission.decision !== "ADMITTED" ||
    admission.connectorIdentityId !== CONNECTOR_IDENTITY_ID ||
    admission.credentialReference !== config.credentialReference ||
    admission.context.tenantId !== config.tenantId ||
    admission.context.sourceSystem !== config.sourceSystem ||
    admission.context.sourceRegion !== config.sourceRegion ||
    admission.context.transportEvidence.scheme !== "HTTPS" ||
    !admission.context.transportEvidence.secure
  ) {
    throw new ProductionErpConnectorError();
  }
}

export function createProductionErpConnector(
  input: ProductionErpConnectorConfig,
  dependencies: ProductionErpConnectorDependencies = {
    fetch,
    now: Date.now,
  }
): IndustrialConnector {
  const config = validateProductionErpConnectorConfig(input);

  return {
    id: CONNECTOR_ID,
    vendor: "PRODUCTION_REST_ERP",
    identity: Object.freeze({
      connectorId: CONNECTOR_ID,
      identityId: CONNECTOR_IDENTITY_ID,
      credentialReference: config.credentialReference,
    }),
    dataPolicyBinding: Object.freeze({
      tenantId: config.tenantId,
      sourceSystem: config.sourceSystem,
      sourceRegion: config.sourceRegion,
      transportScheme: "HTTPS",
    }),
    capabilities: [READ_ORDERS],

    async health() {
      const startedAt = dependencies.now();
      try {
        const response = await fetchWithTimeout(
          dependencies,
          `${config.baseUrl}/health`,
          { method: "HEAD", redirect: "error" },
          config.requestTimeoutMs
        );
        return Object.freeze({
          ok: response.ok,
          connectorIdentityId: CONNECTOR_IDENTITY_ID,
          checkedAt: new Date(dependencies.now()).toISOString(),
          latencyMs: Math.max(0, dependencies.now() - startedAt),
        });
      } catch {
        return Object.freeze({
          ok: false,
          connectorIdentityId: CONNECTOR_IDENTITY_ID,
          checkedAt: new Date(dependencies.now()).toISOString(),
          latencyMs: Math.max(0, dependencies.now() - startedAt),
        });
      }
    },

    async execute(capabilityId, _payload, access) {
      if (capabilityId !== READ_ORDERS.id) {
        throw new ProductionErpConnectorError();
      }
      assertRuntimeAdmission(config, access);

      const response = await fetchWithTimeout(
        dependencies,
        `${config.baseUrl}/orders`,
        {
          method: "GET",
          redirect: "error",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${access.credential.secret}`,
            "X-PlannerAgent-Tenant": access.workload.tenantId,
            "X-PlannerAgent-Data-Access-Context":
              access.dataPolicyAdmission.context.contextId,
          },
        },
        config.requestTimeoutMs
      );
      return readOrdersResponse(response);
    },
  };
}

export function initializeProductionErpConnector(
  env: ProductionErpEnv
): boolean {
  const values = [
    env.INDUSTRIAL_ERP_BASE_URL,
    env.INDUSTRIAL_ERP_TENANT_ID,
    env.INDUSTRIAL_ERP_SOURCE_SYSTEM,
    env.INDUSTRIAL_ERP_SOURCE_REGION,
    env.INDUSTRIAL_ERP_CREDENTIAL_REFERENCE,
    env.INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS,
  ];
  if (values.every(value => value === undefined)) {
    return false;
  }
  if (values.some(value => !value)) {
    throw new Error("Incomplete production ERP connector configuration");
  }

  const config: ProductionErpConnectorConfig = {
    baseUrl: env.INDUSTRIAL_ERP_BASE_URL as string,
    tenantId: env.INDUSTRIAL_ERP_TENANT_ID as string,
    sourceSystem: env.INDUSTRIAL_ERP_SOURCE_SYSTEM as string,
    sourceRegion: env.INDUSTRIAL_ERP_SOURCE_REGION as string,
    credentialReference: env.INDUSTRIAL_ERP_CREDENTIAL_REFERENCE as string,
    requestTimeoutMs: Number(env.INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS),
  };
  const fingerprint = JSON.stringify(config);
  if (initializedConfiguration) {
    if (initializedConfiguration !== fingerprint) {
      throw new Error("Production ERP connector configuration changed");
    }
    return true;
  }

  registerConnector(createProductionErpConnector(config));
  initializedConfiguration = fingerprint;
  return true;
}
