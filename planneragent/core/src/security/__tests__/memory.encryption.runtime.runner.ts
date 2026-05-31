// ============================================================
// PlannerAgent — Memory Encryption Runtime Runner
// ============================================================

import {
  assertEncryptionPolicy,
} from "../encryption.policy";

async function run() {

  console.log("");
  console.log("================================");
  console.log("MEMORY ENCRYPTION RUNTIME TEST");
  console.log("================================");
  console.log("");

  // =========================================================
  // DECISION MEMORY WRITE
  // =========================================================

  assertEncryptionPolicy({
    domain: "DECISION_MEMORY",
    operation: "WRITE",
    tenant_id: "TENANT_A",
  });

  console.log(
    "✅ decision memory write allowed"
  );

  // =========================================================
  // EXECUTION MEMORY WRITE
  // =========================================================

  assertEncryptionPolicy({
    domain: "EXECUTION_MEMORY",
    operation: "WRITE",
    tenant_id: "TENANT_A",
  });

  console.log(
    "✅ execution memory write allowed"
  );

  // =========================================================
  // GOVERNANCE WRITE
  // =========================================================

  assertEncryptionPolicy({
    domain: "GOVERNANCE",
    operation: "WRITE",
    tenant_id: "TENANT_A",
  });

  console.log(
    "✅ governance write allowed"
  );

  // =========================================================
  // CHARTER WRITE
  // =========================================================

  assertEncryptionPolicy({
    domain: "CHARTER",
    operation: "WRITE",
    tenant_id: "TENANT_A",
  });

  console.log(
    "✅ charter write allowed"
  );

  // =========================================================
  // PROTECTED LLM ACCESS
  // =========================================================

  let llmBlocked = false;

  try {

    assertEncryptionPolicy({
      domain: "CHARTER",
      operation: "LLM_ACCESS",
      tenant_id: "TENANT_A",
    });

  } catch {

    llmBlocked = true;

  }

  if (!llmBlocked) {

    throw new Error(
      "Protected LLM access should be blocked."
    );

  }

  console.log(
    "✅ protected LLM access blocked"
  );

  // =========================================================
  // FINAL
  // =========================================================

  console.log("");
  console.log("================================");
  console.log("P9 MEMORY ENCRYPTION VERIFIED");
  console.log("================================");
  console.log("");

}

run();