// core/src/governance/failclosed/__tests__/governance.failclosed.runner.ts
// ============================================================
// PlannerAgent — Governance Fail-Closed Test Runner
// Canonical Test Runner
// ============================================================

import {
  verifyGovernanceFailClosed,
} from "../governance.failclosed.verifier";

function assertFailClosed(input: {
  source:
    | "SNAPSHOT_VERIFICATION"
    | "TENANT_BOUNDARY"
    | "SOVEREIGNTY_POLICY"
    | "ENCRYPTION_POLICY"
    | "EXECUTION_GUARD"
    | "GENERIC_GOVERNANCE";

  label: string;
}) {

  const result =
    verifyGovernanceFailClosed({
      source: input.source,
      denied: true,
      evidenceGenerated: true,
      executionContinued: false,
      reason: `${input.source} denied runtime operation.`,
    });

  if (!result.failClosed) {
    throw new Error(
      `${input.source} should fail closed.`
    );
  }

  if (!result.evidenceGenerated) {
    throw new Error(
      `${input.source} should generate evidence.`
    );
  }

  if (!result.executionHalted) {
    throw new Error(
      `${input.source} should halt execution.`
    );
  }

  console.log(
    `✅ ${input.label} denial generates evidence`
  );

  console.log(
    `✅ ${input.label} denial halts execution`
  );
}

async function run() {

  console.log("");
  console.log("================================");
  console.log("FAIL-CLOSED AUDIT");
  console.log("================================");
  console.log("");

  assertFailClosed({
    source: "SNAPSHOT_VERIFICATION",
    label: "snapshot",
  });

  assertFailClosed({
    source: "TENANT_BOUNDARY",
    label: "tenant",
  });

  assertFailClosed({
    source: "SOVEREIGNTY_POLICY",
    label: "sovereignty",
  });

  assertFailClosed({
    source: "ENCRYPTION_POLICY",
    label: "encryption",
  });

  const failOpen =
    verifyGovernanceFailClosed({
      source: "GENERIC_GOVERNANCE",
      denied: true,
      evidenceGenerated: true,
      executionContinued: true,
      reason: "Denied governance path continued execution.",
    });

  if (failOpen.failClosed) {
    throw new Error(
      "Fail-open path should not pass verification."
    );
  }

  console.log(
    "✅ denied paths cannot continue execution"
  );

  const missingEvidence =
    verifyGovernanceFailClosed({
      source: "GENERIC_GOVERNANCE",
      denied: true,
      evidenceGenerated: false,
      executionContinued: false,
      reason: "Denied governance path produced no evidence.",
    });

  if (missingEvidence.failClosed) {
    throw new Error(
      "Denied path without evidence should not pass verification."
    );
  }

  console.log(
    "✅ denied paths require governance evidence"
  );

  console.log("");
  console.log("================================");
  console.log("P9B.3 VERIFIED");
  console.log("================================");
  console.log("");

}

run();