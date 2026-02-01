// core/src/governance/snapshot/snapshot.ts
// Canonical Constitutional Snapshot — V1
// Source of Truth
//
// Responsibilities:
// - Stable canonical JSON encoding
// - HMAC-SHA256 signing
// - Signature verification
//
// This file defines the ONLY valid snapshot version used by EDGE and CORE

import type { OagProof } from "../../sandbox/contracts.v2";
import type {
  PlanTier,
  Intent,
  PlanningDomain
} from "../../sandbox/contracts.v2";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type SignedSnapshotV1 = {
  v: 1;

  company_id: string;
  request_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  actor_id: string;
  oag_proof: OagProof;

  budget: {
    budget_remaining_eur: number;
    reset_at: string; // ISO timestamp
  };

  governance_flags: {
    sovereignty: "paid" | "free" | "oss";
  };

  issued_at: string; // ISO timestamp
  signature: string; // HMAC-SHA256 over canonical_json(payload_without_signature)
};

// ------------------------------------------------------------------
// Canonical JSON (stable, deterministic, sorted keys)
// ------------------------------------------------------------------

function canonicalJson(x: unknown): string {
  const seen = new WeakSet();

  const stable = (v: any): any => {
    if (v && typeof v === "object") {
      if (seen.has(v)) return null;
      seen.add(v);

      if (Array.isArray(v)) {
        return v.map(stable);
      }

      const out: Record<string, any> = {};
      for (const k of Object.keys(v).sort()) {
        out[k] = stable(v[k]);
      }
      return out;
    }
    return v;
  };

  return JSON.stringify(stable(x));
}

// ------------------------------------------------------------------
// Crypto
// ------------------------------------------------------------------

async function hmacSha256Hex(
  secret: string,
  msg: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(msg)
  );

  return [...new Uint8Array(sig)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ------------------------------------------------------------------
// API
// ------------------------------------------------------------------

export async function signSnapshotV1(
  secret: string,
  snapshot: Omit<SignedSnapshotV1, "signature">
): Promise<SignedSnapshotV1> {
  const payload = { ...snapshot };
  const msg = canonicalJson(payload);
  const signature = await hmacSha256Hex(secret, msg);

  return {
    ...payload,
    signature
  };
}

export async function verifySnapshotV1(
  secret: string,
  signed: SignedSnapshotV1
): Promise<boolean> {
  const { signature, ...rest } = signed as any;
  const msg = canonicalJson(rest);
  const expected = await hmacSha256Hex(secret, msg);

  return expected === signature;
}