// src/sandbox/routes.snapshot.ts
//
// CORE WORKER — Snapshot Gateway (Canonical v1.2)
// ----------------------------------------------
// - Receives signed snapshot from Edge
// - Verifies HMAC signature
// - Rehydrates a raw request for Core boundary parser
// - Calls orchestrator with a VALID SandboxEvaluateRequestV2
//

import { evaluateSandboxV2 } from "./orchestrator.v2";
import { parseSandboxEvaluateRequestV2 } from "./apiBoundary.v2";

import {
  verifySnapshotV1,
  type SignedSnapshotV1,
} from "../governance/snapshot/snapshot";

// -----------------------------
// Helpers
// -----------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// -----------------------------
// Route
// -----------------------------

export async function coreSnapshotEvaluate(req: Request, env: any): Promise<Response> {
  if (req.method !== "POST") {
    return json({ ok: false, reason: "METHOD_NOT_ALLOWED" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "INVALID_JSON" }, 400);
  }

  const snapshot = body?.snapshot as SignedSnapshotV1 | undefined;
  if (!snapshot) {
    return json({ ok: false, reason: "SNAPSHOT_MISSING" }, 400);
  }

  const secret = env.SNAPSHOT_HMAC_SECRET as string | undefined;
  if (!secret) {
    return json({ ok: false, reason: "SNAPSHOT_HMAC_SECRET_MISSING" }, 500);
  }

  const valid = await verifySnapshotV1(secret, snapshot);
  if (!valid) {
    return json({ ok: false, reason: "INVALID_SNAPSHOT_SIGNATURE" }, 403);
  }

  // ---------------------------------------------
  // Rehydrate raw request for Core boundary parser
  // ---------------------------------------------
  // NOTE: do NOT manually type this as SandboxEvaluateRequestV2.
  // Let parseSandboxEvaluateRequestV2 normalize PLAN/INTENT/DOMAIN.
  const payload = body?.payload ?? {};

  const rawForBoundary = {
    ...payload,

    // canonical core identity
    company_id: snapshot.company_id,
    request_id: snapshot.request_id,
    actor_id: snapshot.actor_id,

    // governance frame from snapshot
    plan: snapshot.plan,
    intent: snapshot.intent,
    domain: snapshot.domain,

    // required by contracts.v2 in many builds
    baseline_snapshot_id:
      typeof payload?.baseline_snapshot_id === "string"
        ? payload.baseline_snapshot_id
        : snapshot.request_id,

    // pass-through fields that may exist
    sponsor_id: payload?.sponsor_id ?? null,

    // budget/governance_flags if Core wants them
    budget: snapshot.budget,
    governance_flags: snapshot.governance_flags,
  };

  // ✅ THIS FIXES YOUR TYPE ERRORS:
  // parseSandboxEvaluateRequestV2 returns a valid SandboxEvaluateRequestV2
  let request;
  try {
    request = parseSandboxEvaluateRequestV2(rawForBoundary);
  } catch (err: any) {
    return json(
      {
        ok: false,
        reason: "INVALID_CORE_REQUEST",
        details: err?.message ?? "boundary parse failed",
      },
      400
    );
  }

  // Execute orchestrator
  const result = await evaluateSandboxV2(request, env);

  return json({
    ok: true,
    snapshot: { v: snapshot.v, request_id: snapshot.request_id },
    result,
  });
}