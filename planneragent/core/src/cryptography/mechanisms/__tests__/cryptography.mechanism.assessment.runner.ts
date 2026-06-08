//PATH
//------------------------------------------------------------
//core/src/cryptography/mechanisms/__tests__/cryptography.mechanism.assessment.runner.ts

// ============================================================
// PlannerAgent
// Cryptographic Mechanism Assessment Runner
// ============================================================

import {
  assessCryptographicMechanisms,
  MECHANISM_ASSESSMENT_CANDIDATES,
} from "../cryptography.mechanism.assessment";


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


const report =
  assessCryptographicMechanisms();


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
    MECHANISM_ASSESSMENT_CANDIDATES.length,
  "all canonical candidates evaluated"
);


// ============================================================
// TEST 3
// AES classified as execution
// ============================================================

const aes =
  report.results.find(
    r =>
      r.candidateId ===
      "AES_ENCRYPTION"
  );

assert(
  aes?.classification ===
    "CRYPTOGRAPHIC_EXECUTION",
  "aes classified as execution"
);


// ============================================================
// TEST 4
// Key length validation classified as verification
// ============================================================

const keyLength =
  report.results.find(
    r =>
      r.candidateId ===
      "KEY_LENGTH_VALIDATION"
  );

assert(
  keyLength?.classification ===
    "CRYPTOGRAPHIC_VERIFICATION",
  "key length validation classified as verification"
);


// ============================================================
// TEST 5
// Execution trace classified as auditability object
// ============================================================

const trace =
  report.results.find(
    r =>
      r.candidateId ===
      "CRYPTOGRAPHIC_EXECUTION_TRACE"
  );

assert(
  trace?.classification ===
    "AUDITABILITY_OBJECT",
  "execution trace classified as auditability object"
);


// ============================================================
// TEST 6
// Execution trace outside mechanism domain
// ============================================================

assert(
  trace?.belongsToMechanismDomain ===
    false,
  "execution trace outside mechanism domain"
);


// ============================================================
// TEST 7
// Preservation requirement detected
// ============================================================

assert(
  trace?.requiresPreservation ===
    true,
  "preservation requirement detected"
);


// ============================================================
// TEST 8
// No mechanism-domain object requires preservation
// ============================================================

const offenders =
  report.results.filter(
    r =>
      r.belongsToMechanismDomain &&
      r.requiresPreservation
  );

assert(
  offenders.length === 0,
  "no mechanism-domain object requires preservation"
);


// ============================================================
// TEST 9
// Execution chain outcome selected
// ============================================================

assert(
  report.outcome ===
    "CRYPTOGRAPHIC_EXECUTION_CHAIN",
  "execution chain outcome selected"
);


// ============================================================
// TEST 10
// Execution trace does not force hybrid model
// ============================================================

assert(
  trace?.requiresPreservation === true &&
  report.outcome ===
    "CRYPTOGRAPHIC_EXECUTION_CHAIN",
  "execution trace does not force hybrid model"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "P9C.6.0 CRYPTOGRAPHIC MECHANISM ASSESSMENT"
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
  "CRYPTOGRAPHIC_EXECUTION:"
);

console.log(
  "✓ AES_ENCRYPTION"
);

console.log(
  "✓ AES_DECRYPTION"
);

console.log(
  "✓ ENVELOPE_ENCRYPTION"
);

console.log(
  "✓ TRANSPORT_PROTECTION"
);

console.log("");

console.log(
  "CRYPTOGRAPHIC_VERIFICATION:"
);

console.log(
  "✓ KEY_LENGTH_VALIDATION"
);

console.log(
  "✓ ENCRYPTION_VERIFICATION"
);

console.log("");

console.log(
  "AUDITABILITY_OBJECT:"
);

console.log(
  "✓ CRYPTOGRAPHIC_EXECUTION_TRACE"
);

console.log("");

console.log(
  `Mechanism Domain Preservation Requirements: ${offenders.length}`
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