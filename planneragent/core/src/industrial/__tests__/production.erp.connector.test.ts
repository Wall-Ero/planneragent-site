import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createProductionErpConnector,
  validateProductionErpConnectorConfig,
} from "../../connectors/generic.erp.adapter";
import { executeAdapter } from "../adapter.runtime";
import type { ConnectorAccessServices } from "../connector.access";
import { registerConnector } from "../system.registry";

const NOW = Date.parse("2026-07-26T20:00:00.000Z");
const CONNECTOR_IDENTITY = "connector-identity:erp-production-rest";
const CREDENTIAL_REFERENCE = "secret://connectors/production-erp";

type Scenario =
  | "SUCCESS"
  | "INVALID_CREDENTIAL"
  | "TRANSPORT_FAILURE"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "MALFORMED";

let scenario: Scenario = "SUCCESS";
let providerCalls = 0;
let acquisitionCalls = 0;
let lastAuthorization: string | null = null;

const providerFetch: typeof fetch = async (input, init) => {
  providerCalls += 1;
  const url = String(input);

  if (url.endsWith("/health")) {
    return new Response(null, { status: 204 });
  }

  acquisitionCalls += 1;
  const headers = new Headers(init?.headers);
  lastAuthorization = headers.get("Authorization");

  if (scenario === "TRANSPORT_FAILURE") {
    throw new TypeError(
      "transport failed credential-secret-value infrastructure-id"
    );
  }
  if (scenario === "TIMEOUT") {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("timed out", "AbortError"))
      );
    });
  }
  if (
    scenario === "INVALID_CREDENTIAL" ||
    lastAuthorization !== "Bearer production-credential"
  ) {
    return new Response(
      JSON.stringify({ error: "credential-secret-value" }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      }
    );
  }
  if (scenario === "UNAVAILABLE") {
    return new Response("provider infrastructure-id unavailable", {
      status: 503,
      headers: { "content-type": "text/plain" },
    });
  }
  if (scenario === "MALFORMED") {
    return new Response(JSON.stringify({ orders: "not-an-array" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      schema_version: "PRODUCTION_REST_ERP_ORDERS_V1",
      orders: [
        {
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
        },
      ],
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
};

function access(
  overrides: Partial<ConnectorAccessServices> = {}
): ConnectorAccessServices {
  return {
    async authenticateWorkload(evidence) {
      return {
        workloadId: evidence.workloadId,
        tenantId: evidence.tenantId,
        authenticationId: "authorization:production-erp",
      };
    },
    async authorizeConnectorUse(request) {
      return request.connectorIdentity.identityId === CONNECTOR_IDENTITY;
    },
    async resolveConnectorCredential(credentialReference) {
      return {
        credentialReference,
        secret:
          scenario === "INVALID_CREDENTIAL"
            ? "invalid-credential"
            : "production-credential",
      };
    },
    ...overrides,
  };
}

function request(targetTenantId = "tenant-001") {
  const contextId = "data-access:production-erp";
  return {
    capability_id: "read_orders",
    payload: {},
    workload_identity: {
      workloadId: "planner-worker",
      tenantId: "tenant-001",
      authenticationEvidence: "valid",
    },
    data_access_context: {
      contextId,
      tenantId: "tenant-001",
      targetTenantId,
      sourceSystem: "PRODUCTION_ERP",
      sourceRegion: "EU",
      targetRegion: "EU",
      runtimeLocality: "TENANT_LOCAL" as const,
      encryptionDomain: "EXECUTION_MEMORY" as const,
      encryptionEvidence: {
        contextId,
        connectorIdentityId: CONNECTOR_IDENTITY,
        domain: "EXECUTION_MEMORY" as const,
        encryptedInTransit: true,
        encryptedAtRest: true,
      },
      transportEvidence: {
        contextId,
        connectorIdentityId: CONNECTOR_IDENTITY,
        scheme: "HTTPS",
        secure: true,
      },
    },
  };
}

describe.sequential(
  "Data Acquisition — First Production ERP Connector",
  () => {
    beforeAll(() => {
      registerConnector(createProductionErpConnector(
        {
          baseUrl: "https://erp.production.example/api/v1",
          tenantId: "tenant-001",
          companyId: "company-001",
          ownerId: "procurement-owner-001",
          sourceSystem: "PRODUCTION_ERP",
          sourceRegion: "EU",
          credentialReference: CREDENTIAL_REFERENCE,
          requestTimeoutMs: 10,
        },
        { fetch: providerFetch, now: () => NOW }
      ));
    });

    beforeEach(() => {
      scenario = "SUCCESS";
      providerCalls = 0;
      acquisitionCalls = 0;
      lastAuthorization = null;
    });

    it("performs one authenticated acquisition and validates the response", async () => {
      const result = await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      );

      expect(result).toMatchObject({
        ok: true,
        connector_identity_id: CONNECTOR_IDENTITY,
        output: {
          sourceRepresentation: "PRODUCTION_REST_ERP_ORDERS_V1",
          orders: [
            {
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
            },
          ],
        },
      });
      expect(acquisitionCalls).toBe(1);
      expect(lastAuthorization).toBe("Bearer production-credential");
      expect(Object.isFrozen(
        (result.ok ? (result.output as any).orders[0] : undefined)
      )).toBe(true);
      const preserved = result.ok ? (result.output as any).governedFacts[0] : undefined;
      expect(preserved).toMatchObject({ fact_family: "ORDERS", semantic: {
        family: "ORDERS", order_id: "ERP-1001", order_version: "7", sku: "MATERIAL-001",
        quantity: { value: 12, source_unit: "EA", canonical_unit: "EACH" },
        observed_at: "2026-07-26T19:55:00.000Z", effective_at: "2026-07-26T19:00:00.000Z",
        due_at: "2026-08-01T00:00:00.000Z",
      }, role_bindings: { subject: { subject_kind: "ORDER" }, plan_element: { role: "PLAN_ELEMENT" },
        temporal: { temporal_role: "REQUIREMENT_DEADLINE" } } });
    });

    it("fails closed for invalid credentials", async () => {
      scenario = "INVALID_CREDENTIAL";
      const result = await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      );
      expect(result).toMatchObject({
        ok: false,
        denial: "CONNECTOR_EXECUTION_FAILED",
      });
    });

    it("denies authorization before any provider call", async () => {
      const result = await executeAdapter(
        request(),
        access({ async authorizeConnectorUse() { return false; } }),
        { now: () => NOW }
      );
      expect(result).toMatchObject({
        ok: false,
        denial: "CONNECTOR_AUTHORIZATION_DENIED",
      });
      expect(providerCalls).toBe(0);
    });

    it("contains a transport failure", async () => {
      scenario = "TRANSPORT_FAILURE";
      expect(await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      )).toMatchObject({
        ok: false,
        denial: "CONNECTOR_EXECUTION_FAILED",
      });
    });

    it("contains a provider timeout", async () => {
      scenario = "TIMEOUT";
      expect(await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      )).toMatchObject({
        ok: false,
        denial: "CONNECTOR_EXECUTION_FAILED",
      });
    });

    it("contains provider unavailability", async () => {
      scenario = "UNAVAILABLE";
      expect(await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      )).toMatchObject({
        ok: false,
        denial: "CONNECTOR_EXECUTION_FAILED",
      });
    });

    it("rejects malformed provider responses", async () => {
      scenario = "MALFORMED";
      expect(await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      )).toMatchObject({
        ok: false,
        denial: "CONNECTOR_EXECUTION_FAILED",
      });
    });

    it("enforces policy denial before provider execution", async () => {
      const result = await executeAdapter(
        request("tenant-002"),
        access(),
        { now: () => NOW }
      );
      expect(result).toMatchObject({
        ok: false,
        denial: "TENANT_BOUNDARY_DENIED",
      });
      expect(providerCalls).toBe(0);
    });

    it("translates repeated provider failures deterministically", async () => {
      scenario = "UNAVAILABLE";
      const first = await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      );
      const second = await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      );
      if (!("denial" in first) || !("denial" in second)) {
        throw new Error("Expected deterministic denied provider results");
      }

      expect({
        ok: first.ok,
        denial: first.denial,
        reason: first.reason,
      }).toEqual({
        ok: second.ok,
        denial: second.denial,
        reason: second.reason,
      });
    });

    it("does not leak credentials, secrets, or provider response bodies", async () => {
      scenario = "INVALID_CREDENTIAL";
      const serialized = JSON.stringify(await executeAdapter(
        request(),
        access(),
        { now: () => NOW }
      ));

      expect(serialized).not.toContain("invalid-credential");
      expect(serialized).not.toContain("credential-secret-value");
      expect(serialized).not.toContain(CREDENTIAL_REFERENCE);
      expect(serialized).not.toContain("infrastructure-id");
    });

    it("rejects insecure provider configuration", () => {
      expect(() => validateProductionErpConnectorConfig({
        baseUrl: "http://erp.production.example",
        tenantId: "tenant-001",
        companyId: "company-001",
        ownerId: "procurement-owner-001",
        sourceSystem: "PRODUCTION_ERP",
        sourceRegion: "EU",
        credentialReference: CREDENTIAL_REFERENCE,
        requestTimeoutMs: 10,
      })).toThrow("Invalid production ERP connector configuration");
    });
  }
);
