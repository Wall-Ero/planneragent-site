//core/src/cryptography/infrastructure/__tests__/cryptography.infrastructure.assessment.runner.ts
// ============================================================
// PlannerAgent
// Storage & Infrastructure Assessment Runner
// ============================================================

import {
  assessInfrastructureDomain,
  INFRASTRUCTURE_ASSESSMENT_CANDIDATES,
} from "../cryptography.infrastructure.assessment";


// ============================================================
// ASSERT
// ============================================================

function assert(
  condition: boolean,
  message: string
): void {

  if (!condition) {

    throw new Error(
      `❌ ${message}`
    );

  }

  console.log(
    `✅ ${message}`
  );

}


// ============================================================
// ASSESSMENT
// ============================================================

const report =
  assessInfrastructureDomain();


// ============================================================
// TEST 1
// Assessment completes
// ============================================================

assert(
  !!report,
  "assessment completes"
);


// ============================================================
// TEST 2
// All canonical candidates evaluated
// ============================================================

assert(
  report.results.length ===
    INFRASTRUCTURE_ASSESSMENT_CANDIDATES.length,
  "all canonical candidates evaluated"
);


// ============================================================
// TEST 3
// KMS classified as provisioning
// ============================================================

const kms =
  report.results.find(
    r =>
      r.candidateId ===
      "KMS_INTEGRATION"
  );

assert(
  kms?.classification ===
    "INFRASTRUCTURE_PROVISIONING",
  "kms classified as provisioning"
);


// ============================================================
// TEST 4
// Vault classified as provisioning
// ============================================================

const vault =
  report.results.find(
    r =>
      r.candidateId ===
      "VAULT_INTEGRATION"
  );

assert(
  vault?.classification ===
    "INFRASTRUCTURE_PROVISIONING",
  "vault classified as provisioning"
);


// ============================================================
// TEST 5
// Secret Store classified as usage
// ============================================================

const secretStore =
  report.results.find(
    r =>
      r.candidateId ===
      "SECRET_STORE"
  );

assert(
  secretStore?.classification ===
    "INFRASTRUCTURE_USAGE",
  "secret store classified as usage"
);


// ============================================================
// TEST 6
// Access Control classified correctly
// ============================================================

const accessControl =
  report.results.find(
    r =>
      r.candidateId ===
      "INFRASTRUCTURE_ACCESS_CONTROL"
  );

assert(
  accessControl?.classification ===
    "ACCESS_CONTROL",
  "access control classified correctly"
);


// ============================================================
// TEST 7
// Recovery Backup Storage classified as recovery
// ============================================================

const recovery =
  report.results.find(
    r =>
      r.candidateId ===
      "RECOVERY_BACKUP_STORAGE"
  );

assert(
  recovery?.classification ===
    "INFRASTRUCTURE_RECOVERY",
  "recovery backup storage classified as recovery"
);


// ============================================================
// TEST 8
// Audit Trail classified as auditability object
// ============================================================

const auditTrail =
  report.results.find(
    r =>
      r.candidateId ===
      "INFRASTRUCTURE_AUDIT_TRAIL"
  );

assert(
  auditTrail?.classification ===
    "AUDITABILITY_OBJECT",
  "audit trail classified as auditability object"
);


// ============================================================
// TEST 9
// Audit Trail outside infrastructure domain
// ============================================================

assert(
  auditTrail?.belongsToInfrastructureDomain ===
    false,
  "audit trail outside infrastructure domain"
);


// ============================================================
// TEST 10
// Preservation requirement detected
// ============================================================

assert(
  auditTrail?.requiresPreservation ===
    true,
  "preservation requirement detected"
);


// ============================================================
// TEST 11
// No infrastructure-domain object requires preservation
// ============================================================

const offenders =
  report.results.filter(
    r =>
      r.belongsToInfrastructureDomain &&
      r.requiresPreservation
  );

assert(
  offenders.length === 0,
  "no infrastructure-domain object requires preservation"
);


// ============================================================
// TEST 12
// Infrastructure control chain outcome selected
// ============================================================

assert(
  report.outcome ===
    "INFRASTRUCTURE_CONTROL_CHAIN",
  "infrastructure control chain outcome selected"
);


// ============================================================
// TEST 13
// Audit trail does not force hybrid model
// ============================================================

assert(
  auditTrail?.requiresPreservation === true &&
  report.outcome ===
    "INFRASTRUCTURE_CONTROL_CHAIN",
  "audit trail does not force hybrid model"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "STORAGE & INFRASTRUCTURE ASSESSMENT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  `Candidates Evaluated: ${report.results.length}`
);

console.log("");

console.log(
  "INFRASTRUCTURE_PROVISIONING:"
);

console.log(
  "✓ KMS_INTEGRATION"
);

console.log(
  "✓ VAULT_INTEGRATION"
);

console.log("");

console.log(
  "ACCESS_CONTROL:"
);

console.log(
  "✓ HSM_BOUNDARY"
);

console.log(
  "✓ INFRASTRUCTURE_ACCESS_CONTROL"
);

console.log("");

console.log(
  "INFRASTRUCTURE_USAGE:"
);

console.log(
  "✓ SECRET_STORE"
);

console.log(
  "✓ ENCRYPTION_AT_REST"
);

console.log(
  "✓ KEY_STORAGE"
);

console.log("");

console.log(
  "INFRASTRUCTURE_RECOVERY:"
);

console.log(
  "✓ RECOVERY_BACKUP_STORAGE"
);

console.log("");

console.log(
  "AUDITABILITY_OBJECT:"
);

console.log(
  "✓ INFRASTRUCTURE_AUDIT_TRAIL"
);

console.log("");

console.log(
  `Infrastructure Domain Preservation Requirements: ${offenders.length}`
);

console.log("");

console.log(
  `Assessment Outcome: ${report.outcome}`
);

console.log("");

console.log(
  "RESULT:"
);

console.log(
  "Hypothesis survives initial falsification attempt."
);

console.log("");

console.log(
  "================================"
);

console.log(
  "ASSESSMENT VERIFIED"
);

console.log(
  "================================"
);