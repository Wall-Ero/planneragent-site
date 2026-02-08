// core/src/sandbox/security/anonymousVision.rateShield.ts

// ======================================================
// Anonymous Vision Rate Shield — P3 Minimal (Canonical)
// Protects Tier-0 anonymous CSV / Excel uploads
// ======================================================

export type RateShieldInput = {
  ip: string;
  payload_bytes: number;
  now_ms?: number;
};

export type RateShieldOk = {
  ok: true;
};

export type RateShieldFail = {
  ok: false;
  reason:
    | "RATE_LIMIT_EXCEEDED"
    | "PAYLOAD_TOO_LARGE"
    | "BURST_BLOCKED";
  retry_after_ms?: number;
};

export type RateShieldResult = RateShieldOk | RateShieldFail;

// ------------------------------------------------------
// CONFIG — Safe Defaults (can move to policy.v2 later)
// ------------------------------------------------------

const MAX_REQ_PER_MIN = 20;
const BURST_LIMIT_5S = 8;
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2MB

const WINDOW_60S = 60_000;
const WINDOW_5S = 5_000;

// ------------------------------------------------------
// In-memory runtime store (P3 minimal)
// In P4 → move to DO / KV / Redis style persistence
// ------------------------------------------------------

type Bucket = {
  minute_hits: number[];
  burst_hits: number[];
};

const buckets = new Map<string, Bucket>();

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function prune(arr: number[], now: number, window: number) {
  while (arr.length && now - arr[0] > window) {
    arr.shift();
  }
}

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function anonymousVisionRateShield(
  input: RateShieldInput
): RateShieldResult {

  const now = input.now_ms ?? Date.now();

  // ---------- Payload size guard ----------
  if (input.payload_bytes > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      reason: "PAYLOAD_TOO_LARGE"
    };
  }

  // ---------- Bucket ----------
  let bucket = buckets.get(input.ip);
  if (!bucket) {
    bucket = {
      minute_hits: [],
      burst_hits: []
    };
    buckets.set(input.ip, bucket);
  }

  prune(bucket.minute_hits, now, WINDOW_60S);
  prune(bucket.burst_hits, now, WINDOW_5S);

  // ---------- Burst guard ----------
  if (bucket.burst_hits.length >= BURST_LIMIT_5S) {
    return {
      ok: false,
      reason: "BURST_BLOCKED",
      retry_after_ms: 5_000
    };
  }

  // ---------- Minute guard ----------
  if (bucket.minute_hits.length >= MAX_REQ_PER_MIN) {
    return {
      ok: false,
      reason: "RATE_LIMIT_EXCEEDED",
      retry_after_ms: 60_000
    };
  }

  // ---------- Record ----------
  bucket.minute_hits.push(now);
  bucket.burst_hits.push(now);

  return { ok: true };
}