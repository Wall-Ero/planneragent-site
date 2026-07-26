import { beforeAll, describe, expect, it } from "vitest";
import { executeAdapter } from "../adapter.runtime";
import type { ConnectorAccessServices } from "../connector.access";
import {
  DEFAULT_DATA_POLICY_EVALUATORS,
  type DataAccessContext,
  type DataPolicyEvaluators,
} from "../data.access.policy";
import { READ_ORDERS } from "../capabilities";
import { registerConnector } from "../system.registry";

const CONNECTOR_ID = "wu3-policy";
const IDENTITY_ID = "connector-identity:wu3-policy";
const NOW = Date.parse("2026-07-26T19:00:00.000Z");
const NOW_ISO = new Date(NOW).toISOString();
let executions = 0;
let admittedExecution = false;

function context(
  overrides: Partial<DataAccessContext> = {}
): DataAccessContext {
  const contextId = "data-access:wu3";
  return {
    contextId,
    tenantId: "tenant-001",
    targetTenantId: "tenant-001",
    sourceSystem: "TEST_ERP",
    sourceRegion: "EU",
    targetRegion: "EU",
    runtimeLocality: "TENANT_LOCAL",
    encryptionDomain: "EXECUTION_MEMORY",
    encryptionEvidence: {
      contextId,
      connectorIdentityId: IDENTITY_ID,
      domain: "EXECUTION_MEMORY",
      encryptedInTransit: true,
      encryptedAtRest: true,
    },
    transportEvidence: {
      contextId,
      connectorIdentityId: IDENTITY_ID,
      scheme: "HTTPS",
      secure: true,
    },
    ...overrides,
  };
}

function request(dataAccessContext: DataAccessContext = context()) {
  return {
    capability_id: "read_orders",
    payload: {},
    workload_identity: {
      workloadId: "planner-worker",
      tenantId: "tenant-001",
      authenticationEvidence: "valid",
    },
    data_access_context: dataAccessContext,
  };
}

function access(
  overrides: Partial<ConnectorAccessServices> = {}
): ConnectorAccessServices {
  return {
    async authenticateWorkload(evidence) {
      return {
        workloadId: evidence.workloadId,
        tenantId: evidence.tenantId,
        authenticationId: "authorization:wu3",
      };
    },
    async authorizeConnectorUse(candidate) {
      return candidate.connectorIdentity.identityId === IDENTITY_ID;
    },
    async resolveConnectorCredential(credentialReference) {
      return { credentialReference, secret: "credential-secret-value" };
    },
    ...overrides,
  };
}

function evaluators(
  overrides: Partial<DataPolicyEvaluators>
): DataPolicyEvaluators {
  return { ...DEFAULT_DATA_POLICY_EVALUATORS, ...overrides };
}

async function expectDenied(
  dataAccessContext: DataAccessContext,
  denial: string,
  services = access(),
  policyEvaluators?: DataPolicyEvaluators
) {
  const before = executions;
  const result = await executeAdapter(
    request(dataAccessContext),
    services,
    { now: () => NOW, policyEvaluators }
  );
  expect(result).toMatchObject({ ok: false, denial });
  expect(executions).toBe(before);
  return result;
}

describe("Data Acquisition — Data Policy Integration", () => {
  beforeAll(() => {
    registerConnector({
      id: CONNECTOR_ID,
      vendor: "TEST",
      identity: {
        connectorId: CONNECTOR_ID,
        identityId: IDENTITY_ID,
        credentialReference: "secret://connectors/wu3-policy",
      },
      dataPolicyBinding: {
        tenantId: "tenant-001",
        sourceSystem: "TEST_ERP",
        sourceRegion: "EU",
        transportScheme: "HTTPS",
      },
      capabilities: [READ_ORDERS],
      async health() {
        return {
          ok: true,
          connectorIdentityId: IDENTITY_ID,
          checkedAt: NOW_ISO,
        };
      },
      async execute(_capability, _payload, executionAccess) {
        executions += 1;
        admittedExecution =
          executionAccess.dataPolicyAdmission.decision === "ADMITTED" &&
          Object.isFrozen(executionAccess.dataPolicyAdmission);
        return { acquired: true };
      },
    });
  });

  it("admits one coherent request and executes exactly once", async () => {
    const result = await executeAdapter(
      request(),
      access(),
      { now: () => NOW }
    );
    expect(result).toMatchObject({
      ok: true,
      connector_identity_id: IDENTITY_ID,
    });
    expect(executions).toBe(1);
    expect(admittedExecution).toBe(true);
  });

  it("rejects missing tenant identity", async () => {
    await expectDenied(
      context({ tenantId: "" }),
      "DATA_ACCESS_CONTEXT_INVALID"
    );
  });

  it("rejects malformed tenant identity", async () => {
    await expectDenied(
      context({ tenantId: "tenant invalid" }),
      "DATA_ACCESS_CONTEXT_INVALID"
    );
  });

  it("rejects cross-tenant connector access", async () => {
    await expectDenied(
      context({ targetTenantId: "tenant-002" }),
      "TENANT_BOUNDARY_DENIED"
    );
  });

  it("rejects tenant substitution after admission", async () => {
    const mutable = context() as {
      tenantId: string;
    } & DataAccessContext;
    await expectDenied(
      mutable,
      "DATA_ACCESS_CONTEXT_CONTRADICTORY",
      access({
        async resolveConnectorCredential(credentialReference) {
          mutable.tenantId = "tenant-002";
          return { credentialReference, secret: "secret" };
        },
      })
    );
  });

  it("rejects missing source region", async () => {
    await expectDenied(
      context({ sourceRegion: "" }),
      "DATA_ACCESS_CONTEXT_INVALID"
    );
  });

  it("rejects missing target region", async () => {
    await expectDenied(
      context({ targetRegion: "" }),
      "DATA_ACCESS_CONTEXT_INVALID"
    );
  });

  it("rejects prohibited regional export", async () => {
    const base = context();
    await expectDenied(
      context({
        targetRegion: "US",
        encryptionDomain: "OAG",
        encryptionEvidence: {
          ...base.encryptionEvidence,
          domain: "OAG",
        },
      }),
      "SOVEREIGNTY_POLICY_DENIED"
    );
  });

  it("rejects an incompatible sovereignty result", async () => {
    await expectDenied(
      context({ targetRegion: "US" }),
      "DATA_POLICY_RESULT_INVALID",
      access(),
      evaluators({
        sovereignty(input) {
          return {
            ...DEFAULT_DATA_POLICY_EVALUATORS.sovereignty(input),
            allowed: true,
            crossRegionAllowed: false,
          };
        },
      })
    );
  });

  it("rejects missing encryption domain", async () => {
    await expectDenied(
      context({ encryptionDomain: undefined as never }),
      "DATA_ACCESS_CONTEXT_INVALID"
    );
  });

  it("rejects a denied encryption obligation", async () => {
    await expectDenied(
      context(),
      "ENCRYPTION_POLICY_DENIED",
      access(),
      evaluators({
        encryption(input) {
          return {
            ...DEFAULT_DATA_POLICY_EVALUATORS.encryption(input),
            allowed: false,
          };
        },
      })
    );
  });

  it("rejects encryption downgrade", async () => {
    const base = context();
    await expectDenied(
      context({
        encryptionEvidence: {
          ...base.encryptionEvidence,
          encryptedInTransit: false,
        },
      }),
      "ENCRYPTION_DOWNGRADE"
    );
  });

  it("rejects insecure transport", async () => {
    const base = context();
    await expectDenied(
      context({
        transportEvidence: {
          ...base.transportEvidence,
          secure: false,
        },
      }),
      "TRANSPORT_SECURITY_DENIED"
    );
  });

  it("rejects transport downgrade", async () => {
    const base = context();
    await expectDenied(
      context({
        transportEvidence: {
          ...base.transportEvidence,
          scheme: "HTTP",
        },
      }),
      "TRANSPORT_SECURITY_DENIED"
    );
  });

  it("rejects missing transport evidence", async () => {
    await expectDenied(
      context({ transportEvidence: undefined as never }),
      "TRANSPORT_EVIDENCE_MISSING"
    );
  });

  it("rejects transport identity mismatch", async () => {
    const base = context();
    await expectDenied(
      context({
        transportEvidence: {
          ...base.transportEvidence,
          connectorIdentityId: "connector-identity:substituted",
        },
      }),
      "DATA_ACCESS_CONTEXT_CONTRADICTORY"
    );
  });

  it("rejects a connector bypass attempt without policy context", async () => {
    const before = executions;
    const bypass = request();
    const result = await executeAdapter(
      { ...bypass, data_access_context: undefined as never },
      access(),
      { now: () => NOW }
    );
    expect(result).toMatchObject({
      ok: false,
      denial: "DATA_ACCESS_CONTEXT_INVALID",
    });
    expect(executions).toBe(before);
  });

  it("rejects contradictory tenant policy results", async () => {
    await expectDenied(
      context(),
      "DATA_POLICY_RESULT_INVALID",
      access(),
      evaluators({
        tenant(input) {
          return {
            ...DEFAULT_DATA_POLICY_EVALUATORS.tenant(input),
            allowed: true,
            violation: true,
          };
        },
      })
    );
  });

  it("rejects a missing policy result", async () => {
    await expectDenied(
      context(),
      "DATA_POLICY_RESULT_INVALID",
      access(),
      evaluators({
        tenant() {
          return undefined as never;
        },
      })
    );
  });

  it("contains a policy evaluator exception", async () => {
    const result = await expectDenied(
      context(),
      "DATA_POLICY_EVALUATION_FAILED",
      access(),
      evaluators({
        sovereignty() {
          throw new Error(
            "credential-secret-value internal-policy-config infrastructure-id"
          );
        },
      })
    );
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("credential-secret-value");
    expect(serialized).not.toContain("internal-policy-config");
    expect(serialized).not.toContain("infrastructure-id");
  });

  it("rejects locality mutation between admission and execution", async () => {
    const mutable = context() as {
      targetRegion: string;
    } & DataAccessContext;
    await expectDenied(
      mutable,
      "DATA_ACCESS_CONTEXT_CONTRADICTORY",
      access({
        async resolveConnectorCredential(credentialReference) {
          mutable.targetRegion = "US";
          return { credentialReference, secret: "secret" };
        },
      })
    );
  });
});
