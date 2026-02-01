// core/src/worker.ts
// EDGE WORKER — Constitutional Gateway v2
// Source of Truth
//
// Responsibilities:
// - Accept RAW governance requests
// - Validate OAG authority
// - Build + Sign Constitutional Snapshot (V1)
// - Forward to CORE sandbox
// - Return governed response

import { parseSandboxEvaluateRequestV2 } from "./sandbox/apiBoundary.v2";
import { evaluateSandboxV2 } from "./sandbox/orchestrator.v2";
import { validateOagAndBuildProof } from "./governance/oag/validateOag";
import {
  signSnapshotV1,
  verifySnapshotV1,
  type SignedSnapshotV1
} from "./governance/snapshot/snapshot";

export interface Env {
  SNAPSHOT_HMAC_SECRET: string;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ------------------------------------------------------------------
// Worker
// ------------------------------------------------------------------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      if (req.method !== "POST") {
        return json({ ok: false, reason: "METHOD_NOT_ALLOWED" }, 405);
      }

      // ------------------------------------------------------------
      // 1. Parse incoming request
      // ------------------------------------------------------------

      const raw = await req.json();
      const parsed = parseSandboxEvaluateRequestV2(raw);

      // ------------------------------------------------------------
      // 2. Validate OAG authority
      // ------------------------------------------------------------

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

      // ------------------------------------------------------------
      // 3. Build Snapshot (Unsigned)
      // ------------------------------------------------------------

      const snapshotUnsigned: Omit<SignedSnapshotV1, "signature"> = {
        v: 1,

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
          sovereignty: "paid"
        },

        issued_at: new Date().toISOString()
      };

      // ------------------------------------------------------------
      // 4. Sign Snapshot
      // ------------------------------------------------------------

      const snapshot = await signSnapshotV1(
        env.SNAPSHOT_HMAC_SECRET,
        snapshotUnsigned
      );

      // ------------------------------------------------------------
      // 5. Verify Snapshot
      // ------------------------------------------------------------

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

      // ------------------------------------------------------------
      // 6. Dispatch to CORE
      // ------------------------------------------------------------

      const result = await evaluateSandboxV2({
        ...parsed,
        snapshot
      });

      return json(result);
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