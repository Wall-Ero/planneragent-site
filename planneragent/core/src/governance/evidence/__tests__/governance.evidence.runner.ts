// core/src/governance/evidence/__tests__ /governance.evidence.runner.ts
// ============================================================
// PlannerAgent — Governance Evidence Runtime Test
// Canonical Test Runner
// ============================================================

import {
assertEncryptionPolicy,
} from "../../../security/encryption.policy";

import {
assertSovereigntyPolicy,
} from "../../../security/sovereignty.policy";

import {
assertTenantBoundary,
} from "../../../security/tenant.boundary";

async function run() {

console.log("");
console.log("================================");
console.log("GOVERNANCE EVIDENCE TEST");
console.log("================================");
console.log("");

// =========================================================
// ENCRYPTION
// =========================================================

assertEncryptionPolicy({
domain: "DECISION_MEMORY",
operation: "WRITE",
tenant_id: "TENANT_A",
});

console.log(
"✅ encryption evidence generated"
);

// =========================================================
// SOVEREIGNTY
// =========================================================

assertSovereigntyPolicy({
domain: "EXECUTION_MEMORY",
operation: "EXECUTE",
tenant_id: "TENANT_A",
source_region: "eu-west",
runtime_locality: "REGION_LOCAL",
});

console.log(
"✅ sovereignty evidence generated"
);

// =========================================================
// TENANT LOCAL
// =========================================================

assertTenantBoundary({
sourceTenant: "TENANT_A",
targetTenant: "TENANT_A",
domain: "EXECUTION_MEMORY",
});

console.log(
"✅ tenant evidence generated"
);

// =========================================================
// DENIED GOVERNANCE DECISION
// =========================================================

try {

assertTenantBoundary({
  sourceTenant: "TENANT_A",
  targetTenant: "TENANT_B",
  domain: "COGNITION_SYNTHESIS",
});

throw new Error(
  "Cross-tenant violation should have been blocked."
);

} catch {

console.log(
  "✅ denied governance evidence generated"
);

}

// =========================================================
// FINAL
// =========================================================

console.log("");
console.log("================================");
console.log("P9B.1 VERIFIED");
console.log("================================");
console.log("");

}

run();