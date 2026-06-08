//core/src/cryptography/mechanisms/__tests__/cryptography.verification.runner.ts

// ============================================================
// PlannerAgent
// Cryptographic Verification Runner
// ============================================================

import {
  verifyCryptographicExecution,
} from "../cryptography.verification";


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
// Verification succeeds
// ============================================================

const validResult =
  verifyCryptographicExecution({

    executed:
      true,

    operation:
      "ENCRYPT",

    output:
      new Uint8Array([1, 2, 3]),

  });

assert(
  validResult.verified === true,
  "verification succeeds"
);


// ============================================================
// TEST 2
// Execution verified
// ============================================================

assert(
  validResult.executionVerified === true,
  "execution verified"
);


// ============================================================
// TEST 3
// Output verified
// ============================================================

assert(
  validResult.outputVerified === true,
  "output verified"
);


// ============================================================
// TEST 4
// Verification summary preserved
// ============================================================

assert(
  validResult.summary.includes(
    "verification_completed"
  ),
  "verification summary preserved"
);


// ============================================================
// TEST 5
// Execution not completed denied
// ============================================================

const executionFailure =
  verifyCryptographicExecution({

    executed:
      false,

    operation:
      "ENCRYPT",

    output:
      new Uint8Array([1, 2, 3]),

  });

assert(
  executionFailure.verified === false,
  "execution not completed denied"
);


// ============================================================
// TEST 6
// Execution denial reason preserved
// ============================================================

assert(
  executionFailure.denialReason ===
    "EXECUTION_NOT_COMPLETED",
  "execution denial reason preserved"
);


// ============================================================
// TEST 7
// Output missing denied
// ============================================================

const outputFailure =
  verifyCryptographicExecution({

    executed:
      true,

    operation:
      "ENCRYPT",

    output:
      new Uint8Array(),

  });

assert(
  outputFailure.verified === false,
  "output missing denied"
);


// ============================================================
// TEST 8
// Output denial reason preserved
// ============================================================

assert(
  outputFailure.denialReason ===
    "OUTPUT_MISSING",
  "output denial reason preserved"
);


// ============================================================
// TEST 9
// Verification never authorizes
// ============================================================

assert(
  !("executionAuthorized" in validResult),
  "verification never authorizes"
);


// ============================================================
// TEST 10
// Verification never executes
// ============================================================

assert(
  !("executed" in validResult),
  "verification never executes"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "CRYPTOGRAPHIC VERIFICATION AUDIT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Verification Responsibilities:"
);

console.log(
  "✓ execution completion verification"
);

console.log(
  "✓ output presence verification"
);

console.log(
  "✓ execution result verification"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ never authorizes"
);

console.log(
  "✓ never executes"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "CRYPTOGRAPHIC VERIFICATION VERIFIED"
);

console.log(
  "================================"
);