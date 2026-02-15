// core/src/industrial/routes/connectors.route.ts
// =====================================================
// Industrial Fabric Lite — Connectors Health Route
// =====================================================

import { getSystemRegistry } from "../system.registry";

export async function connectorsRoute(): Promise<Response> {
  const registry = await getSystemRegistry();

  return new Response(
    JSON.stringify(
      registry.connectors.map(c => ({
        id: c.id,
        vendor: c.vendor,
        health: c.health,
      })),
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