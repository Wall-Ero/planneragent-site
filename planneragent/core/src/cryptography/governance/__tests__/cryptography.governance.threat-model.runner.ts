// ============================================================
// PlannerAgent — Cryptography Governance Threat Model Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/cryptography.governance.threat-model.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify that the canonical cryptographic
// threat model remains internally coherent.
//
// DOES NOT:
//
// - perform encryption
// - create keys
// - call KMS
// - access secrets
// - execute cryptographic operations
//
// DOES:
//
// - verify threat coverage
// - verify governance requirements
// - verify authority protection coverage
// - verify fail-closed requirements
// - verify evidence requirements
// - verify ledger requirements
//
// ============================================================

import {
  CRYPTOGRAPHIC_THREAT_MODEL,
} from "../../cryptography.governance.threat-model";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition: boolean,
  label: string,
): void {

  if (!condition) {

    throw new Error(
      `FAILED: ${label}`,
    );

  }

  console.log(
    `✅ ${label}`,
  );

}

// ============================================================
// HEADER
// ============================================================

console.log("");
console.log("================================");
console.log("CRYPTOGRAPHY GOVERNANCE REVIEW");
console.log("================================");
console.log("");

// ============================================================
// TEST 1
// THREAT COUNT
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.length === 7,
  "all canonical threats defined",
);

// ============================================================
// TEST 2
// FAIL CLOSED
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.every(
    threat =>
      threat.failClosedRequired,
  ),
  "all threats require fail-closed protection",
);

// ============================================================
// TEST 3
// EVIDENCE
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.every(
    threat =>
      threat.governanceEvidenceRequired,
  ),
  "all threats require governance evidence",
);

// ============================================================
// TEST 4
// LEDGER
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.every(
    threat =>
      threat.ledgerRecordRequired,
  ),
  "all threats require governance ledger preservation",
);

// ============================================================
// TEST 5
// CROSS TENANT
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.scenario ===
      "CROSS_TENANT_DECRYPTION",
  ),
  "cross tenant decryption threat modeled",
);

// ============================================================
// TEST 6
// KMS COMPROMISE
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.scenario ===
      "COMPROMISED_KMS",
  ),
  "compromised kms threat modeled",
);

// ============================================================
// TEST 7
// AUTHORITY ESCALATION
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.scenario ===
      "KEY_AUTHORITY_ESCALATION",
  ),
  "key authority escalation threat modeled",
);

// ============================================================
// TEST 8
// POLICY BYPASS
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.scenario ===
      "CRYPTOGRAPHIC_POLICY_BYPASS",
  ),
  "cryptographic policy bypass threat modeled",
);

// ============================================================
// TEST 9
// AUTHORITY GRAPH PROTECTED
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.protectedAssets.includes(
        "AUTHORITY_GRAPH",
      ),
  ),
  "authority graph protected",
);

// ============================================================
// TEST 10
// CHARTER PROTECTED
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.protectedAssets.includes(
        "CHARTER",
      ),
  ),
  "charter protected",
);

// ============================================================
// TEST 11
// GOVERNANCE BYPASS COVERAGE
// ============================================================

assert(
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.scenario ===
      "CRYPTOGRAPHIC_POLICY_BYPASS" &&
      threat.authorityRequirements.includes(
        "HUMAN_APPROVAL_REQUIRED",
      ),
  ),
  "governance bypass requires authority review",
);

// ============================================================
// TEST 12
// AUTHORITY PROTECTION PRINCIPLE
// ============================================================

const authorityProtected =
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.protectedAssets.includes(
        "AUTHORITY_GRAPH",
      ),
  ) &&
  CRYPTOGRAPHIC_THREAT_MODEL.some(
    threat =>
      threat.protectedAssets.includes(
        "CHARTER",
      ),
  );

assert(
  authorityProtected,
  "authority protection principle preserved",
);

// ============================================================
// FOOTER
// ============================================================

console.log("");
console.log("================================");
console.log("CRYPTOGRAPHY THREAT MODEL VERIFIED");
console.log("================================");
console.log("");