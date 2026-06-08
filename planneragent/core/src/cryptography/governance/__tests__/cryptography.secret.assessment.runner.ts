// ============================================================
// PlannerAgent — Secret Governance Assessment Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.secret.assessment.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL VERIFICATION RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify:
//
// ✓ assessment execution
// ✓ candidate classification
// ✓ governance principle detection
// ✓ assessment outcome
// ✓ assessment summary preservation
//
// ============================================================

import {
  assessSecretGovernance,
  SECRET_ASSESSMENT_CANDIDATES,
} from "../cryptography.secret.assessment";


// ============================================================
// ASSERT
// ============================================================

function assert(
  condition: boolean,
  label: string
): void {

  if (!condition) {

    throw new Error(
      `❌ ${label}`
    );

  }

  console.log(
    `✅ ${label}`
  );

}


// ============================================================
// RUNNER
// ============================================================

function run(): void {

  const report =
    assessSecretGovernance();

  const results =
    report.results;


  // =========================================================
  // TEST 1
  // Assessment executed
  // =========================================================

  assert(
    results.length > 0,
    "assessment executed"
  );


  // =========================================================
  // TEST 2
  // All candidates classified
  // =========================================================

  assert(
    results.length ===
      SECRET_ASSESSMENT_CANDIDATES.length,
    "all candidates classified"
  );


  // =========================================================
  // TEST 3
  // Secret Exposure
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "SECRET_EXPOSURE" &&
        r.classification ===
          "LIFECYCLE_EVENT"
    ),
    "secret exposure classified"
  );


  // =========================================================
  // TEST 4
  // Secret Sharing
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "SECRET_SHARING" &&
        r.classification ===
          "GOVERNANCE_SCENARIO"
    ),
    "secret sharing classified"
  );


  // =========================================================
  // TEST 5
  // Secret Derivation
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "SECRET_DERIVATION" &&
        r.classification ===
          "GOVERNANCE_RELATIONSHIP"
    ),
    "secret derivation classified"
  );


  // =========================================================
  // TEST 6
  // Secret Consumption
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "SECRET_CONSUMPTION" &&
        r.classification ===
          "LIFECYCLE_EVENT"
    ),
    "secret consumption classified"
  );


  // =========================================================
  // TEST 7
  // Secret Scope
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "SECRET_SCOPE" &&
        r.classification ===
          "GOVERNANCE_RELATIONSHIP"
    ),
    "secret scope classified"
  );


  // =========================================================
  // TEST 8
  // Secret Delegation
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "SECRET_DELEGATION" &&
        r.classification ===
          "AUTHORITY_TRANSITION"
    ),
    "secret delegation classified"
  );


  // =========================================================
  // TEST 9
  // Shared Secret Ownership
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "SHARED_SECRET_OWNERSHIP" &&
        r.classification ===
          "GOVERNANCE_TOPOLOGY"
    ),
    "shared secret ownership classified"
  );


  // =========================================================
  // TEST 10
  // Emergency Secret Recovery
  // =========================================================

  assert(
    results.some(
      r =>
        r.candidateId ===
          "EMERGENCY_SECRET_RECOVERY" &&
        r.classification ===
          "LIFECYCLE_EVENT"
    ),
    "emergency secret recovery classified"
  );


  // =========================================================
  // TEST 11
  // No Governance Principles Identified
  // =========================================================

  assert(
    results.every(
      r =>
        !r.introducesNewGovernancePrinciple
    ),
    "no governance principles identified"
  );


  // =========================================================
  // TEST 12
  // Assessment Outcome
  // =========================================================

  assert(
    report.outcome ===
      "REUSE_EXISTING_GOVERNANCE_MODEL",
    "assessment outcome verified"
  );


  // =========================================================
  // TEST 13
  // Assessment Summary
  // =========================================================

  assert(
    report.summary.length > 0,
    "assessment summary preserved"
  );


  // =========================================================
  // AUDIT
  // =========================================================

  console.log("");

  console.log(
    "================================"
  );

  console.log(
    "SECRET GOVERNANCE ASSESSMENT AUDIT"
  );

  console.log(
    "================================"
  );

  console.log("");

  console.log(
    `Candidates Evaluated: ${results.length}`
  );

  console.log(
    "Governance Primitives Identified: 0"
  );

  console.log("");

  console.log(
    `Outcome: ${report.outcome}`
  );

  console.log("");

  console.log(
    "================================"
  );

  console.log(
    "SECRET GOVERNANCE ASSESSMENT VERIFIED"
  );

  console.log(
    "================================"
  );

}


// ============================================================
// EXECUTION
// ============================================================

run();