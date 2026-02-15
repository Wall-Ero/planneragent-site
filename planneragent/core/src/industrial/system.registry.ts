// core/src/industrial/system.registry.ts
// =====================================================
// Industrial System Registry
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

  // 🔴 REQUIRED FOR P6.2
  execute(
    capability_id: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
};

const connectors: IndustrialConnector[] = [];

// -----------------------------------------------------

export function registerConnector(connector: IndustrialConnector) {
  connectors.push(connector);
}

// -----------------------------------------------------

export function getCapabilityMap(): CapabilityMap {
  const map: CapabilityMap = {};

  for (const c of connectors) {
    for (const cap of c.capabilities) {
      map[cap.id] = cap;
    }
  }

  return map;
}

// -----------------------------------------------------

export async function getSystemRegistry() {
  return {
    connectors: await Promise.all(
      connectors.map(async c => ({
        id: c.id,
        vendor: c.vendor,
        health: await c.health(),
      }))
    ),
    capabilities: getCapabilityMap(),
  };
}

// -----------------------------------------------------
// INTERNAL — runtime only (P6.2)
// -----------------------------------------------------

export function getLiveConnectors(): IndustrialConnector[] {
  return connectors;
}