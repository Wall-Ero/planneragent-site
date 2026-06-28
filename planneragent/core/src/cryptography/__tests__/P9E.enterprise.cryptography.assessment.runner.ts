//core/src/cryptography/__tests__/P9E.enterprise.cryptography.assessment.runner.ts

// ============================================================
// PlannerAgent
// P9E Enterprise Cryptography Assessment Runner
// ============================================================

import {
  assessEnterpriseCryptography,
} from "../P9E.enterprise.cryptography.assessment";


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
// RUN ASSESSMENT
// ============================================================

const report =
  assessEnterpriseCryptography();


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
// All canonical capabilities evaluated
// ============================================================

assert(
  report.results.length === 6,
  "all canonical capabilities evaluated"
);


// ============================================================
// TEST 3
// Key rotation classified as lifecycle candidate
// ============================================================

const keyRotation =
  report.results.find(
    result =>
      result.capability ===
      "KEY_ROTATION"
  );

assert(
  keyRotation?.family ===
    "CANDIDATE_LIFECYCLE_FAMILY",
  "key rotation classified as lifecycle candidate"
);

assert(
  keyRotation?.requiresDedicatedAssessment ===
    true,
  "key rotation requires dedicated assessment"
);


// ============================================================
// TEST 4
// Secret lifecycle classified as lifecycle candidate
// ============================================================

const secretLifecycle =
  report.results.find(
    result =>
      result.capability ===
      "SECRET_LIFECYCLE"
  );

assert(
  secretLifecycle?.family ===
    "CANDIDATE_LIFECYCLE_FAMILY",
  "secret lifecycle classified as lifecycle candidate"
);

assert(
  secretLifecycle?.requiresDedicatedAssessment ===
    true,
  "secret lifecycle requires dedicated assessment"
);


// ============================================================
// TEST 5
// Cryptographic auditability classified as auditability candidate
// ============================================================

const cryptographicAuditability =
  report.results.find(
    result =>
      result.capability ===
      "CRYPTOGRAPHIC_AUDITABILITY"
  );

assert(
  cryptographicAuditability?.family ===
    "CANDIDATE_AUDITABILITY_FAMILY",
  "cryptographic auditability classified as auditability candidate"
);

assert(
  cryptographicAuditability?.requiresDedicatedAssessment ===
    true,
  "cryptographic auditability requires dedicated assessment"
);


// ============================================================
// TEST 6
// Envelope encryption reuses mechanism family
// ============================================================

const envelopeEncryption =
  report.results.find(
    result =>
      result.capability ===
      "ENVELOPE_ENCRYPTION"
  );

assert(
  envelopeEncryption?.family ===
    "MECHANISM_FAMILY",
  "envelope encryption reuses mechanism family"
);

assert(
  envelopeEncryption?.requiresDedicatedAssessment ===
    false,
  "envelope encryption does not require dedicated assessment"
);


// ============================================================
// TEST 7
// KMS runtime reuses infrastructure family
// ============================================================

const kmsRuntime =
  report.results.find(
    result =>
      result.capability ===
      "KMS_RUNTIME"
  );

assert(
  kmsRuntime?.family ===
    "INFRASTRUCTURE_FAMILY",
  "kms runtime reuses infrastructure family"
);

assert(
  kmsRuntime?.requiresDedicatedAssessment ===
    false,
  "kms runtime does not require dedicated assessment"
);


// ============================================================
// TEST 8
// Encryption at rest runtime reuses infrastructure family
// ============================================================

const encryptionAtRest =
  report.results.find(
    result =>
      result.capability ===
      "ENCRYPTION_AT_REST_RUNTIME"
  );

assert(
  encryptionAtRest?.family ===
    "INFRASTRUCTURE_FAMILY",
  "encryption at rest runtime reuses infrastructure family"
);

assert(
  encryptionAtRest?.requiresDedicatedAssessment ===
    false,
  "encryption at rest runtime does not require dedicated assessment"
);


// ============================================================
// TEST 9
// Candidate lifecycle family detected
// ============================================================

const lifecycleCandidates =
  report.results.filter(
    result =>
      result.family ===
      "CANDIDATE_LIFECYCLE_FAMILY"
  );

assert(
  lifecycleCandidates.length === 2,
  "candidate lifecycle family detected"
);


// ============================================================
// TEST 10
// Candidate auditability family detected
// ============================================================

const auditabilityCandidates =
  report.results.filter(
    result =>
      result.family ===
      "CANDIDATE_AUDITABILITY_FAMILY"
  );

assert(
  auditabilityCandidates.length === 1,
  "candidate auditability family detected"
);


// ============================================================
// TEST 11
// Hybrid enterprise model detected
// ============================================================

assert(
  report.outcome ===
    "HYBRID_ENTERPRISE_MODEL",
  "hybrid enterprise model detected"
);


// ============================================================
// TEST 12
// Candidate family does not imply family verification
// ============================================================

const candidateFamilies =
  report.results.filter(
    result =>
      result.requiresDedicatedAssessment
  );

assert(
  candidateFamilies.length === 3,
  "candidate family does not imply family verification"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "P9E ENTERPRISE CRYPTOGRAPHY ASSESSMENT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Capabilities Evaluated: 6"
);

console.log("");

console.log(
  "MECHANISM_FAMILY:"
);

console.log(
  "✓ ENVELOPE_ENCRYPTION"
);

console.log("");

console.log(
  "INFRASTRUCTURE_FAMILY:"
);

console.log(
  "✓ KMS_RUNTIME"
);

console.log(
  "✓ ENCRYPTION_AT_REST_RUNTIME"
);

console.log("");

console.log(
  "CANDIDATE_LIFECYCLE_FAMILY:"
);

console.log(
  "✓ KEY_ROTATION"
);

console.log(
  "✓ SECRET_LIFECYCLE"
);

console.log("");

console.log(
  "CANDIDATE_AUDITABILITY_FAMILY:"
);

console.log(
  "✓ CRYPTOGRAPHIC_AUDITABILITY"
);

console.log("");

console.log(
  "Outcome:"
);

console.log(
  "HYBRID_ENTERPRISE_MODEL"
);

console.log("");

console.log(
  "RESULT:"
);

console.log(
  "Candidate Lifecycle Family identified."
);

console.log(
  "Candidate Auditability Family identified."
);

console.log("");

console.log(
  "Family verification pending"
);

console.log(
  "dedicated assessment."
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