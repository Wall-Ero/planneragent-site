//core/src/cryptography/__tests__/P9E.auditability.family.verification.runner.ts

// ============================================================
// PlannerAgent
// P9E Auditability Family Verification Runner
// ============================================================

import {
  verifyAuditabilityFamily,
} from "../P9E.auditability.family.verification";


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
// TEST 1
// Existing family sufficient
// ============================================================

const existingFamilySufficient =
  verifyAuditabilityFamily({

    capability:
      "CRYPTOGRAPHIC_AUDITABILITY",

    verificationSucceeded:
      true,

    existingFamily:
      "GOVERNANCE_FAMILY",

    rationale: [
      "auditability_expressible_through_governance",
    ],

  });

assert(
  existingFamilySufficient.classification ===
    "EXPRESSIBLE_THROUGH_EXISTING_FAMILY",
  "existing family sufficient"
);

assert(
  existingFamilySufficient.expressedThrough ===
    "GOVERNANCE_FAMILY",
  "governance family preserved"
);

assert(
  existingFamilySufficient.summary.includes(
    "existing_family_sufficient"
  ),
  "existing family summary preserved"
);


// ============================================================
// TEST 2
// Auditability family required
// ============================================================

const auditabilityFamilyRequired =
  verifyAuditabilityFamily({

    capability:
      "CRYPTOGRAPHIC_AUDITABILITY",

    verificationSucceeded:
      false,

    rationale: [
      "existing_families_insufficient",
    ],

  });

assert(
  auditabilityFamilyRequired.classification ===
    "REQUIRES_AUDITABILITY_FAMILY",
  "auditability family required"
);

assert(
  auditabilityFamilyRequired.expressedThrough ===
    undefined,
  "no existing family selected"
);

assert(
  auditabilityFamilyRequired.summary.includes(
    "auditability_family_required"
  ),
  "auditability family summary preserved"
);


// ============================================================
// TEST 3
// Capability preserved
// ============================================================

assert(
  auditabilityFamilyRequired.capability ===
    "CRYPTOGRAPHIC_AUDITABILITY",
  "capability preserved"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "AUDITABILITY FAMILY VERIFICATION"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Verification Paths:"
);

console.log(
  "✓ EXPRESSIBLE_THROUGH_EXISTING_FAMILY"
);

console.log(
  "✓ REQUIRES_AUDITABILITY_FAMILY"
);

console.log("");

console.log(
  "RESULT:"
);

console.log(
  "Verification engine supports both outcomes."
);

console.log(
  "Family existence not yet determined."
);

console.log("");

console.log(
  "================================"
);

console.log(
  "VERIFICATION ENGINE VERIFIED"
);

console.log(
  "================================"
);