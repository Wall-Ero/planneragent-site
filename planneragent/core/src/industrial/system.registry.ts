// core/src/industrial/system.registry.ts
// =====================================================
// PlannerAgent — Industrial System Registry
// Canonical Source of Truth
// =====================================================

import type { CapabilityMap, IndustrialCapability } from "./uic.interface";

export type ConnectorHealth = {
  ok: boolean;
  vendor: string;
  latency_ms?: number;
};

export type IndustrialConnector = {
  id: string;
  vendor: string;

  capabilities: IndustrialCapability[];

  health(): Promise<ConnectorHealth>;

  execute(
    capability_id: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
};

const connectors: IndustrialConnector[] = [];

// -----------------------------------------------------
// Connector Registration
// -----------------------------------------------------

export function registerConnector(connector: IndustrialConnector) {
  connectors.push(connector);
}

// -----------------------------------------------------
// Capability Map
// -----------------------------------------------------

export function getCapabilityMap(): CapabilityMap {
  const map: CapabilityMap = {};

  for (const connector of connectors) {
    for (const capability of connector.capabilities) {
      map[capability.id] = capability;
    }
  }

  return map;
}

// -----------------------------------------------------
// System Registry (External View)
// -----------------------------------------------------

export async function getSystemRegistry() {
  return {
    connectors: await Promise.all(
      connectors.map(async c => ({
        id: c.id,
        vendor: c.vendor,
        health: await c.health(),
        capabilities: c.capabilities.map(cap => cap.id),
      }))
    ),
    capabilities: getCapabilityMap(),
  };
}

// -----------------------------------------------------
// INTERNAL RUNTIME ACCESS
// -----------------------------------------------------

export function getLiveConnectors(): IndustrialConnector[] {
  return connectors;
}