// core/src/industrial/adapter.runtime.ts
// =====================================================
// PlannerAgent — Industrial Adapter Runtime
// Canonical Source of Truth
// =====================================================

import {
  getCapabilityMap,
  getLiveConnectors,
} from "./system.registry";

export type AdapterExecutionInput = {
  capability_id: string;
  payload: Record<string, unknown>;
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
    };

export async function executeAdapter(
  input: AdapterExecutionInput
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
    input.payload
  );

  return {
    ok: true,
    capability_id: input.capability_id,
    connector_id: connector.id,
    output,
    executed_at: new Date().toISOString(),
  };
}