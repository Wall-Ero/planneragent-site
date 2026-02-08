// src/worker.ts
// ============================================
// EDGE WORKER — Constitutional Gateway v3
// Canonical Snapshot · Source of Truth
// ============================================

import { parseEdgeRequestV2 } from "./sandbox/apiBoundary.v2";
import { evaluateSandboxV2 } from "./sandbox/orchestrator.v2";
import { validateOagAndBuildProof } from "./governance/oag/validateOag";
import { signSnapshotV1, verifySnapshotV1 } from "./governance/snapshot/snapshot";

import { healthRoute } from "./system/health.route";

export interface Env {
  SNAPSHOT_HMAC_SECRET: string;
  ENVIRONMENT?: string;
  VERSION?: string;
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(req.url);

      // ==========================================
      // SYSTEM ROUTES (NO GOVERNANCE REQUIRED)
      // ==========================================
      if (req.method === "GET" && url.pathname === "/system/health") {
        return healthRoute(req, env);
      }

      // ==========================================
      // SANDBOX GATEWAY (POST ONLY)
      // ==========================================
      if (req.method !== "POST") {
        return json({ ok: false, reason: "METHOD_NOT_ALLOWED" }, 405);
      }

      // --------------------------------------
      // 1. Raw client request
      // --------------------------------------
      const raw = await req.json();

      // --------------------------------------
      // 2. Parse EDGE contract
      // --------------------------------------
      const parsed = parseEdgeRequestV2(raw);

      // --------------------------------------
      // 3. Validate authority via OAG
      // --------------------------------------
      const oag = await validateOagAndBuildProof({
        company_id: parsed.company_id,
        actor_id: parsed.actor_id,
        plan: parsed.plan,
        intent: parsed.intent,
        domain: parsed.domain
      });

      if (!oag.ok) {
        return json({ ok: false, reason: oag.reason }, 403);
      }

      // --------------------------------------
      // 4. Build constitutional snapshot
      // --------------------------------------
      const snapshotUnsigned = {
        v: 1 as const,
        company_id: parsed.company_id,
        request_id: parsed.request_id,

        plan: parsed.plan,
        intent: parsed.intent,
        domain: parsed.domain,

        actor_id: parsed.actor_id,
        oag_proof: oag.proof,

        budget: {
          budget_remaining_eur: 0,
          reset_at: new Date().toISOString()
        },

        governance_flags: {
          sovereignty: "paid" as const
        },

        issued_at: new Date().toISOString()
      };

      // --------------------------------------
      // 5. Sign snapshot
      // --------------------------------------
      const snapshot = await signSnapshotV1(
        env.SNAPSHOT_HMAC_SECRET,
        snapshotUnsigned
      );

      // --------------------------------------
      // 6. Verify snapshot integrity
      // --------------------------------------
      const valid = await verifySnapshotV1(
        env.SNAPSHOT_HMAC_SECRET,
        snapshot
      );

      if (!valid) {
        return json(
          { ok: false, reason: "SNAPSHOT_SIGNATURE_INVALID" },
          401
        );
      }

      // --------------------------------------
      // 7. Dispatch to CORE
      // --------------------------------------
      const response = await evaluateSandboxV2({
        ...parsed,
        snapshot
      });

      return json(response);

    } catch (err: any) {
      return json(
        {
          ok: false,
          reason: err?.message ?? "EDGE_FAILURE"
        },
        400
      );
    }
  }
};