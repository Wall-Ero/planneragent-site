// core/src/decision-memory/tests/decisionMemory.integration.test.ts

// =====================================================
// Decision Memory — Integration Test (Node Runtime)
// Full canonical test — Builder → Store → Read
// =====================================================

import type {
  BuildDecisionMemorySnapshotInputV1,
  DecisionMemorySnapshotV1
} from "../snapshot/snapshot.types";

import type {
  PlanTier,
  Intent,
  PlanningDomain
} from "../../sandbox/contracts.v2";

import { buildDecisionMemorySnapshotV1 } from "../snapshot/snapshot.builder";
import { D1DecisionStoreAdapter } from "../decision.store";

// =====================================================
// DB MOCK (Node runtime replacement for Cloudflare D1)
// =====================================================

class MockPreparedStatement {
  constructor(private sql: string, private storage: any[]) {}

  bind(...values: any[]) {
    return {
      run: async () => {
        if (this.sql.includes("INSERT")) {
          this.storage.push(values);
        }
        return { success: true };
      },

      first: async () => {
        if (!this.storage.length) return null;

        const row = this.storage[this.storage.length - 1];

        return {
          snapshot_id: row[0],
          tenant_id: row[1],
          company_id: row[2],
          context_id: row[3],
          plan: row[4],
          intent: row[5],
          domain: row[6],
          baseline_snapshot_id: row[7],
          baseline_metrics_json: row[8],
          ord_json: row[9],
          previous_hash: row[10],
          current_hash: row[11],
          created_at: row[12]
        };
      }
    };
  }
}

class MockD1Database {
  storage: any[] = [];

  prepare(sql: string) {
    return new MockPreparedStatement(sql, this.storage);
  }
}

// Inject global DB like Cloudflare binding
(globalThis as any).DB = new MockD1Database();

// =====================================================
// TEST
// =====================================================

async function runIntegrationTest() {
  console.log("🚀 Decision Memory Integration Test START");

  const store = new D1DecisionStoreAdapter((globalThis as any).DB);

  // -------------------------
  // INPUT BUILD
  // -------------------------

  const input: BuildDecisionMemorySnapshotInputV1 = {
    tenant_id: "tenant_demo",
    company_id: "company_demo",
    context_id: "scm_prod_line_A",

    plan: "VISION" as PlanTier,
    intent: "INFORM" as Intent,
    domain: "supply_chain" as PlanningDomain,

    baseline_snapshot_id: "baseline_001",
    baseline_metrics: {
      backlog_units: 120,
      supplier_otd: 0.91
    },

    ord: {
      pressure_score: 0.42,
      confidence_score: 0.88,
      ord_gate: {
        allow_paid_llm: true,
        recommended_tier: "PAID",
        reason: "Pressure high + confidence good"
      }
    },

    previous_hash: null
  };

  // -------------------------
  // BUILD SNAPSHOT
  // -------------------------

  const snapshot: DecisionMemorySnapshotV1 =
    await buildDecisionMemorySnapshotV1(input);

  // -------------------------
  // STORE
  // -------------------------

  await store.appendSnapshot(snapshot);

  // -------------------------
  // READ BACK
  // -------------------------

  const readBack = await store.getLastSnapshot(
    input.company_id,
    input.context_id
  );

  if (!readBack) throw new Error("SNAPSHOT_NOT_FOUND");

  // -------------------------
  // HASH CHECK
  // -------------------------

  if (
    readBack.hash_chain.current_hash !==
    snapshot.hash_chain.current_hash
  ) {
    throw new Error("HASH_MISMATCH");
  }

  console.log("✅ Integration OK");
}

// =====================================================
// EXECUTE IF RUN DIRECTLY
// =====================================================

runIntegrationTest().catch((err) => {
  console.error("❌ Integration FAILED:", err);
});