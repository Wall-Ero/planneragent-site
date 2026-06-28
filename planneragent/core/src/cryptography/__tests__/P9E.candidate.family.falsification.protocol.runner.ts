//core/src/cryptography/__tests__/P9E.candidate.family.falsification.protocol.runner.ts

// ============================================================
// PlannerAgent
// P9E Candidate Family Falsification Protocol Runner
// ============================================================

import {
  prepareCandidateFamilyFalsification,
} from "../P9E.candidate.family.falsification.protocol";


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
// RUN PROTOCOL
// ============================================================

const report =
  prepareCandidateFamilyFalsification();


// ============================================================
// TEST 1
// Protocol completes
// ============================================================

assert(
  !!report,
  "protocol completes"
);


// ============================================================
// TEST 2
// All candidate capabilities prepared
// ============================================================

assert(
  report.results.length === 3,
  "all candidate capabilities prepared"
);


// ============================================================
// TEST 3
// Key rotation under falsification
// ============================================================

const keyRotation =
  report.results.find(
    result =>
      result.capability ===
      "KEY_ROTATION"
  );

assert(
  keyRotation?.classification ===
    "UNDER_FALSIFICATION",
  "key rotation under falsification"
);


// ============================================================
// TEST 4
// Secret lifecycle under falsification
// ============================================================

const secretLifecycle =
  report.results.find(
    result =>
      result.capability ===
      "SECRET_LIFECYCLE"
  );

assert(
  secretLifecycle?.classification ===
    "UNDER_FALSIFICATION",
  "secret lifecycle under falsification"
);


// ============================================================
// TEST 5
// Cryptographic auditability under falsification
// ============================================================

const cryptographicAuditability =
  report.results.find(
    result =>
      result.capability ===
      "CRYPTOGRAPHIC_AUDITABILITY"
  );

assert(
  cryptographicAuditability?.classification ===
    "UNDER_FALSIFICATION",
  "cryptographic auditability under falsification"
);


// ============================================================
// TEST 6
// No candidate absorbed
// ============================================================

const absorbedCandidates =
  report.results.filter(
    result =>
      result.classification ===
      "ABSORBED_BY_EXISTING_FAMILY"
  );

assert(
  absorbedCandidates.length === 0,
  "no candidate absorbed"
);


// ============================================================
// TEST 7
// No candidate survives
// ============================================================

const survivingCandidates =
  report.results.filter(
    result =>
      result.classification ===
      "CANDIDATE_SURVIVES"
  );

assert(
  survivingCandidates.length === 0,
  "no candidate survives"
);


// ============================================================
// TEST 8
// No family verified
// ============================================================

assert(
  absorbedCandidates.length === 0 &&
  survivingCandidates.length === 0,
  "no family verified"
);


// ============================================================
// TEST 9
// Falsification pending outcome selected
// ============================================================

assert(
  report.outcome ===
    "FALSIFICATION_PENDING",
  "falsification pending outcome selected"
);


// ============================================================
// TEST 10
// Falsification not performed
// ============================================================

assert(
  report.summary.includes(
    "falsification_not_performed"
  ),
  "falsification not performed"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "P9E CANDIDATE FAMILY FALSIFICATION PROTOCOL"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Capabilities Prepared: 3"
);

console.log("");

console.log(
  "UNDER_FALSIFICATION:"
);

console.log(
  "✓ KEY_ROTATION"
);

console.log(
  "✓ SECRET_LIFECYCLE"
);

console.log(
  "✓ CRYPTOGRAPHIC_AUDITABILITY"
);

console.log("");

console.log(
  "Verified Families:"
);

console.log(
  "0"
);

console.log("");

console.log(
  "Absorbed Candidates:"
);

console.log(
  "0"
);

console.log("");

console.log(
  "Surviving Candidates:"
);

console.log(
  "0"
);

console.log("");

console.log(
  "Outcome:"
);

console.log(
  "FALSIFICATION_PENDING"
);

console.log("");

console.log(
  "RESULT:"
);

console.log(
  "Candidate capabilities identified."
);

console.log(
  "Candidate capabilities classified."
);

console.log(
  "Candidate capabilities prepared for falsification."
);

console.log(
  "Falsification not performed."
);

console.log("");

console.log(
  "================================"
);

console.log(
  "PROTOCOL VERIFIED"
);

console.log(
  "================================"
);