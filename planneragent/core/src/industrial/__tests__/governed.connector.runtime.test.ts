import { beforeAll, describe, expect, it } from "vitest";
import {
  getInvocationCandidates,
  getSystemRegistry,
  registerConnector,
  transitionConnectorLifecycle,
  type ConnectorHealth,
  type IndustrialConnector,
} from "../system.registry";
import { executeAdapter } from "../adapter.runtime";
import type { ConnectorAccessServices } from "../connector.access";
import {
  NOTIFY_SUPPLIER,
  READ_INVENTORY,
  READ_MOVEMENTS,
  READ_ORDERS,
  READ_PRODUCTION_PLAN,
  READ_SUPPLY_PLAN,
  UPDATE_ORDER,
} from "../capabilities";
import type { IndustrialCapability } from "../uic.interface";

const NOW = Date.parse("2026-07-26T18:00:00.000Z");
const NOW_ISO = new Date(NOW).toISOString();

function connector(
  suffix: string,
  capability: IndustrialCapability,
  overrides: Partial<IndustrialConnector> = {}
): IndustrialConnector {
  const connectorId = `wu2-${suffix}`;
  const identityId = `connector-identity:${connectorId}`;
  return {
    id: connectorId,
    vendor: "TEST",
    identity: {
      connectorId,
      identityId,
      credentialReference: `secret://connectors/${connectorId}`,
    },
    dataPolicyBinding: {
      tenantId: "tenant-001",
      sourceSystem: "TEST_SYSTEM",
      sourceRegion: "EU",
      transportScheme: "HTTPS",
    },
    capabilities: [capability],
    async health(): Promise<ConnectorHealth> {
      return { ok: true, connectorIdentityId: identityId, checkedAt: NOW_ISO };
    },
    async execute() {
      return { accepted: true };
    },
    ...overrides,
  };
}

function access(
  authorizedIdentityIds: readonly string[]
): ConnectorAccessServices {
  return {
    async authenticateWorkload(evidence) {
      return {
        workloadId: evidence.workloadId,
        tenantId: evidence.tenantId,
        authenticationId: "authentication:wu2",
      };
    },
    async authorizeConnectorUse(request) {
      return authorizedIdentityIds.includes(
        request.connectorIdentity.identityId
      );
    },
    async resolveConnectorCredential(credentialReference) {
      return { credentialReference, secret: "credential-secret-value" };
    },
  };
}

function request(
  capabilityId: string,
  connectorIdentityId: string = ids.primary
) {
  const contextId = `data-access:${capabilityId}`;
  return {
    capability_id: capabilityId,
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
      sourceSystem: "TEST_SYSTEM",
      sourceRegion: "EU",
      targetRegion: "EU",
      runtimeLocality: "TENANT_LOCAL" as const,
      encryptionDomain: "EXECUTION_MEMORY" as const,
      encryptionEvidence: {
        contextId,
        connectorIdentityId,
        domain: "EXECUTION_MEMORY" as const,
        encryptedInTransit: true,
        encryptedAtRest: true,
      },
      transportEvidence: {
        contextId,
        connectorIdentityId,
        scheme: "HTTPS",
        secure: true,
      },
    },
  };
}

const ids = {
  primary: "connector-identity:wu2-primary",
  ambiguousA: "connector-identity:wu2-ambiguous-a",
  ambiguousB: "connector-identity:wu2-ambiguous-b",
  disabled: "connector-identity:wu2-disabled",
  retired: "connector-identity:wu2-retired",
  unhealthy: "connector-identity:wu2-unhealthy",
  malformed: "connector-identity:wu2-malformed",
  healthException: "connector-identity:wu2-health-exception",
  executionException: "connector-identity:wu2-execution-exception",
  executionTimeout: "connector-identity:wu2-execution-timeout",
  substitution: "connector-identity:wu2-substitution",
} as const;

describe("Data Acquisition — Governed Connector Runtime", () => {
  beforeAll(() => {
    registerConnector(connector("primary", READ_ORDERS));
    registerConnector(connector("ambiguous-a", READ_INVENTORY));
    registerConnector(connector("ambiguous-b", READ_INVENTORY));

    registerConnector(connector("disabled", READ_MOVEMENTS));
    transitionConnectorLifecycle(ids.disabled, "DISABLED");

    registerConnector(connector("retired", READ_PRODUCTION_PLAN));
    transitionConnectorLifecycle(ids.retired, "RETIRED");

    registerConnector(connector("unhealthy", READ_SUPPLY_PLAN, {
      async health() {
        return {
          ok: false,
          connectorIdentityId: ids.unhealthy,
          checkedAt: NOW_ISO,
        };
      },
    }));
    registerConnector(connector("malformed", UPDATE_ORDER, {
      async health() {
        return {
          ok: true,
          connectorIdentityId: "substituted-identity",
          checkedAt: NOW_ISO,
        };
      },
    }));
    registerConnector(connector("health-exception", NOTIFY_SUPPLIER, {
      async health() {
        throw new Error("health provider failure");
      },
    }));
    registerConnector(connector("execution-exception", READ_ORDERS, {
      async execute() {
        throw new Error("credential-secret-value must remain internal");
      },
    }));
    registerConnector(connector("execution-timeout", READ_ORDERS, {
      async execute() {
        return new Promise<Record<string, unknown>>(() => undefined);
      },
    }));
    registerConnector(connector("substitution", READ_ORDERS, {
      async health() {
        transitionConnectorLifecycle(ids.substitution, "DISABLED");
        return {
          ok: true,
          connectorIdentityId: ids.substitution,
          checkedAt: NOW_ISO,
        };
      },
    }));
  });

  it("returns an immutable registration result", () => {
    const result = registerConnector(connector("immutable", READ_ORDERS));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.capabilityIds)).toBe(true);
  });

  it("rejects duplicate connector identity", () => {
    expect(() => registerConnector({
      ...connector("duplicate-id", READ_ORDERS),
      identity: {
        connectorId: "wu2-duplicate-id",
        identityId: ids.primary,
        credentialReference: "secret://connectors/duplicate-id",
      },
    })).toThrow("Duplicate connector identity");
  });

  it("rejects conflicting connector registration", () => {
    expect(() => registerConnector({
      ...connector("conflict", READ_ORDERS),
      id: "wu2-primary",
      identity: {
        connectorId: "wu2-primary",
        identityId: "connector-identity:wu2-conflict",
        credentialReference: "secret://connectors/conflict",
      },
    })).toThrow("Conflicting connector registration");
  });

  it("rejects invalid capability declarations", () => {
    expect(() => registerConnector(connector("invalid-capability", {
      ...READ_ORDERS,
      verb: "write",
    }))).toThrow("Invalid capability declaration");
  });

  it("does not expose mutable registry state", async () => {
    const registry = await getSystemRegistry();
    const candidates = getInvocationCandidates("read_orders");
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.connectors)).toBe(true);
    expect(Object.isFrozen(candidates)).toBe(true);
    expect(() => (registry.connectors as unknown[]).pop()).toThrow();
  });

  it("rejects when no connector is eligible", async () => {
    expect(await executeAdapter(
      request("read_production_plan"),
      access([ids.retired]),
      { now: () => NOW }
    )).toMatchObject({ ok: false, denial: "NO_ELIGIBLE_CONNECTOR" });
  });

  it("rejects ambiguous authorized connectors", async () => {
    expect(await executeAdapter(
      request("read_inventory"),
      access([ids.ambiguousA, ids.ambiguousB]),
      { now: () => NOW }
    )).toMatchObject({
      ok: false,
      denial: "AMBIGUOUS_ELIGIBLE_CONNECTORS",
    });
  });

  it("rejects a disabled connector", async () => {
    expect(await executeAdapter(
      request("read_movements"),
      access([ids.disabled]),
      { now: () => NOW }
    )).toMatchObject({ ok: false, denial: "NO_ELIGIBLE_CONNECTOR" });
  });

  it("rejects a retired connector and forbids its reactivation", async () => {
    expect(() =>
      transitionConnectorLifecycle(ids.retired, "ENABLED")
    ).toThrow("is retired");
    expect(await executeAdapter(
      request("read_production_plan"),
      access([ids.retired]),
      { now: () => NOW }
    )).toMatchObject({ ok: false, denial: "NO_ELIGIBLE_CONNECTOR" });
  });

  it("rejects an unhealthy connector", async () => {
    expect(await executeAdapter(
      request("read_supply_plan", ids.unhealthy),
      access([ids.unhealthy]),
      { now: () => NOW }
    )).toMatchObject({ ok: false, denial: "CONNECTOR_HEALTH_FAILED" });
  });

  it("rejects a malformed health identity", async () => {
    expect(await executeAdapter(
      request("update_order", ids.malformed),
      access([ids.malformed]),
      { now: () => NOW }
    )).toMatchObject({ ok: false, denial: "CONNECTOR_HEALTH_INVALID" });
  });

  it("contains a health exception", async () => {
    expect(await executeAdapter(
      request("notify_supplier", ids.healthException),
      access([ids.healthException]),
      { now: () => NOW }
    )).toMatchObject({ ok: false, denial: "CONNECTOR_HEALTH_FAILED" });
  });

  it("contains and sanitizes an execution exception", async () => {
    const result = await executeAdapter(
      request("read_orders", ids.executionException),
      access([ids.executionException]),
      { now: () => NOW }
    );
    expect(result).toMatchObject({
      ok: false,
      denial: "CONNECTOR_EXECUTION_FAILED",
    });
    expect(JSON.stringify(result)).not.toContain("credential-secret-value");
  });

  it("rejects an execution timeout", async () => {
    expect(await executeAdapter(
      request("read_orders", ids.executionTimeout),
      access([ids.executionTimeout]),
      { now: () => NOW, executionTimeoutMs: 5 }
    )).toMatchObject({
      ok: false,
      denial: "CONNECTOR_EXECUTION_TIMEOUT",
    });
  });

  it("rejects lifecycle substitution across the invocation", async () => {
    expect(await executeAdapter(
      request("read_orders", ids.substitution),
      access([ids.substitution]),
      { now: () => NOW }
    )).toMatchObject({
      ok: false,
      denial: "CONNECTOR_RUNTIME_INTEGRITY_FAILED",
    });
  });

  it("rejects stale health results", async () => {
    expect(await executeAdapter(
      request("read_orders"),
      access([ids.primary]),
      { now: () => NOW + 31_000, healthMaxAgeMs: 30_000 }
    )).toMatchObject({ ok: false, denial: "CONNECTOR_HEALTH_STALE" });
  });
});
