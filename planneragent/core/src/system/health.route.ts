// core/src/system/health.route.ts
// =================================
// PlannerAgent — System Health Route
// Canonical Snapshot · Source of Truth
// =================================

import type { Env } from "../types/env";

export async function healthRoute(
  _req: Request,
  env: Env
): Promise<Response> {
  return new Response(
    JSON.stringify(
      {
        ok: true,
        service: "planneragent-core",
        environment: env.ENVIRONMENT ?? "dev",
        version: env.VERSION ?? "v0",
        timestamp: new Date().toISOString()
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}