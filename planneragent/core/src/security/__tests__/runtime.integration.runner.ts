// core/src/security/__tests__/runtime.integration.runner.ts
// ============================================================
// PlannerAgent — Runtime Sovereignty Integration Runner
// Canonical Test Runner
// ============================================================

import {
  resolveEncryptionPolicy,
} from "../encryption.policy";

import {
  evaluateSovereigntyPolicy,
} from "../sovereignty.policy";

import {
  evaluateTenantBoundary,
} from "../tenant.boundary";

import {
  appendImmutableRecord,
  verifyImmutableChain,
} from "../../ledger/immutable.chain";

async function run() {

  console.log("");
  console.log("================================");
  console.log("RUNTIME SECURITY INTEGRATION");
  console.log("================================");
  console.log("");

  // =========================================================
  // ENCRYPTION POLICY
  // =========================================================

  const encryption =
    resolveEncryptionPolicy({
      domain: "COGNITION_SYNTHESIS",
      operation: "LLM_ACCESS",
      tenant_id: "TENANT_A",
      llm_requested: true,
    });

  if (encryption.allowed) {
    throw new Error(
      "Encryption policy failed: LLM access should be blocked for cognition synthesis."
    );
  }

  console.log(
    "✅ encryption policy blocks protected LLM access"
  );

  // =========================================================
  // SOVEREIGNTY POLICY
  // =========================================================

  const sovereignty =
    evaluateSovereigntyPolicy({
      domain: "GOVERNANCE",
      operation: "PROCESS",
      tenant_id: "TENANT_A",
      source_region: "eu-west",
      runtime_locality: "REGION_LOCAL",
      involves_authority: true,
    });

  if (!sovereignty.allowed) {
    throw new Error(
      "Sovereignty policy failed: governed regional processing should be allowed."
    );
  }

  console.log(
    "✅ sovereignty policy allows governed regional processing"
  );

  // =========================================================
  // TENANT BOUNDARY — SAME TENANT
  // =========================================================

  const boundary =
    evaluateTenantBoundary({
      sourceTenant: "TENANT_A",
      targetTenant: "TENANT_A",
      domain: "COGNITION_SYNTHESIS",
    });

  if (!boundary.allowed) {
    throw new Error(
      "Tenant boundary failed: same-tenant access should be allowed."
    );
  }

  console.log(
    "✅ tenant boundary allows tenant-local access"
  );

  // =========================================================
  // TENANT BOUNDARY — CROSS TENANT BLOCK
  // =========================================================

  const crossTenant =
    evaluateTenantBoundary({
      sourceTenant: "TENANT_A",
      targetTenant: "TENANT_B",
      domain: "COGNITION_SYNTHESIS",
    });

  if (crossTenant.allowed) {
    throw new Error(
      "Tenant boundary failed: cross-tenant cognition access should be blocked."
    );
  }

  console.log(
    "✅ tenant boundary blocks cross-tenant cognition"
  );

  // =========================================================
  // IMMUTABLE CHAIN
  // =========================================================

  const r1 =
    await appendImmutableRecord({
      tenant_id: "TENANT_A",
      company_id: "WAL_SIM",
      domain: "COGNITION",
      encryption_domain: "COGNITION_SYNTHESIS",
      payload: {
        cognition: "runtime_experience",
      },
    });

  const r2 =
    await appendImmutableRecord({
      tenant_id: "TENANT_A",
      company_id: "WAL_SIM",
      domain: "EXECUTION",
      encryption_domain: "EXECUTION_MEMORY",
      previous: r1,
      payload: {
        execution: "inventory_reconciliation",
      },
    });

  const verification =
    await verifyImmutableChain([
      r1,
      r2,
    ]);

  if (!verification.valid) {
    throw new Error(
      "Immutable chain failed: chain should verify."
    );
  }

  console.log(
    "✅ immutable chain verified"
  );

  // =========================================================
  // FINAL
  // =========================================================

  console.log("");
  console.log("================================");
  console.log("FINAL RESULT");
  console.log("================================");
  console.log("");

  console.log(
    JSON.stringify(
      {
        encryption: encryption.summary,
        sovereignty: sovereignty.summary,
        tenantBoundary: boundary.summary,
        crossTenantBoundary: crossTenant.summary,
        immutable: verification.summary,
      },
      null,
      2
    )
  );

  console.log("");
  console.log("================================");
  console.log("RUN COMPLETE");
  console.log("================================");
  console.log("");

}

run();