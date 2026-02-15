// core/src/industrial/routes/industrial.registry.route.ts
// =====================================================
// Industrial Fabric Lite — Registry HTTP Route
// Canonical Source of Truth (P6)
// =====================================================

import { getSystemRegistry } from "../system.registry";

export async function industrialRegistryRoute(): Promise<Response> {
  const registry = await getSystemRegistry();

  return new Response(
    JSON.stringify(
      {
        capabilities: registry.capabilities,
        connectors: registry.connectors,
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }
  );
}