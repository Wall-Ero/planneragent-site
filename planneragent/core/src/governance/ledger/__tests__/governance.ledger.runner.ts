// core/src/governance/ledger/__tests__/governance.ledger.runner.ts
// ============================================================
// PlannerAgent — Governance Ledger Test Runner
// Canonical Test Runner
// ============================================================

import {
  buildGovernanceLedgerRecord,
} from "../governance.ledger.builder";

import {
  verifyGovernanceLedger,
} from "../governance.ledger.verifier";

async function run() {

  console.log("");
  console.log("================================");
  console.log("IMMUTABLE GOVERNANCE LEDGER");
  console.log("================================");
  console.log("");

  // =========================================================
  // RECORD 1
  // =========================================================

  const r1 =
    buildGovernanceLedgerRecord({

      evidence_id:
        "EV_001",

      tenant_id:
        "TENANT_A",

      domain:
        "TENANT_BOUNDARY",

      previous_hash:
        null,

      current_hash:
        "HASH_001",

      sequence_number:
        1,

      created_at:
        new Date()
          .toISOString(),
    });

  console.log(
    "✅ ledger record created"
  );

  // =========================================================
  // RECORD 2
  // =========================================================

  const r2 =
    buildGovernanceLedgerRecord({

      evidence_id:
        "EV_002",

      tenant_id:
        "TENANT_A",

      domain:
        "SOVEREIGNTY",

      previous_hash:
        r1.current_hash,

      current_hash:
        "HASH_002",

      sequence_number:
        2,

      created_at:
        new Date()
          .toISOString(),
    });

  // =========================================================
  // VALID CHAIN
  // =========================================================

  const valid =
    verifyGovernanceLedger([
      r1,
      r2,
    ]);

  if (!valid.valid) {

    throw new Error(
      "VALID_CHAIN_SHOULD_VERIFY"
    );

  }

  console.log(
    "✅ ledger continuity verified"
  );

  // =========================================================
  // MUTABLE RECORD
  // =========================================================

  const mutableRecord = {

    ...r2,

    immutable:
      false as true,
  };

  const mutableResult =
    verifyGovernanceLedger([
      r1,
      mutableRecord,
    ]);

  if (
    mutableResult.valid
  ) {

    throw new Error(
      "MUTABLE_RECORD_SHOULD_FAIL"
    );

  }

  console.log(
    "✅ mutable record detected"
  );

  // =========================================================
  // BROKEN CHAIN
  // =========================================================

  const brokenRecord =
    buildGovernanceLedgerRecord({

      evidence_id:
        "EV_003",

      tenant_id:
        "TENANT_A",

      domain:
        "ENCRYPTION",

      previous_hash:
        "WRONG_HASH",

      current_hash:
        "HASH_003",

      sequence_number:
        3,

      created_at:
        new Date()
          .toISOString(),
    });

  const broken =
    verifyGovernanceLedger([
      r1,
      r2,
      brokenRecord,
    ]);

  if (
    broken.valid
  ) {

    throw new Error(
      "BROKEN_CHAIN_SHOULD_FAIL"
    );

  }

  console.log(
    "✅ broken chain detected"
  );

  // =========================================================
  // FINAL
  // =========================================================

  console.log("");
  console.log("================================");
  console.log("IMMUTABLE LEDGER VERIFIED");
  console.log("================================");
  console.log("");

}

run();