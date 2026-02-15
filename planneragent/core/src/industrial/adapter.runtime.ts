// core/src/industrial/adapter.runtime.ts
// =====================================================
// Industrial Adapter Runtime — P6.2
// Canonical Source of Truth
// =====================================================

import { getSystemRegistry } from "./system.registry";

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
  const registry = await getSystemRegistry();

  // 1. Capability existence
  const capability = registry.capabilities[input.capability_id];
  if (!capability) {
    return {
      ok: false,
      reason: `Capability '${input.capability_id}' not registered`,
    };
  }

  // 2. Find exactly one connector supporting it
  const liveConnector = registry.connectors.find(c =>
    c.health.ok &&
    registry.capabilities[input.capability_id]
  );

  if (!liveConnector) {
    return {
      ok: false,
      reason: `No healthy connector for capability '${input.capability_id}'`,
    };
  }

  // 3. Execute capability (runtime-owned)
  const output = await executeCapability(
    input.capability_id,
    input.payload
  );

  return {
    ok: true,
    capability_id: input.capability_id,
    connector_id: liveConnector.id,
    output,
    executed_at: new Date().toISOString(),
  };
}

// =====================================================
// Capability execution (single-action, no orchestration)
// =====================================================
async function executeCapability(
  capabilityId: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  switch (capabilityId) {
    case "notify_supplier":
      return {
        notified: true,
        payload,
      };

    default:
      throw new Error(`No runtime handler for ${capabilityId}`);
  }
}