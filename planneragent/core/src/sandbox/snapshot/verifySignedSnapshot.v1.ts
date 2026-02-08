// core/src/sandbox/snapshot/verifySignedSnapshot.v1.ts
// ======================================================
// SIGNED SNAPSHOT — Signature Verifier (Core-side) v1
// Canonical Source of Truth
//
// Purpose:
// - Core NEVER trusts Edge.
// - Core accepts ONLY a SignedSnapshot if its signature verifies.
// - Signature is computed over a canonical JSON string of `payload`.
//
// Algorithm:
// - HMAC-SHA256 over canonical(payload)
// - signature encoding: base64url (no padding)
//
// Env:
// - SNAPSHOT_HMAC_SECRET (required)
//
// Notes:
// - This file is intentionally self-contained.
// - If you later migrate to asymmetric signing (Ed25519), keep the same
//   canonicalization + envelope shape, swap the verifier.
// ======================================================

export type SignedSnapshotAlgV1 = "HMAC-SHA256";

export type SignedSnapshotV1<TPayload = unknown> = {
  v: 1;

  alg: SignedSnapshotAlgV1;
  key_id: string; // rotation support, e.g. "edge-hmac-001"

  issued_at: string; // ISO-8601
  expires_at?: string; // ISO-8601 (optional)

  payload: TPayload;

  // base64url(HMAC_SHA256(canonical(payload)))
  signature: string;
};

export type VerifyOk<TPayload> = {
  ok: true;
  payload: TPayload;
};

export type VerifyFail = {
  ok: false;
  reason:
    | "SNAPSHOT_MISSING"
    | "SNAPSHOT_VERSION_UNSUPPORTED"
    | "SNAPSHOT_ALG_UNSUPPORTED"
    | "SNAPSHOT_SIGNATURE_MISSING"
    | "SNAPSHOT_ISSUED_AT_MISSING"
    | "SNAPSHOT_EXPIRED"
    | "SNAPSHOT_SECRET_MISSING"
    | "SNAPSHOT_SIGNATURE_INVALID";
};

export type VerifyResult<TPayload> = VerifyOk<TPayload> | VerifyFail;

type Env = {
  SNAPSHOT_HMAC_SECRET?: string;
};

export async function verifySignedSnapshotV1<TPayload>(
  env: Env,
  signed: SignedSnapshotV1<TPayload> | null | undefined,
  nowIso: string = new Date().toISOString()
): Promise<VerifyResult<TPayload>> {
  if (!signed) return { ok: false, reason: "SNAPSHOT_MISSING" };
  if (signed.v !== 1) return { ok: false, reason: "SNAPSHOT_VERSION_UNSUPPORTED" };
  if (signed.alg !== "HMAC-SHA256") return { ok: false, reason: "SNAPSHOT_ALG_UNSUPPORTED" };
  if (!signed.signature) return { ok: false, reason: "SNAPSHOT_SIGNATURE_MISSING" };
  if (!signed.issued_at) return { ok: false, reason: "SNAPSHOT_ISSUED_AT_MISSING" };

  if (signed.expires_at && signed.expires_at <= nowIso) {
    return { ok: false, reason: "SNAPSHOT_EXPIRED" };
  }

  const secret = env.SNAPSHOT_HMAC_SECRET;
  if (!secret) return { ok: false, reason: "SNAPSHOT_SECRET_MISSING" };

  const canonical = stableStringify(signed.payload);
  const expected = await hmacSha256Base64Url(secret, canonical);

  if (!timingSafeEqual(expected, signed.signature)) {
    return { ok: false, reason: "SNAPSHOT_SIGNATURE_INVALID" };
  }

  return { ok: true, payload: signed.payload };
}

// -----------------------------
// Crypto helpers (WebCrypto)
// -----------------------------
async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

function toBase64Url(bytes: Uint8Array): string {
  // btoa expects binary string
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  // base64url (no padding)
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  // constant-time-ish compare for equal-length strings
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// -----------------------------
// Canonical JSON stringify
// - stable key ordering
// - supports objects/arrays/primitives
// - rejects functions/undefined/symbol
// -----------------------------
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortRec(value));
}

function sortRec(v: any): any {
  if (v === null) return null;

  const t = typeof v;
  if (t === "number" || t === "string" || t === "boolean") return v;

  if (t === "bigint") return v.toString(); // safe canonical form
  if (t === "undefined" || t === "function" || t === "symbol") {
    // undefined inside objects would get dropped by JSON.stringify, which would
    // make signatures ambiguous. We hard-fail by normalizing to null marker.
    return null;
  }

  if (Array.isArray(v)) return v.map(sortRec);

  // plain object
  const keys = Object.keys(v).sort();
  const out: Record<string, any> = {};
  for (const k of keys) out[k] = sortRec(v[k]);
  return out;
}