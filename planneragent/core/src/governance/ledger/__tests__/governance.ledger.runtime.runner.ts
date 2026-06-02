// core/src/governance/ledger/__tests__/governance.ledger.runtime.runner.ts
// ============================================================
// PlannerAgent — Governance Ledger Runtime Test Runner
// Canonical Test Runner
// ============================================================

import {
  createRuntimeGovernanceEvidence,
} from "../../evidence/governance.evidence.runtime";

import {
  createGovernanceLedgerRecordFromEvidence,
} from "../governance.ledger.runtime";

import {
  verifyGovernanceLedger,
} from "../governance.ledger.verifier";

async function run() {

  console.log("");
  console.log("================================");
  console.log("GOVERNANCE EVIDENCE → LEDGER");
  console.log("================================");
  console.log("");

  // =========================================================
  // EVIDENCE 1
  // =========================================================

  const evidence1 =
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
        "Cross tenant blocked",

      summary: [
        "audit_test",
      ],
    });

  const ledger1 =
    createGovernanceLedgerRecordFromEvidence({

      evidence:
        evidence1,

      previous:
        null,

      current_hash:
        "LEDGER_HASH_001",
    });

  console.log(
    "✅ evidence translated to ledger record"
  );

  // =========================================================
  // EVIDENCE 2
  // =========================================================

  const evidence2 =
    createRuntimeGovernanceEvidence({

      source:
        "SOVEREIGNTY_POLICY",

      allowed:
        false,

      tenant_id:
        "TENANT_A",

      domain:
        "EXECUTION_MEMORY",

      severity:
        "CRITICAL",

      reason:
        "Authority locality violation",

      summary: [
        "audit_test",
      ],
    });

  const ledger2 =
    createGovernanceLedgerRecordFromEvidence({

      evidence:
        evidence2,

      previous:
        ledger1,

      current_hash:
        "LEDGER_HASH_002",
    });

  console.log(
    "✅ evidence chain translated to ledger"
  );

  // =========================================================
  // VERIFY
  // =========================================================

  const verification =
    verifyGovernanceLedger([
      ledger1,
      ledger2,
    ]);

  if (!verification.valid) {

    throw new Error(
      "LEDGER_VERIFICATION_FAILED"
    );

  }

  console.log(
    "✅ governance ledger continuity verified"
  );

  // =========================================================
  // EVIDENCE ID PRESERVED
  // =========================================================

  if (
    ledger1.evidence_id !==
    evidence1.evidence_id
  ) {

    throw new Error(
      "EVIDENCE_ID_NOT_PRESERVED"
    );

  }

  console.log(
    "✅ evidence identity preserved"
  );

  // =========================================================
  // FINAL
  // =========================================================

  console.log("");
  console.log("================================");
  console.log("EVIDENCE → LEDGER VERIFIED");
  console.log("================================");
  console.log("");

}

run();