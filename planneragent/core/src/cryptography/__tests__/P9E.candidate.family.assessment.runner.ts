//core/src/cryptography/__tests__/P9E.candidate.family.assessment.runner.ts

// ============================================================
// PlannerAgent
// P9E Candidate Family Assessment Runner
// ============================================================

import {
  assessCandidateFamilies,
} from "../P9E.candidate.family.assessment";


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
  assessCandidateFamilies();


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
// All candidate capabilities evaluated
// ============================================================

assert(
  report.results.length === 3,
  "all candidate capabilities evaluated"
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

assert(
  keyRotation?.requiresDedicatedAssessment ===
    true,
  "key rotation requires dedicated assessment"
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

assert(
  secretLifecycle?.requiresDedicatedAssessment ===
    true,
  "secret lifecycle requires dedicated assessment"
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

assert(
  cryptographicAuditability?.requiresDedicatedAssessment ===
    true,
  "cryptographic auditability requires dedicated assessment"
);


// ============================================================
// TEST 6
// No candidate family verified
// ============================================================

const verifiedFamilies =
  report.results.filter(
    result =>
      result.classification ===
      "CANDIDATE_NEW_FAMILY"
  );

assert(
  verifiedFamilies.length === 0,
  "no candidate family verified"
);


// ============================================================
// TEST 7
// No candidate absorbed
// ============================================================

const absorbedCandidates =
  report.results.filter(
    result =>
      result.classification ===
      "EXPRESSIBLE_THROUGH_EXISTING_FAMILY"
  );

assert(
  absorbedCandidates.length === 0,
  "no candidate absorbed"
);


// ============================================================
// TEST 8
// Falsification pending outcome selected
// ============================================================

assert(
  report.outcome ===
    "FALSIFICATION_PENDING",
  "falsification pending outcome selected"
);


// ============================================================
// TEST 9
// Family verification not performed
// ============================================================

assert(
  report.summary.includes(
    "family_verification_not_performed"
  ),
  "family verification not performed"
);


// ============================================================
// TEST 10
// Domain creation not allowed
// ============================================================

assert(
  report.results.every(
    result =>
      result.requiresDedicatedAssessment
  ),
  "domain creation not allowed"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "P9E CANDIDATE FAMILY ASSESSMENT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Capabilities Evaluated: 3"
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
  "Family verification not performed."
);

console.log(
  "Falsification pending."
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