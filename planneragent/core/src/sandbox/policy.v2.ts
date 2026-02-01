// src/sandbox/policy.v2.ts

import type { PlanTier, SandboxRateInfo } from "./contracts.v2";

// -----------------------------
// Public return contract
// -----------------------------
export type RateDecision =
  | {
      ok: true;
      rate: SandboxRateInfo;
      monthly_remaining: number;
      burst_remaining: number;
    }
  | {
      ok: false;
      code: "QUOTA_EXCEEDED" | "RATE_BLOCKED";
      message: string;
      rate: SandboxRateInfo;
      monthly_remaining: number;
      burst_remaining: number;
    };

// -----------------------------
// Environment
// -----------------------------
type Env = {
  DB: D1Database;
  RATE_POLICY_ENABLED?: string;
};

// -----------------------------
// Helpers
// -----------------------------
function nowIso() {
  return new Date().toISOString();
}

function monthResetIsoUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const next = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  return next.toISOString();
}

function defaults(plan: PlanTier) {
  // COPY-LOCK defaults (from spec)
  if (plan === "BASIC") return { monthly: 5, burst: 2 };
  if (plan === "JUNIOR") return { monthly: 15, burst: 5 };
  return { monthly: 30, burst: 10 };
}

// -----------------------------
// Rate Gate (Sandbox v2)
// -----------------------------
export async function rateGateV2(
  env: Env,
  companyId: string,
  plan: PlanTier,
  baselineSnapshotId: string,
  intent: string
): Promise<RateDecision> {
  const resetAt = monthResetIsoUTC();

  // Governance bypass (dev / ops mode)
  if (env.RATE_POLICY_ENABLED === "false") {
    return {
      ok: true,
      rate: {
        status: "OK",
        reset_at: resetAt
      },
      monthly_remaining: Infinity,
      burst_remaining: Infinity
    };
  }

  const key = `${companyId}::${baselineSnapshotId}::${intent
    .trim()
    .slice(0, 200)}`;

  // -----------------------------
  // 1) Debounce gate
  // -----------------------------
  const ttlMs = 90_000;
  const sinceIso = new Date(Date.now() - ttlMs).toISOString();

  const dup = await env.DB.prepare(
    `SELECT 1 FROM sandbox_events_v2
     WHERE company_id = ? AND dedupe_key = ? AND created_at >= ?
     LIMIT 1`
  )
    .bind(companyId, key, sinceIso)
    .first();

  if (dup) {
    return {
      ok: false,
      code: "RATE_BLOCKED",
      message: "Debounce: same baseline+intent recently submitted",
      rate: {
        status: "BLOCKED",
        reset_at: resetAt,
        reason: "DEBOUNCED"
      },
      monthly_remaining: 0,
      burst_remaining: 0
    };
  }

  // -----------------------------
  // 2) Ensure quota row exists
  // -----------------------------
  const { monthly, burst } = defaults(plan);

  await env.DB.prepare(
    `INSERT INTO sandbox_quotas_v2
       (company_id, plan, monthly_quota, monthly_used, burst_remaining, reset_at)
     VALUES (?, ?, ?, 0, ?, ?)
     ON CONFLICT(company_id) DO UPDATE SET
       plan = excluded.plan,
       monthly_quota = excluded.monthly_quota,
       reset_at = excluded.reset_at`
  )
    .bind(companyId, plan, monthly, burst, resetAt)
    .run();

  // -----------------------------
  // 3) Load quota
  // -----------------------------
  const row = await env.DB.prepare(
    `SELECT monthly_quota, monthly_used, burst_remaining, reset_at
     FROM sandbox_quotas_v2
     WHERE company_id = ?
     LIMIT 1`
  )
    .bind(companyId)
    .first<{
      monthly_quota: number;
      monthly_used: number;
      burst_remaining: number;
      reset_at: string;
    }>();

  if (!row) {
    return {
      ok: false,
      code: "RATE_BLOCKED",
      message: "Quota row missing",
      rate: {
        status: "BLOCKED",
        reset_at: resetAt,
        reason: "RATE_LIMITED"
      },
      monthly_remaining: 0,
      burst_remaining: 0
    };
  }

  // -----------------------------
  // 4) Reset window if passed
  // -----------------------------
  const resetPassed = new Date(row.reset_at).getTime() <= Date.now();
  let monthlyUsed = row.monthly_used;
  let burstRemaining = row.burst_remaining;

  if (resetPassed) {
    monthlyUsed = 0;
    burstRemaining = burst;

    await env.DB.prepare(
      `UPDATE sandbox_quotas_v2
       SET monthly_used = 0,
           burst_remaining = ?,
           reset_at = ?
       WHERE company_id = ?`
    )
      .bind(burst, resetAt, companyId)
      .run();
  }

  const monthlyRemaining = Math.max(
    0,
    row.monthly_quota - monthlyUsed
  );

  // -----------------------------
  // 5) Enforce monthly quota
  // -----------------------------
  if (monthlyRemaining <= 0) {
    return {
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Monthly quota exceeded",
      rate: {
        status: "BLOCKED",
        reset_at: row.reset_at,
        reason: "QUOTA_EXCEEDED"
      },
      monthly_remaining: 0,
      burst_remaining: burstRemaining
    };
  }

  // -----------------------------
  // 6) Burst semantics
  // -----------------------------
  let status: "OK" | "BURST" = "OK";

  if (burstRemaining > 0) {
    status = "BURST";
    burstRemaining -= 1;
  }

  // -----------------------------
  // 7) Consume quota
  // -----------------------------
  monthlyUsed += 1;

  await env.DB.prepare(
    `UPDATE sandbox_quotas_v2
     SET monthly_used = ?,
         burst_remaining = ?
     WHERE company_id = ?`
  )
    .bind(monthlyUsed, burstRemaining, companyId)
    .run();

  // -----------------------------
  // 8) Return decision
  // -----------------------------
  return {
    ok: true,
    rate: {
      status,
      reset_at: row.reset_at
    },
    monthly_remaining: Math.max(
      0,
      row.monthly_quota - monthlyUsed
    ),
    burst_remaining: burstRemaining
  };
}

// -----------------------------
// Event writer (governance log)
// -----------------------------
export async function writeSandboxEventV2(
  env: Env,
  event: {
    event_id: string;
    company_id: string;
    baseline_snapshot_id: string;
    created_at: string;
    dedupe_key: string;
    status: string;
    confidence: number;
  }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO sandbox_events_v2
       (event_id, company_id, baseline_snapshot_id, created_at, dedupe_key, status, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      event.event_id,
      event.company_id,
      event.baseline_snapshot_id,
      event.created_at,
      event.dedupe_key,
      event.status,
      event.confidence
    )
    .run();
}