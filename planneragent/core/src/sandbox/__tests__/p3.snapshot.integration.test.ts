// core/src/sandbox/__tests__/p3.snapshot.integration.test.ts
// ======================================================
// P3 — Snapshot Envelope + Signature
// CANONICAL TEST — Envelope Aware
// ======================================================

import { describe, it, expect } from "vitest";

import {
  verifySignedSnapshotV1,
  stableStringify,
  type SignedSnapshotV1
} from "../snapshot/verifySignedSnapshot.v1";

import type {
  SignedSnapshotV1 as PayloadV1,
  PlanTier,
  Intent,
  PlanningDomain,
  OagProof
} from "../contracts.v2";

// ------------------------------------------------------
// Test ENV
// ------------------------------------------------------

const ENV = {
  SNAPSHOT_HMAC_SECRET: "TEST_SECRET_KEY"
};

// ------------------------------------------------------
// Crypto helper (test side)
// ------------------------------------------------------

async function signPayload(secret: string, payload: unknown): Promise<string> {
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const canonical = stableStringify(payload);

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(canonical)
  );

  return base64Url(new Uint8Array(sig));
}

function base64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ------------------------------------------------------
// Payload builder
// ------------------------------------------------------

function buildPayload(): PayloadV1 {
  const oag: OagProof = {
    company_id: "c1",
    actor_id: "user-1",
    plan: "VISION",
    domain: "supply_chain",
    intent: "INFORM",
    issued_at: new Date().toISOString(),
    authority: "human"
  };

  return {
    v: 1,
    company_id: "c1",
    request_id: "req-1",

    plan: "VISION" as PlanTier,
    intent: "INFORM" as Intent,
    domain: "supply_chain" as PlanningDomain,

    actor_id: "user-1",
    oag_proof: oag,

    budget: {
      budget_remaining_eur: 10,
      reset_at: new Date(Date.now() + 86400000).toISOString()
    },

    governance_flags: {
      sovereignty: "paid"
    },

    issued_at: new Date().toISOString(),
    signature: "NOT_USED_IN_ENVELOPE"
  };
}

// ------------------------------------------------------
// Envelope builder
// ------------------------------------------------------

async function buildEnvelope(): Promise<SignedSnapshotV1<PayloadV1>> {
  const payload = buildPayload();

  const signature = await signPayload(
    ENV.SNAPSHOT_HMAC_SECRET,
    payload
  );

  return {
    v: 1,
    alg: "HMAC-SHA256",
    key_id: "edge-hmac-test",
    issued_at: new Date().toISOString(),
    payload,
    signature
  };
}

// ======================================================
// TESTS
// ======================================================

describe("P3 Snapshot Envelope + Signature", () => {

  it("accepts valid signed snapshot envelope", async () => {
    const envelope = await buildEnvelope();

    const res = await verifySignedSnapshotV1(
      ENV,
      envelope
    );

    expect(res.ok).toBe(true);
  });

  it("rejects tampered payload", async () => {
    const envelope = await buildEnvelope();

    envelope.payload.company_id = "evil-corp";

    const res = await verifySignedSnapshotV1(
      ENV,
      envelope
    );

    expect(res.ok).toBe(false);
  });

  it("rejects invalid signature", async () => {
    const envelope = await buildEnvelope();

    envelope.signature = "evil.signature";

    const res = await verifySignedSnapshotV1(
      ENV,
      envelope
    );

    expect(res.ok).toBe(false);
  });

});