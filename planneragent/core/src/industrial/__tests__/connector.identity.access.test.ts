import { describe, expect, it } from "vitest";
import type { ConnectorAccessServices } from "../connector.access";
import { executeAdapter } from "../adapter.runtime";
import { getSystemRegistry, registerConnector } from "../system.registry";

import "../../connectors/erp.sap.adapter";

const identityEvidence = {
  workloadId: "planner-worker",
  tenantId: "tenant-001",
  authenticationEvidence: "valid-proof",
} as const;

function accessServices(
  overrides: Partial<ConnectorAccessServices> = {}
): ConnectorAccessServices {
  return {
    async authenticateWorkload(evidence) {
      return {
        workloadId: evidence.workloadId,
        tenantId: evidence.tenantId,
        authenticationId: "auth-001",
      };
    },
    async authorizeConnectorUse() {
      return true;
    },
    async resolveConnectorCredential(credentialReference) {
      return {
        credentialReference,
        secret: "resolved-only-for-execution",
      };
    },
    ...overrides,
  };
}

function request() {
  return {
    capability_id: "read_orders",
    payload: {},
    workload_identity: identityEvidence,
  };
}

describe("Data Acquisition — Connector Identity & Access", () => {
  it("executes only after authentication, authorization, and secret resolution", async () => {
    const calls: string[] = [];
    const services = accessServices({
      async authenticateWorkload(evidence) {
        calls.push("authenticate");
        return {
          workloadId: evidence.workloadId,
          tenantId: evidence.tenantId,
          authenticationId: "auth-001",
        };
      },
      async authorizeConnectorUse() {
        calls.push("authorize");
        return true;
      },
      async resolveConnectorCredential(credentialReference) {
        calls.push("resolve");
        return { credentialReference, secret: "secret" };
      },
    });

    const result = await executeAdapter(request(), services);

    expect(result.ok).toBe(true);
    expect(calls).toEqual(["authenticate", "authorize", "resolve"]);
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("authenticationEvidence");
  });

  it("fails closed without access services", async () => {
    expect(await executeAdapter(request())).toMatchObject({
      ok: false,
      denial: "ACCESS_SERVICES_REQUIRED",
    });
  });

  it("fails closed when workload authentication fails", async () => {
    expect(await executeAdapter(
      request(),
      accessServices({ async authenticateWorkload() { return null; } })
    )).toMatchObject({
      ok: false,
      denial: "WORKLOAD_AUTHENTICATION_FAILED",
    });
  });

  it("fails closed when connector authorization is denied", async () => {
    expect(await executeAdapter(
      request(),
      accessServices({ async authorizeConnectorUse() { return false; } })
    )).toMatchObject({
      ok: false,
      denial: "CONNECTOR_AUTHORIZATION_DENIED",
    });
  });

  it("fails closed when the connector credential cannot be resolved", async () => {
    expect(await executeAdapter(
      request(),
      accessServices({ async resolveConnectorCredential() { return null; } })
    )).toMatchObject({
      ok: false,
      denial: "CONNECTOR_CREDENTIAL_UNAVAILABLE",
    });
  });

  it("publishes connector identity without credential references", async () => {
    const serialized = JSON.stringify(await getSystemRegistry());

    expect(serialized).toContain("connector-identity:erp-sap");
    expect(serialized).not.toContain("secret://");
  });

  it("rejects an incoherent connector identity at registration", () => {
    expect(() => registerConnector({
      id: "incoherent",
      vendor: "TEST",
      identity: {
        connectorId: "different-id",
        identityId: "connector-identity:incoherent",
        credentialReference: "secret://connectors/incoherent",
      },
      capabilities: [],
      async health() {
        return {
          ok: true,
          connectorIdentityId: "connector-identity:incoherent",
          checkedAt: new Date().toISOString(),
        };
      },
      async execute() {
        return {};
      },
    })).toThrow("incoherent implementation");
  });
});
