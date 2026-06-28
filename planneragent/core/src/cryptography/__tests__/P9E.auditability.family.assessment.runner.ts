//core/src/cryptography/__tests__/P9E.auditability.family.assessment.runner.ts

// ============================================================
// PlannerAgent
// P9E Auditability Family Assessment Runner
// ============================================================

import {
  assessAuditabilityFamily,
} from "../P9E.auditability.family.assessment";


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
  assessAuditabilityFamily();


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
// Auditability capability evaluated
// ============================================================

assert(
  report.results.length === 1,
  "auditability capability evaluated"
);


// ============================================================
// TEST 3
// Auditability under assessment
// ============================================================

const auditability =
  report.results[0];

assert(
  auditability.classification ===
    "UNDER_ASSESSMENT",
  "auditability under assessment"
);


// ============================================================
// TEST 4
// Auditability candidate survived falsification
// ============================================================

assert(
  auditability.summary.includes(
    "auditability_candidate_survived_falsification"
  ),
  "auditability candidate survived falsification"
);


// ============================================================
// TEST 5
// No existing family selected
// ============================================================

assert(
  auditability.expressedThrough ===
    undefined,
  "no existing family selected"
);


// ============================================================
// TEST 6
// Assessment pending outcome selected
// ============================================================

assert(
  report.outcome ===
    "ASSESSMENT_PENDING",
  "assessment pending outcome selected"
);


// ============================================================
// TEST 7
// Family verification not performed
// ============================================================

assert(
  report.summary.includes(
    "family_verification_not_performed"
  ),
  "family verification not performed"
);


// ============================================================
// TEST 8
// Auditability family not verified
// ============================================================

assert(
  auditability.classification !==
    "REQUIRES_AUDITABILITY_FAMILY",
  "auditability family not verified"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "AUDITABILITY FAMILY ASSESSMENT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Capability Evaluated: 1"
);

console.log("");

console.log(
  "UNDER_ASSESSMENT:"
);

console.log(
  "✓ CRYPTOGRAPHIC_AUDITABILITY"
);

console.log("");

console.log(
  "Existing Family Selected:"
);

console.log(
  "0"
);

console.log("");

console.log(
  "Outcome:"
);

console.log(
  "ASSESSMENT_PENDING"
);

console.log("");

console.log(
  "RESULT:"
);

console.log(
  "Auditability candidate survived falsification."
);

console.log(
  "Family verification not performed."
);

console.log(
  "Assessment remains pending."
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