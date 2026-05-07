// core/src/memory/memory.write.ts
// =================================
// PlannerAgent — Memory Write
// Canonical Snapshot · Source of Truth
// =================================

import type {
  MemoryWriteRequest
} from "./contracts.memory";

import {
  resolveMemoryPolicy
} from "./memory.policy";

import {
  classifyMemoryWrite
} from "./memory.classifier";

import type {
  DecisionMemorySnapshotV1
} from "../decision-memory/snapshot/snapshot.types";

export interface MemorySnapshotAdapter {
  appendSnapshot: (
    payload: DecisionMemorySnapshotV1
  ) => Promise<void>;
}

export async function appendMemoryRecord(
  input: {
    tenant_id?: string;
    company_id?: string;
    context_id?: string;

    plan: string;
    intent?: string;

    anomaly?: boolean;

    payload: DecisionMemorySnapshotV1;

    adapter: MemorySnapshotAdapter;
  }
): Promise<void> {

  // --------------------------------------------------
  // RESOLVE POLICY
  // --------------------------------------------------

  const policy =
    resolveMemoryPolicy(input.plan);

  if (!policy.write.allowed) {
    throw new Error(
      "MEMORY_WRITE_NOT_ALLOWED"
    );
  }

  // --------------------------------------------------
  // CLASSIFY MEMORY
  // --------------------------------------------------

  const classified =
    classifyMemoryWrite({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      context_id: input.context_id,

      plan: input.plan,
      intent: input.intent,

      anomaly: input.anomaly,

      payload: input.payload
    });

  // --------------------------------------------------
  // GOVERNANCE SAFETY
  // --------------------------------------------------

  if (
    classified.domain !==
    policy.write.write_domain
  ) {
    throw new Error(
      "MEMORY_DOMAIN_POLICY_MISMATCH"
    );
  }

  // --------------------------------------------------
  // TRACE
  // --------------------------------------------------

  console.log(
    "MEMORY_WRITE_CLASSIFIED",
    {
      domain: classified.domain,
      subtype: classified.subtype,
      plan: input.plan,
      intent: input.intent
    }
  );

  // --------------------------------------------------
  // IMPORTANTISSIMO
  // SAME RUNTIME BEHAVIOR
  // SAME STORAGE
  // SAME PAYLOAD
  // --------------------------------------------------

  await input.adapter.appendSnapshot(
    input.payload
  );
}