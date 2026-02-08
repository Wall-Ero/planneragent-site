// src/edge/routes.evaluate.ts
//
// ==========================================
// EDGE WORKER — Authority & Governance Layer
// routes.evaluate.ts (Canonical v1.2)
// ------------------------------------------
// - Validates incoming request
// - Normalizes PLAN / INTENT / DOMAIN
// - Enforces OAG authority
// - Applies sovereignty & budget gates
// - Builds and SIGNS Snapshot (SignedSnapshotV1)
// - Dispatches ONLY snapshot to Core Worker
// ==========================================

import type { D1Database } from "@cloudflare/workers-types";
import { validateOagAndBuildProof } from "../governance/oag/validateOag";
import {
  signSnapshotV1,
  type SignedSnapshotV1
} from "../governance/snapshot/snapshot";

// -----------------------------
// Types (Edge-local contract)
// -----------------------------

type PlanTier = "BASIC" | "JUNIOR" | "SENIOR" | "PRINCIPAL";
type Intent = "INFORM" | "ADVISE" | "EXECUTE";
type PlanningDomain = "supply_chain" | "production" | "logistics";
type SovereigntyClass = "paid" | "free" | "oss";

interface EdgeEnv {
  DB: D1Database;
  CORE_WORKER_URL: string;
  SNAPSHOT_HMAC_SECRET: string;
}

// -----------------------------
// Helpers
// -----------------------------

function normalizePlan(raw?: string): PlanTier {
  if (!raw) return "BASIC";
  const upper = raw.toUpperCase();

  // Legacy aliases
  if (upper === "VISION") return "BASIC";
  if (upper === "GRADUATE") return "JUNIOR";

  if (
    upper === "BASIC" ||
    upper === "JUNIOR" ||
    upper === "SENIOR" ||
    upper === "PRINCIPAL"
  ) {
    return upper;
  }

  return "BASIC";
}

function normalizeIntent(raw?: string, plan?: PlanTier): Intent {
  if (raw) {
    const upper = raw.toUpperCase();
    if (upper === "INFORM" || upper === "ADVISE" || upper === "EXECUTE") {
      return upper;
    }
  }

  switch (plan) {
    case "BASIC":
      return "INFORM";
    case "JUNIOR":
      return "ADVISE";
    case "SENIOR":
    case "PRINCIPAL":
      return "EXECUTE";
    default:
      return "INFORM";
  }
}

function normalizeDomain(raw?: string): PlanningDomain {
  if (raw === "production" || raw === "logistics" || raw === "supply_chain") {
    return raw;
  }
  return "supply_chain";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" }
  });
}

// -----------------------------
// Main Route
// -----------------------------

export async function edgeEvaluate(
  req: Request,
  env: EdgeEnv
): Promise<Response> {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        reason: "INVALID_JSON"
      },
      400
    );
  }

  // -----------------------------
  // Identity
  // -----------------------------

  const company_id: string =
    typeof body?.company_id === "string"
      ? body.company_id
      : "unknown";

  const actor_id: string =
    typeof body?.actor_id === "string"
      ? body.actor_id
      : "user:anonymous";

  const sponsor_id: string | undefined =
    typeof body?.sponsor_id === "string"
      ? body.sponsor_id
      : undefined;

  const plan: PlanTier = normalizePlan(body?.plan);
  const domain: PlanningDomain = normalizeDomain(body?.domain);
  const intent: Intent = normalizeIntent(body?.intent, plan);

  const budget_remaining_eur: number =
    typeof body?.budget_remaining_eur === "number"
      ? body.budget_remaining_eur
      : 0;

  const sovereignty: SovereigntyClass[] = Array.isArray(
    body?.governance_flags?.sovereignty
  )
    ? body.governance_flags.sovereignty
    : ["paid", "free", "oss"];

  const request_id: string =
    typeof body?.request_id === "string"
      ? body.request_id
      : crypto.randomUUID();

  // -----------------------------
  // OAG Authority Validation
  // -----------------------------

  const oagResult = await validateOagAndBuildProof({
    db: env.DB,
    companyId: company_id,
    actorId: actor_id,
    sponsorId: sponsor_id,
    plan,
    intent,
    domain
  });

  if (!oagResult.ok) {
    return jsonResponse(
      {
        ok: false,
        reason: "OAG_VALIDATION_FAILED",
        details: oagResult.reason
      },
      403
    );
  }

  // -----------------------------
  // Budget & Sovereignty Gate
  // -----------------------------

  if (plan === "BASIC" && budget_remaining_eur <= 0) {
    if (!sovereignty.includes("oss") && !sovereignty.includes("free")) {
      return jsonResponse(
        {
          ok: false,
          reason: "BUDGET_EXHAUSTED",
          details: "No free or OSS providers allowed by sovereignty policy"
        },
        402
      );
    }
  }

  // -----------------------------
  // Snapshot Build (CANONICAL)
  // -----------------------------

  const unsignedSnapshot: Omit<SignedSnapshotV1, "signature"> = {
    v: 1,

    company_id,
    request_id,

    plan,
    intent,
    domain,

    actor_id,
    oag_proof: oagResult.proof,

    budget: {
      budget_remaining_eur,
      reset_at: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1
      ).toISOString()
    },

    governance_flags: {
      sovereignty: sovereignty[0] ?? "oss"
    },

    issued_at: new Date().toISOString()
  };

  // -----------------------------
  // Snapshot Signing
  // -----------------------------

  const secret = env.SNAPSHOT_HMAC_SECRET;
  if (!secret) {
    return jsonResponse(
      {
        ok: false,
        reason: "SNAPSHOT_HMAC_SECRET_MISSING"
      },
      500
    );
  }

  const signedSnapshot = await signSnapshotV1(secret, unsignedSnapshot);

  // -----------------------------
  // Dispatch to Core Worker
  // -----------------------------

  const coreResp = await fetch(env.CORE_WORKER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-planneragent-edge": "true"
    },
    body: JSON.stringify({
      snapshot: signedSnapshot
    })
  });

  const text = await coreResp.text();

  return new Response(text, {
    status: coreResp.status,
    headers: { "content-type": "application/json" }
  });
}