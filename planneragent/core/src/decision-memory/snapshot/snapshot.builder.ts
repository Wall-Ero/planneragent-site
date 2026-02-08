// planneragent/core/src/decision-memory/snapshot/snapshot.builder.ts
// -----------------------------------------------------------------
// Decision Memory Snapshot Builder — V1
// Canonical · Source of Truth · PRE-SRL
// Cloudflare Worker Compatible (Web Crypto API)
// -----------------------------------------------------------------

import {
  DecisionMemorySnapshotV1,
  BuildDecisionMemorySnapshotInputV1
} from "./snapshot.types";

// ---------------------------------------------------------------
// SHA256 — Web Crypto (Cloudflare Safe)
// ---------------------------------------------------------------
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------
// Stable JSON stringify (hash deterministic)
// ---------------------------------------------------------------
function stableStringify(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

// ---------------------------------------------------------------
// Build Snapshot
// ---------------------------------------------------------------
export async function buildDecisionMemorySnapshotV1(
  input: BuildDecisionMemorySnapshotInputV1
): Promise<DecisionMemorySnapshotV1> {

  const created_at = new Date().toISOString();

  const payloadForHash = stableStringify({
    snapshot_id: input.snapshot_id,
    tenant_id: input.tenant_id,
    company_id: input.company_id,
    context_id: input.context_id,
    plan: input.plan,
    intent: input.intent,
    domain: input.domain,
    baseline_snapshot_id: input.baseline_snapshot_id,
    baseline_metrics: input.baseline_metrics,
    ord_status: input.ord_status,
    previous_hash: input.previous_hash,
    created_at
  });

  const current_hash = await sha256(payloadForHash);

  return {
    snapshot_id: input.snapshot_id,
    tenant_id: input.tenant_id,

    company_id: input.company_id,
    context_id: input.context_id,

    plan: input.plan,
    intent: input.intent,
    domain: input.domain,

    baseline_snapshot_id: input.baseline_snapshot_id,
    baseline_metrics: input.baseline_metrics,

    ord: {
      status: input.ord_status
    },

    hash_chain: {
      previous_hash: input.previous_hash,
      current_hash
    },

    created_at
  };
}