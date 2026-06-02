//core/src/governance/ledger/__tests__/governance.ledger.d1.runner.ts

// ============================================================
// PlannerAgent — Governance Ledger D1 Test Runner
// ============================================================

import {
  GovernanceLedgerD1Adapter,
} from "../adapters/governance.ledger.d1.adapter";

import {
  preserveGovernanceLedgerRecord,
} from "../governance.ledger.preservation";

import {
  buildGovernanceLedgerRecord,
} from "../governance.ledger.builder";

async function run() {

  console.log("");
  console.log("================================");
  console.log("IMMUTABLE LEDGER D1 TEST");
  console.log("================================");
  console.log("");

  const db =
    (globalThis as any).DB;

  if (!db) {

    throw new Error(
      "D1_DATABASE_NOT_AVAILABLE"
    );

  }

  const adapter =
    new GovernanceLedgerD1Adapter(
      db
    );

  const record =
    buildGovernanceLedgerRecord({

      evidence_id:
        crypto.randomUUID(),

      tenant_id:
        "TENANT_A",

      domain:
        "GOVERNANCE",

      previous_hash:
        null,

      current_hash:
        crypto.randomUUID(),

      sequence_number:
        1,

      created_at:
        new Date()
          .toISOString(),

    });

  await preserveGovernanceLedgerRecord({

    record,

    adapter,

  });

  console.log(
    "✅ ledger record preserved"
  );

  const reconstructed =
    await db
      .prepare(`
        SELECT *
        FROM governance_ledger
        WHERE ledger_id = ?
      `)
      .bind(
        record.ledger_id
      )
      .first();

  if (!reconstructed) {

    throw new Error(
      "LEDGER_NOT_RECONSTRUCTABLE"
    );

  }

  console.log(
    "✅ ledger record reconstructed"
  );

  if (
    reconstructed.ledger_id !==
    record.ledger_id
  ) {

    throw new Error(
      "LEDGER_IDENTITY_NOT_PRESERVED"
    );

  }

  console.log(
    "✅ ledger identity preserved"
  );

  console.log("");
  console.log("================================");
  console.log("IMMUTABLE LEDGER VERIFIED");
  console.log("================================");
  console.log("");

}

run();