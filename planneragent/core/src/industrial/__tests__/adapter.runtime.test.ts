import { beforeAll, describe, expect, it } from "vitest";
import { executeAdapter } from "../adapter.runtime";
import type { ConnectorAccessServices } from "../connector.access";
import { getSystemRegistry } from "../system.registry";

import "../../connectors/mail.smtp.adapter";

const accessServices: ConnectorAccessServices = {
  async authenticateWorkload(evidence) {
    return evidence.authenticationEvidence === "valid"
      ? {
          workloadId: evidence.workloadId,
          tenantId: evidence.tenantId,
          authenticationId: "auth-001",
        }
      : null;
  },
  async authorizeConnectorUse(request) {
    return request.connectorIdentity.identityId ===
      "connector-identity:mail-smtp";
  },
  async resolveConnectorCredential(credentialReference) {
    return { credentialReference, secret: "test-secret" };
  },
};

const workloadIdentity = {
  workloadId: "planner-worker",
  tenantId: "tenant-001",
  authenticationEvidence: "valid",
} as const;

const dataAccessContext = {
  contextId: "data-access:adapter-test",
  tenantId: "tenant-001",
  targetTenantId: "tenant-001",
  sourceSystem: "SMTP",
  sourceRegion: "EU",
  targetRegion: "EU",
  runtimeLocality: "TENANT_LOCAL",
  encryptionDomain: "EXECUTION_MEMORY",
  encryptionEvidence: {
    contextId: "data-access:adapter-test",
    connectorIdentityId: "connector-identity:mail-smtp",
    domain: "EXECUTION_MEMORY",
    encryptedInTransit: true,
    encryptedAtRest: true,
  },
  transportEvidence: {
    contextId: "data-access:adapter-test",
    connectorIdentityId: "connector-identity:mail-smtp",
    scheme: "HTTPS",
    secure: true,
  },
} as const;

describe("P6.2 — Industrial Adapter Runtime", () => {
  beforeAll(async () => {
    const registry = await getSystemRegistry();
    expect(registry.connectors.length).toBeGreaterThan(0);
  });

  it("executes a capability via exactly one connector", async () => {
    const res = await executeAdapter({
      capability_id: "notify_supplier",
      payload: {
        supplier_id: "SUP-001",
        message: "Delay confirmed",
      },
      workload_identity: workloadIdentity,
      data_access_context: dataAccessContext,
    }, accessServices);

    expect(res.ok).toBe(true);

    if (!res.ok) return;

    expect(res.capability_id).toBe("notify_supplier");
    expect(typeof res.connector_id).toBe("string");
    expect(res.connector_identity_id).toBe("connector-identity:mail-smtp");
    expect(res.executed_at).toBeDefined();
    expect(res.output).toBeDefined();
  });

  it("fails if capability does not exist", async () => {
    const res = await executeAdapter({
      capability_id: "non_existing_capability",
      payload: {},
      workload_identity: workloadIdentity,
      data_access_context: dataAccessContext,
    }, accessServices);

    expect(res.ok).toBe(false);
  });
});
