import {
  assertSovereigntyPolicy,
} from "../sovereignty.policy";

async function run() {

  console.log("");
  console.log("================================");
  console.log("SOVEREIGNTY RUNTIME TEST");
  console.log("================================");
  console.log("");

  // --------------------------------------------------
  // LOCAL EXECUTION
  // --------------------------------------------------

  assertSovereigntyPolicy({
    domain: "EXECUTION_MEMORY",
    operation: "EXECUTE",

    tenant_id: "TENANT_A",

    source_region: "EU",
    target_region: "EU",

    runtime_locality: "REGION_LOCAL",

    involves_authority: true,
    involves_execution: true,
  });

  console.log(
    "✅ local execution allowed"
  );

  // --------------------------------------------------
  // GLOBAL AUTHORITY BLOCK
  // --------------------------------------------------

  let blocked = false;

  try {

    assertSovereigntyPolicy({
      domain: "EXECUTION_MEMORY",
      operation: "EXECUTE",

      tenant_id: "TENANT_A",

      source_region: "EU",
      target_region: "US",

      runtime_locality: "GLOBAL_RUNTIME",

      involves_authority: true,
      involves_execution: true,
    });

  } catch {

    blocked = true;

  }

  if (!blocked) {

    throw new Error(
      "Authority execution should be blocked in GLOBAL_RUNTIME."
    );

  }

  console.log(
    "✅ global authority execution blocked"
  );

  // --------------------------------------------------
  // NON EXPORTABLE REPLICATION
  // --------------------------------------------------

  blocked = false;

  try {

    assertSovereigntyPolicy({
      domain: "CHARTER",

      operation: "REPLICATE",

      tenant_id: "TENANT_A",

      source_region: "EU",
      target_region: "US",

      runtime_locality: "GLOBAL_RUNTIME",
    });

  } catch {

    blocked = true;

  }

  if (!blocked) {

    throw new Error(
      "CHARTER replication should be blocked."
    );

  }

  console.log(
    "✅ non exportable replication blocked"
  );

  console.log("");
  console.log("================================");
  console.log("P9 SOVEREIGNTY VERIFIED");
  console.log("================================");
  console.log("");

}

run();