//core/src/cryptography/__tests__/P9E.auditability.family.falsification.runner.ts

// ============================================================
// PlannerAgent
// P9E Auditability Family Falsification Runner
// ============================================================

import {
  falsifyAuditabilityFamily,
} from "../P9E.auditability.family.falsification";


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
  falsifyAuditabilityFamily({

    capability:
      "CRYPTOGRAPHIC_AUDITABILITY",

    existingFamilyTested:
      "GOVERNANCE_FAMILY",

    expressibleThroughExistingFamily:
      true,

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
  existingFamilySufficient.outcome ===
    "REUSE_EXISTING_FAMILY",
  "reuse existing family outcome selected"
);

assert(
  existingFamilySufficient.expressedThrough ===
    "GOVERNANCE_FAMILY",
  "governance family preserved"
);

assert(
  existingFamilySufficient.summary.includes(
    "auditability_absorbed_by_existing_family"
  ),
  "existing family summary preserved"
);


// ============================================================
// TEST 2
// Auditability family required
// ============================================================

const auditabilityFamilyRequired =
  falsifyAuditabilityFamily({

    capability:
      "CRYPTOGRAPHIC_AUDITABILITY",

    expressibleThroughExistingFamily:
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
  auditabilityFamilyRequired.outcome ===
    "AUDITABILITY_FAMILY_REQUIRED",
  "auditability family outcome selected"
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
  "AUDITABILITY FAMILY FALSIFICATION"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Falsification Paths:"
);

console.log(
  "✓ REUSE_EXISTING_FAMILY"
);

console.log(
  "✓ AUDITABILITY_FAMILY_REQUIRED"
);

console.log("");

console.log(
  "RESULT:"
);

console.log(
  "Falsification engine supports both outcomes."
);

console.log(
  "Auditability Family not yet verified."
);

console.log("");

console.log(
  "================================"
);

console.log(
  "FALSIFICATION ENGINE VERIFIED"
);

console.log(
  "================================"
);