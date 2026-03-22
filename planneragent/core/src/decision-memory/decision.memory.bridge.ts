// core/src/decision-memory/decision.memory.bridge.ts
// ============================================================
// PlannerAgent — Decision Memory Bridge
// Canonical Source of Truth
// ============================================================

import type { DecisionTraceV2 } from "../decision/decision.trace";
import type { D1DecisionStoreAdapter } from "./decision.store";

import {
  buildDecisionMemorySnapshotV1
} from "./snapshot/snapshot.builder";

import type { OrdEvidence } from "./snapshot/snapshot.types";

export async function persistDecisionTrace(params: {
  trace: DecisionTraceV2;
  store: D1DecisionStoreAdapter;
  tenant_id: string;
  company_id: string;
  context_id: string;
}): Promise<{ snapshot_id: string }> {

  const { trace, store, tenant_id, company_id, context_id } = params;

  console.log("PERSIST_START");

  const ord: OrdEvidence = {
    pressure_score: 0,
    confidence_score: trace.vision.data_quality === "HIGH" ? 1 : 0.5,
    ord_gate: {
      allow_paid_llm: true,
      recommended_tier: "PAID",
      reason: "Derived from DecisionTraceV2"
    }
  };

  const snapshot = await buildDecisionMemorySnapshotV1({
    tenant_id,
    company_id,
    context_id,

    plan: trace.authority.level,
    intent: mapIntent(trace),
    domain: context_id,

    baseline_snapshot_id: "N/A",
    baseline_metrics: {
      data_quality_score:
        trace.vision.data_quality === "HIGH" ? 1 :
        trace.vision.data_quality === "MEDIUM" ? 0.6 : 0.3
    },

    ord,

    previous_hash: null
  });

  await store.appendSnapshot(snapshot);

  console.log("PERSIST_OK", snapshot.snapshot_id);

  return { snapshot_id: snapshot.snapshot_id };
}

// ------------------------------------------------------------

function mapIntent(
  trace: DecisionTraceV2
): "SENSE" | "ADVISE" | "EXECUTE" | "GOVERN" {

  switch (trace.authority.mode) {

    case "OBSERVATION":
      return "SENSE";

    case "HUMAN_APPROVED":
      return "EXECUTE";

    case "DELEGATED_EXECUTION":
      return "EXECUTE";

    case "IMPROVEMENT_ALLOCATION":
      return "GOVERN";

    case "HUMAN_TOOL_USAGE":
      return "ADVISE";

    case "CONSTITUTIONAL_BOUNDARY":
    default:
      return "ADVISE";
  }
}