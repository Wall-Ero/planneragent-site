// core/src/commercial/routes.srl.ts
// =====================================================
// P7.5 — SRL Readiness Route
// Read-only · Deterministic · Ledger-based
// =====================================================

import type { LedgerEvent } from "../ledger/ledger.event";
import { getCommercialMetrics } from "./revenue.metrics";
import { evaluateSrlReadiness } from "./srl.readiness";

// ⚠️ Temporary stub until ledger persistence is connected
async function loadLedgerEventsForTenant(
  _tenantId: string
): Promise<LedgerEvent[]> {
  return [];
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function srlStatusRoute(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return json({ ok: false, reason: "TENANT_ID_REQUIRED" }, 400);
    }

    // 1️⃣ Load ledger events (array, not string!)
    const events = await loadLedgerEventsForTenant(tenantId);

    // 2️⃣ Compute metrics
    const metrics = getCommercialMetrics(events);

    // 3️⃣ Evaluate readiness
    const readiness = evaluateSrlReadiness(metrics);

    return json({
      ok: true,
      tenant_id: tenantId,
      metrics,
      readiness,
    });

  } catch (err: any) {
    return json(
      { ok: false, reason: err?.message ?? "SRL_ROUTE_FAILURE" },
      500
    );
  }
}