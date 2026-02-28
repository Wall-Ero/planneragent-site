// src/governance/snapshot/snapshot.ts
// ============================================
// Snapshot Signing — HMAC v1
// Canonical Snapshot · Source of Truth
// ============================================

import type { SignedSnapshotV1 } from "../../sandbox/contracts.v2";

export type UnsignedSnapshotV1 = Omit<SignedSnapshotV1, "signature">;

function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>();

  const sorter = (_key: string, value: any) => {
    if (value && typeof value === "object") {
      if (seen.has(value)) return undefined;
      seen.add(value);

      if (Array.isArray(value)) return value;

      const out: Record<string, unknown> = {};
      for (const k of Object.keys(value).sort()) out[k] = value[k];
      return out;
    }
    return value;
  };

  return JSON.stringify(obj, sorter);
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(sig);
}

export async function signSnapshotV1(
  secret: string,
  unsigned: UnsignedSnapshotV1
): Promise<SignedSnapshotV1> {
  const payload = stableStringify(unsigned);
  const signature = await hmacSha256Hex(secret, payload);
  return { ...unsigned, signature };
}

export async function verifySnapshotV1(
  secret: string,
  signed: SignedSnapshotV1
): Promise<boolean> {
  const { signature, ...rest } = signed as any;
  if (!signature || typeof signature !== "string") return false;

  const payload = stableStringify(rest);
  const expected = await hmacSha256Hex(secret, payload);
  return expected === signature;
}