//core/src/cryptography/__tests__/P9E.candidate.family.falsification.runner.ts

// ============================================================
// PlannerAgent
// P9E Candidate Family Falsification Runner
// ============================================================

import {
  falsifyCandidateFamily,
} from "../P9E.candidate.family.falsification";


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
// KEY_ROTATION absorbed by Governance
// ============================================================

const keyRotationAbsorbed =
  falsifyCandidateFamily({

    capability:
      "KEY_ROTATION",

    attemptedFamily:
      "GOVERNANCE_FAMILY",

    absorptionSucceeded:
      true,

    rationale: [
      "rotation_can_be_expressed_through_governance",
    ],

  });

assert(
  keyRotationAbsorbed.classification ===
    "ABSORBED_BY_EXISTING_FAMILY",
  "key rotation absorbed by governance"
);

assert(
  keyRotationAbsorbed.absorbedBy ===
    "GOVERNANCE_FAMILY",
  "governance absorption preserved"
);


// ============================================================
// TEST 2
// SECRET_LIFECYCLE absorbed by Governance
// ============================================================

const secretLifecycleAbsorbed =
  falsifyCandidateFamily({

    capability:
      "SECRET_LIFECYCLE",

    attemptedFamily:
      "GOVERNANCE_FAMILY",

    absorptionSucceeded:
      true,

    rationale: [
      "secret_lifecycle_can_be_expressed_through_governance",
    ],

  });

assert(
  secretLifecycleAbsorbed.classification ===
    "ABSORBED_BY_EXISTING_FAMILY",
  "secret lifecycle absorbed by governance"
);

assert(
  secretLifecycleAbsorbed.absorbedBy ===
    "GOVERNANCE_FAMILY",
  "secret lifecycle absorption preserved"
);


// ============================================================
// TEST 3
// AUDITABILITY survives Governance
// ============================================================

const auditabilitySurvives =
  falsifyCandidateFamily({

    capability:
      "CRYPTOGRAPHIC_AUDITABILITY",

    attemptedFamily:
      "GOVERNANCE_FAMILY",

    absorptionSucceeded:
      false,

    rationale: [
      "auditability_not_fully_expressible_through_governance",
    ],

  });

assert(
  auditabilitySurvives.classification ===
    "CANDIDATE_SURVIVES",
  "cryptographic auditability survives governance"
);

assert(
  auditabilitySurvives.absorbedBy ===
    undefined,
  "surviving candidate not absorbed"
);


// ============================================================
// TEST 4
// Absorption summary preserved
// ============================================================

assert(
  keyRotationAbsorbed.summary.includes(
    "candidate_absorbed"
  ),
  "absorption summary preserved"
);


// ============================================================
// TEST 5
// Survival summary preserved
// ============================================================

assert(
  auditabilitySurvives.summary.includes(
    "candidate_survives"
  ),
  "survival summary preserved"
);


// ============================================================
// TEST 6
// Attempted family preserved
// ============================================================

assert(
  auditabilitySurvives.attemptedFamily ===
    "GOVERNANCE_FAMILY",
  "attempted family preserved"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "P9E CANDIDATE FAMILY FALSIFICATION"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Absorbed:"
);

console.log(
  "✓ KEY_ROTATION → GOVERNANCE_FAMILY"
);

console.log(
  "✓ SECRET_LIFECYCLE → GOVERNANCE_FAMILY"
);

console.log("");

console.log(
  "Survived:"
);

console.log(
  "✓ CRYPTOGRAPHIC_AUDITABILITY"
);

console.log("");

console.log(
  "RESULT:"
);

console.log(
  "Lifecycle candidate absorbed."
);

console.log(
  "Auditability candidate survives."
);

console.log("");

console.log(
  "================================"
);

console.log(
  "FALSIFICATION VERIFIED"
);

console.log(
  "================================"
);