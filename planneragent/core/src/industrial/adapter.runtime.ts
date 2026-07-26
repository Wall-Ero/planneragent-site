// core/src/industrial/adapter.runtime.ts
// =====================================================
// PlannerAgent — Industrial Adapter Runtime
// Canonical Source of Truth
// =====================================================

import {
  getCapabilityMap,
  getLiveConnectors,
} from "./system.registry";
import type {
  ConnectorAccessDenial,
  ConnectorAccessServices,
  WorkloadIdentityEvidence,
} from "./connector.access";

export type AdapterExecutionInput = {
  capability_id: string;
  payload: Record<string, unknown>;
  workload_identity: WorkloadIdentityEvidence;
};

export type AdapterExecutionResult =
  | {
      ok: true;
      capability_id: string;
      connector_id: string;
      output: unknown;
      executed_at: string;
    }
  | {
      ok: false;
      reason: string;
      denial?: ConnectorAccessDenial;
    };

export async function executeAdapter(
  input: AdapterExecutionInput,
  accessServices?: ConnectorAccessServices
): Promise<AdapterExecutionResult> {

  const capabilityMap = getCapabilityMap();

  // --------------------------------------------------
  // Capability existence
  // --------------------------------------------------

  const capability = capabilityMap[input.capability_id];

  if (!capability) {
    return {
      ok: false,
      reason: `Capability '${input.capability_id}' not registered`,
    };
  }

  // --------------------------------------------------
  // Connector discovery
  // --------------------------------------------------

  const connectors = getLiveConnectors();

  const connector = connectors.find(c =>
    c.capabilities.some(cap => cap.id === input.capability_id)
  );

  if (!connector) {
    return {
      ok: false,
      reason: `No connector supports capability '${input.capability_id}'`,
    };
  }

  if (!accessServices) {
    return {
      ok: false,
      reason: "Connector access services are required",
      denial: "ACCESS_SERVICES_REQUIRED",
    };
  }

  let executionAccess;

  try {
    const workload = await accessServices.authenticateWorkload(
      input.workload_identity
    );

    if (!workload) {
      return {
        ok: false,
        reason: "Workload authentication failed",
        denial: "WORKLOAD_AUTHENTICATION_FAILED",
      };
    }

    const authorized = await accessServices.authorizeConnectorUse({
      workload,
      connectorIdentity: connector.identity,
      capability,
    });

    if (!authorized) {
      return {
        ok: false,
        reason: "Connector use is not authorized",
        denial: "CONNECTOR_AUTHORIZATION_DENIED",
      };
    }

    const credential = await accessServices.resolveConnectorCredential(
      connector.identity.credentialReference
    );

    if (
      !credential ||
      credential.credentialReference !== connector.identity.credentialReference ||
      credential.secret.length === 0
    ) {
      return {
        ok: false,
        reason: "Connector credential is unavailable",
        denial: "CONNECTOR_CREDENTIAL_UNAVAILABLE",
      };
    }

    executionAccess = Object.freeze({
      workload: Object.freeze({ ...workload }),
      credential: Object.freeze({ ...credential }),
    });
  } catch {
    return {
      ok: false,
      reason: "Connector access evaluation failed",
      denial: "CONNECTOR_ACCESS_EVALUATION_FAILED",
    };
  }

  // --------------------------------------------------
  // Health check
  // --------------------------------------------------

  const health = await connector.health();

  if (!health.ok) {
    return {
      ok: false,
      reason: `Connector '${connector.id}' not healthy`,
    };
  }

  // --------------------------------------------------
  // Execute capability
  // --------------------------------------------------

  const output = await connector.execute(
    input.capability_id,
    input.payload,
    executionAccess
  );

  return {
    ok: true,
    capability_id: input.capability_id,
    connector_id: connector.id,
    output,
    executed_at: new Date().toISOString(),
  };
}
