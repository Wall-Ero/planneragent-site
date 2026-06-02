// core/src/governance/evidence/__tests__/governance.evidence.preservation.runner.ts
// ============================================================
// PlannerAgent — Governance Evidence Preservation Test
// Canonical Test Runner
// ============================================================

import {
  createRuntimeGovernanceEvidence,
} from "../governance.evidence.runtime";

import {
  preserveGovernanceEvidence,
  type GovernanceEvidencePreservationAdapter,
} from "../governance.evidence.preservation";

async function run() {

  console.log("");
  console.log("================================");
  console.log("GOVERNANCE EVIDENCE PRESERVATION TEST");
  console.log("================================");
  console.log("");

  const preservedRecords: unknown[] = [];

  const adapter: GovernanceEvidencePreservationAdapter = {
    async appendGovernanceEvidence(input) {
      preservedRecords.push(input.record);
    },
  };

  const evidence =
    createRuntimeGovernanceEvidence({
      source: "TENANT_BOUNDARY",
      allowed: false,
      tenant_id: "TENANT_A",
      domain: "COGNITION_SYNTHESIS",
      severity: "HIGH",
      reason: "Cross-tenant operational sovereignty violation.",
      summary: [
        "cross_tenant_violation",
        "operational_sovereignty_violation",
      ],
    });

  const result =
    await preserveGovernanceEvidence({
      record: evidence,
      adapter,
    });

  if (!result.preserved) {
    throw new Error(
      "Governance evidence should be preserved."
    );
  }

  if (preservedRecords.length !== 1) {
    throw new Error(
      "Governance evidence adapter should receive exactly one record."
    );
  }

  console.log(
    "✅ governance evidence preserved"
  );

  let blocked = false;

  try {

    await preserveGovernanceEvidence({
      record: evidence,
      adapter: undefined as any,
    });

  } catch {

    blocked = true;

  }

  if (!blocked) {
    throw new Error(
      "Missing preservation adapter should fail closed."
    );
  }

  console.log(
    "✅ missing preservation adapter fails closed"
  );

  console.log("");
  console.log("================================");
  console.log("P9B.2 PRESERVATION VERIFIED");
  console.log("================================");
  console.log("");

}

run();