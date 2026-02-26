// src/worker.ts
// ============================================
// EDGE WORKER — Constitutional Gateway v4
// Canonical Snapshot · Source of Truth
// ============================================

import { parseEdgeRequestV2 } from "./sandbox/apiBoundary.v2";
import { evaluateSandboxV2 } from "./sandbox/orchestrator.v2";
import { validateOagAndBuildProof } from "./governance/oag/validateOag";
import { signSnapshotV1, verifySnapshotV1 } from "./governance/snapshot/snapshot";

import { healthRoute } from "./system/health.route";

// 🔹 P6 — Industrial Fabric (READ-ONLY)
import { getSystemRegistry } from "./industrial/system.registry";

// 🔹 P7.5 — SRL Notification ONLY (no other usage)
import { sendTwilioNotification } from "./notifications/twilio.hook";

// 🔹 GOVERNANCE SCHEDULER
import { runGovernanceScheduler } from "./scheduler/scheduler.runtime";
import type { GovernanceSchedulerInput } from "./scheduler/scheduler.types";

export interface Env {
  SNAPSHOT_HMAC_SECRET: string;

  // P7 — Twilio (SRL readiness only)
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;

  ENVIRONMENT?: string;
  VERSION?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  // ==================================================
  // HTTP GATEWAY
  // ==================================================
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(req.url);

      // --------------------------------------------------
      // SYSTEM ROUTES — NO GOVERNANCE / NO SNAPSHOT
      // --------------------------------------------------

      if (req.method === "GET" && url.pathname === "/system/health") {
        return healthRoute(req, env);
      }

      if (
        req.method === "GET" &&
        url.pathname === "/system/industrial/registry"
      ) {
        const registry = await getSystemRegistry();
        return json({ ok: true, registry });
      }

      if (req.method === "GET" && url.pathname === "/system/connectors") {
        const registry = await getSystemRegistry();
        return json({ ok: true, connectors: registry.connectors });
      }

      // --------------------------------------------------
      // SANDBOX GATEWAY — POST ONLY
      // --------------------------------------------------

      if (req.method !== "POST") {
        return json({ ok: false, reason: "METHOD_NOT_ALLOWED" }, 405);
      }

      const raw = await req.json();
      const parsed = parseEdgeRequestV2(raw);

      const oag = await validateOagAndBuildProof({
        company_id: parsed.company_id,
        actor_id: parsed.actor_id,
        plan: parsed.plan,
        intent: parsed.intent,
        domain: parsed.domain,
      });

      if (!oag.ok) {
        return json({ ok: false, reason: oag.reason }, 403);
      }

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
          reset_at: new Date().toISOString(),
        },
        governance_flags: {
          sovereignty: "paid" as const,
        },
        issued_at: new Date().toISOString(),
      };

      const snapshot = await signSnapshotV1(
        env.SNAPSHOT_HMAC_SECRET,
        snapshotUnsigned
      );

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

      const response = await evaluateSandboxV2({
        ...parsed,
        snapshot,
      });

      // ❗ Deliberately NO notifications here
      // Governance-triggered notifications happen ONLY in scheduler()

      return json(response);
    } catch (err: any) {
      return json(
        { ok: false, reason: err?.message ?? "EDGE_FAILURE" },
        400
      );
    }
  },

  // ==================================================
  // GOVERNANCE SCHEDULER (CRON)
  // ==================================================
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const input: GovernanceSchedulerInput = {
      now_iso: new Date().toISOString(),

      // 🔴 Canonical SRL Decision Input
      srl_decision_input: {
        // ECONOMIC
        cash_available_eur: 0,

        // MARKET
        active_junior_accounts: 0,
        junior_continuity_months: 0,
        has_real_usage: false,

        // OPERATIONAL
        operational_friction_high: false,

        // RISK
        governs_real_systems: false,
        orchestrates_external_ai: false,
        used_in_decisional_contexts: false,

        // GOVERNANCE INTENT
        founder_wants_institution: false,
      },
    };

    ctx.waitUntil(
      runGovernanceScheduler(input).then(async (res) => {
        if (res.action === "OPEN_SRL_TRIGGERED") {
          // 🔴 The ONLY place Twilio is used
          await sendTwilioNotification(env, {
            to: "+393932170828",
            message:
              "PlannerAgent governance: tutte le condizioni sono soddisfatte. È il momento di aprire la SRL.",
          });
        }
      })
    );
  },
};