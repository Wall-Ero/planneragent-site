// core/src/governance/evidence/__tests__/governance.evidence.d1.runner.ts
// ============================================================
// PlannerAgent — Governance Evidence D1 Verification
// Canonical Test Runner
// ============================================================

import {
  GovernanceEvidenceD1Adapter,
} from "../adapters/governance.evidence.d1.adapter";

import {
  createRuntimeGovernanceEvidence,
} from "../governance.evidence.runtime";

import type {
  GovernanceEvidenceD1Database,
} from "../adapters/governance.evidence.d1.adapter";

// ============================================================
// ENV
// ============================================================

class FakeD1Database
  implements GovernanceEvidenceD1Database {

  private store =
    new Map<string, any>();

  prepare(query: string) {

    const self = this;

    return {

      bind(...values: unknown[]) {

        return {

          async run() {

            self.store.set(
              String(values[0]),
              {
                evidence_id: values[0],
                source: values[1],
                action: values[2],
                tenant_id: values[3],
                domain: values[4],
                severity: values[5],
                reason: values[6],
                summary_json: values[7],
                created_at: values[8],
              }
            );

            return {};
          },

          async first() {

            return self.store.get(
              String(values[0])
            ) ?? null;
          },

          async all() {

            return {
              results:
                Array.from(
                  self.store.values()
                ),
            };

          },

        };

      },

    };

  }

}

const DB =
  new FakeD1Database();

// ============================================================
// RUN
// ============================================================

async function run() {

  console.log("");
  console.log("================================");
  console.log("GOVERNANCE EVIDENCE D1 TEST");
  console.log("================================");
  console.log("");

  const adapter =
    new GovernanceEvidenceD1Adapter(
      DB
    );

  // ----------------------------------------------------------
  // GENERATE
  // ----------------------------------------------------------

  const evidence =
    createRuntimeGovernanceEvidence({

      source:
        "TENANT_BOUNDARY",

      allowed:
        false,

      tenant_id:
        "TENANT_A",

      domain:
        "COGNITION_SYNTHESIS",

      severity:
        "HIGH",

      reason:
        "Cross tenant cognition blocked.",

      summary: [
        "cross_tenant_violation",
      ],
    });

  // ----------------------------------------------------------
  // PRESERVE
  // ----------------------------------------------------------

  await adapter.appendGovernanceEvidence({
    record:
      evidence,
  });

  console.log(
    "✅ governance evidence persisted"
  );

  // ----------------------------------------------------------
  // READ BACK
  // ----------------------------------------------------------

  const restored =
    await adapter.getGovernanceEvidenceById(
      evidence.evidence_id
    );

  if (!restored) {

    throw new Error(
      "Evidence not found after persistence."
    );

  }

  // ----------------------------------------------------------
  // VERIFY
  // ----------------------------------------------------------

  if (
    restored.evidence_id !==
    evidence.evidence_id
  ) {

    throw new Error(
      "Evidence reconstruction failed."
    );

  }

  if (
    restored.reason !==
    evidence.reason
  ) {

    throw new Error(
      "Evidence reason mismatch."
    );

  }

  console.log(
    "✅ governance evidence reconstructed"
  );

  console.log("");
  console.log("================================");
  console.log("P9B.2 VERIFIED");
  console.log("================================");
  console.log("");

}

run();