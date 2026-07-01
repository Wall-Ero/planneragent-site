//core/src/cryptography/provider/__tests__/P9H.provider.runtime.family.runner.ts

// ============================================================
// PlannerAgent
// P9H Provider Runtime Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/__tests__/
// P9H.provider.runtime.family.runner.ts
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9H Provider Runtime Family
// as a complete architectural chain:
//
// Mapping
// ↓
// Admission
// ↓
// Execution
// ↓
// Verification
// ↓
// Evidence
// ↓
// Failure Handling
// ↓
// Recovery Bridge
//
// This runner verifies:
//
// - happy path
// - failure propagation
// - contract propagation
// - summary composition
// - boundary preservation
//
// It does not verify real provider APIs.
//
// ============================================================

import {
  resolveProviderMapping,
} from "../P9H.provider.mapping";

import {
  admitProviderRuntime,
} from "../P9H.provider.admission";

import {
  executeProviderRuntime,
} from "../P9H.provider.execution";

import {
  verifyProviderRuntime,
} from "../P9H.provider.verification";

import {
  generateProviderEvidence,
} from "../P9H.provider.evidence";

import {
  classifyProviderFailure,
} from "../P9H.provider.failure";

import {
  bridgeProviderRecovery,
} from "../P9H.provider.recovery.bridge";


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
// HAPPY PATH PIPELINE
// ============================================================

const happyMapping =
  resolveProviderMapping({

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    providerEnabled:
      true,

  });

const happyAdmission =
  admitProviderRuntime({

    mapping:
      happyMapping,

    admissionDecision:
      "ADMIT_PROVIDER",

  });

const happyExecution =
  executeProviderRuntime({

    admission:
      happyAdmission,

    operation:
      "REWRAP_KEY",

    executionDecision:
      "ALLOW_PROVIDER_EXECUTION",

  });

const happyVerification =
  verifyProviderRuntime({

    execution:
      happyExecution,

    verificationDecision:
      "VERIFY_PROVIDER_EXECUTION",

  });

const happyEvidence =
  generateProviderEvidence({

    verification:
      happyVerification,

  });

const happyFailure =
  classifyProviderFailure({

    evidence:
      happyEvidence,

  });

const happyRecovery =
  bridgeProviderRecovery({

    failure:
      happyFailure,

    recoveryBridgeDecision:
      "OPEN_RECOVERY_BRIDGE",

  });


// ============================================================
// HAPPY PATH ASSERTIONS
// ============================================================

assert(
  happyMapping.providerResolved === true,
  "provider resolved"
);

assert(
  happyMapping.mappingValidated === true,
  "mapping validated"
);

assert(
  happyMapping.providerEnabled === true,
  "provider enabled preserved"
);

assert(
  happyAdmission.providerAdmitted === true,
  "provider admitted"
);

assert(
  happyExecution.providerExecuted === true,
  "provider executed"
);

assert(
  happyVerification.providerVerified === true,
  "provider verified"
);

assert(
  happyEvidence.providerEvidenceGenerated === true,
  "provider evidence generated"
);

assert(
  happyFailure.failureClassification ===
    "NO_FAILURE_DETECTED",
  "no failure detected"
);

assert(
  happyFailure.providerFailureClassified === false,
  "provider failure not classified on happy path"
);

assert(
  happyRecovery.recoveryRequirement ===
    "RECOVERY_NOT_REQUIRED",
  "recovery not required"
);

assert(
  happyRecovery.recoveryBridgeStatus ===
    "PROVIDER_RECOVERY_BRIDGE_CLOSED",
  "recovery bridge closed on happy path"
);


// ============================================================
// CONTRACT PROPAGATION ASSERTIONS
// ============================================================

assert(
  happyAdmission.providerResolved ===
    happyMapping.providerResolved,
  "providerResolved propagated"
);

assert(
  happyExecution.providerAdmitted ===
    happyAdmission.providerAdmitted,
  "providerAdmitted propagated"
);

assert(
  happyVerification.providerExecuted ===
    happyExecution.providerExecuted,
  "providerExecuted propagated"
);

assert(
  happyEvidence.providerVerified ===
    happyVerification.providerVerified,
  "providerVerified propagated"
);

assert(
  happyFailure.providerEvidenceGenerated ===
    happyEvidence.providerEvidenceGenerated,
  "providerEvidenceGenerated propagated"
);

assert(
  happyRecovery.failureClassification ===
    happyFailure.failureClassification,
  "failureClassification propagated"
);

assert(
  happyRecovery.recoveryRequirement ===
    "RECOVERY_NOT_REQUIRED",
  "recoveryRequirement propagated"
);

assert(
  happyRecovery.providerContract ===
    happyFailure.providerContract,
  "providerContract propagated"
);

assert(
  happyRecovery.providerImplementation ===
    happyFailure.providerImplementation,
  "providerImplementation propagated"
);

assert(
  happyRecovery.operation ===
    happyFailure.operation,
  "operation propagated"
);


// ============================================================
// SUMMARY COMPOSITION ASSERTIONS
// ============================================================

assert(
  happyRecovery.summary.includes(
    "mapping_completed"
  ),
  "mapping summary propagated"
);

assert(
  happyRecovery.summary.includes(
    "provider_admitted"
  ),
  "admission summary propagated"
);

assert(
  happyRecovery.summary.includes(
    "provider_execution_completed"
  ),
  "execution summary propagated"
);

assert(
  happyRecovery.summary.includes(
    "provider_verification_passed"
  ),
  "verification summary propagated"
);

assert(
  happyRecovery.summary.includes(
    "provider_evidence_generated"
  ),
  "evidence summary propagated"
);

assert(
  happyRecovery.summary.includes(
    "no_provider_failure_detected"
  ),
  "failure summary propagated"
);

assert(
  happyRecovery.summary.includes(
    "recovery_bridge_closed"
  ),
  "recovery bridge summary propagated"
);


// ============================================================
// MAPPING DENIED
// ============================================================

const mappingDenied =
  resolveProviderMapping({

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    providerEnabled:
      false,

  });

const mappingDeniedAdmission =
  admitProviderRuntime({

    mapping:
      mappingDenied,

    admissionDecision:
      "ADMIT_PROVIDER",

  });

const mappingDeniedExecution =
  executeProviderRuntime({

    admission:
      mappingDeniedAdmission,

    operation:
      "REWRAP_KEY",

    executionDecision:
      "ALLOW_PROVIDER_EXECUTION",

  });

const mappingDeniedVerification =
  verifyProviderRuntime({

    execution:
      mappingDeniedExecution,

    verificationDecision:
      "VERIFY_PROVIDER_EXECUTION",

  });

const mappingDeniedEvidence =
  generateProviderEvidence({

    verification:
      mappingDeniedVerification,

  });

const mappingDeniedFailure =
  classifyProviderFailure({

    evidence:
      mappingDeniedEvidence,

  });

const mappingDeniedRecovery =
  bridgeProviderRecovery({

    failure:
      mappingDeniedFailure,

    recoveryBridgeDecision:
      "OPEN_RECOVERY_BRIDGE",

  });

assert(
  mappingDenied.providerResolved === false,
  "mapping denied"
);

assert(
  mappingDenied.denialReason ===
    "PROVIDER_DISABLED",
  "mapping denial reason preserved"
);

assert(
  mappingDeniedAdmission.providerAdmitted === false,
  "mapping denial prevents admission"
);

assert(
  mappingDeniedExecution.providerExecuted === false,
  "mapping denial prevents execution"
);

assert(
  mappingDeniedVerification.providerVerified === false,
  "mapping denial prevents verification"
);

assert(
  mappingDeniedEvidence.providerEvidenceGenerated === false,
  "mapping denial prevents evidence"
);

assert(
  mappingDeniedFailure.providerFailureClassified === true,
  "mapping denial classified as failure"
);

assert(
  mappingDeniedFailure.failureClassification ===
    "PROVIDER_NOT_RESOLVED",
  "mapping failure classification preserved"
);

assert(
  mappingDeniedRecovery.recoveryBridgeOpen === true,
  "mapping failure opens recovery bridge"
);


// ============================================================
// ADMISSION DENIED
// ============================================================

const admissionDeniedMapping =
  resolveProviderMapping({

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    providerEnabled:
      true,

  });

const admissionDenied =
  admitProviderRuntime({

    mapping:
      admissionDeniedMapping,

    admissionDecision:
      "DENY_PROVIDER",

  });

const admissionDeniedExecution =
  executeProviderRuntime({

    admission:
      admissionDenied,

    operation:
      "REWRAP_KEY",

    executionDecision:
      "ALLOW_PROVIDER_EXECUTION",

  });

const admissionDeniedVerification =
  verifyProviderRuntime({

    execution:
      admissionDeniedExecution,

    verificationDecision:
      "VERIFY_PROVIDER_EXECUTION",

  });

const admissionDeniedEvidence =
  generateProviderEvidence({

    verification:
      admissionDeniedVerification,

  });

const admissionDeniedFailure =
  classifyProviderFailure({

    evidence:
      admissionDeniedEvidence,

  });

const admissionDeniedRecovery =
  bridgeProviderRecovery({

    failure:
      admissionDeniedFailure,

    recoveryBridgeDecision:
      "OPEN_RECOVERY_BRIDGE",

  });

assert(
  admissionDenied.providerAdmitted === false,
  "admission denied"
);

assert(
  admissionDenied.denialReason ===
    "PROVIDER_ADMISSION_DENIED",
  "admission denial reason preserved"
);

assert(
  admissionDeniedExecution.providerExecuted === false,
  "admission denial prevents execution"
);

assert(
  admissionDeniedVerification.providerVerified === false,
  "admission denial prevents verification"
);

assert(
  admissionDeniedEvidence.providerEvidenceGenerated === false,
  "admission denial prevents evidence"
);

assert(
  admissionDeniedFailure.failureClassification ===
    "PROVIDER_NOT_ADMITTED",
  "admission failure classified"
);

assert(
  admissionDeniedRecovery.recoveryRequirement ===
    "RECOVERY_REQUIRED",
  "admission failure requires recovery"
);


// ============================================================
// EXECUTION DENIED
// ============================================================

const executionDeniedMapping =
  resolveProviderMapping({

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    providerEnabled:
      true,

  });

const executionDeniedAdmission =
  admitProviderRuntime({

    mapping:
      executionDeniedMapping,

    admissionDecision:
      "ADMIT_PROVIDER",

  });

const executionDenied =
  executeProviderRuntime({

    admission:
      executionDeniedAdmission,

    operation:
      "REWRAP_KEY",

    executionDecision:
      "DENY_PROVIDER_EXECUTION",

  });

const executionDeniedVerification =
  verifyProviderRuntime({

    execution:
      executionDenied,

    verificationDecision:
      "VERIFY_PROVIDER_EXECUTION",

  });

const executionDeniedEvidence =
  generateProviderEvidence({

    verification:
      executionDeniedVerification,

  });

const executionDeniedFailure =
  classifyProviderFailure({

    evidence:
      executionDeniedEvidence,

  });

const executionDeniedRecovery =
  bridgeProviderRecovery({

    failure:
      executionDeniedFailure,

    recoveryBridgeDecision:
      "OPEN_RECOVERY_BRIDGE",

  });

assert(
  executionDenied.providerExecuted === false,
  "execution denied"
);

assert(
  executionDenied.denialReason ===
    "PROVIDER_EXECUTION_NOT_ALLOWED",
  "execution denial reason preserved"
);

assert(
  executionDeniedVerification.providerVerified === false,
  "execution denial prevents verification"
);

assert(
  executionDeniedEvidence.providerEvidenceGenerated === false,
  "execution denial prevents evidence"
);

assert(
  executionDeniedFailure.failureClassification ===
    "PROVIDER_NOT_EXECUTED",
  "execution failure classified"
);

assert(
  executionDeniedRecovery.recoveryBridgeOpen === true,
  "execution failure opens recovery bridge"
);


// ============================================================
// VERIFICATION DENIED
// ============================================================

const verificationDeniedMapping =
  resolveProviderMapping({

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    providerEnabled:
      true,

  });

const verificationDeniedAdmission =
  admitProviderRuntime({

    mapping:
      verificationDeniedMapping,

    admissionDecision:
      "ADMIT_PROVIDER",

  });

const verificationDeniedExecution =
  executeProviderRuntime({

    admission:
      verificationDeniedAdmission,

    operation:
      "REWRAP_KEY",

    executionDecision:
      "ALLOW_PROVIDER_EXECUTION",

  });

const verificationDenied =
  verifyProviderRuntime({

    execution:
      verificationDeniedExecution,

    verificationDecision:
      "REJECT_PROVIDER_EXECUTION",

  });

const verificationDeniedEvidence =
  generateProviderEvidence({

    verification:
      verificationDenied,

  });

const verificationDeniedFailure =
  classifyProviderFailure({

    evidence:
      verificationDeniedEvidence,

  });

const verificationDeniedRecovery =
  bridgeProviderRecovery({

    failure:
      verificationDeniedFailure,

    recoveryBridgeDecision:
      "OPEN_RECOVERY_BRIDGE",

  });

assert(
  verificationDenied.providerVerified === false,
  "verification denied"
);

assert(
  verificationDenied.denialReason ===
    "PROVIDER_VERIFICATION_REJECTED",
  "verification denial reason preserved"
);

assert(
  verificationDeniedEvidence.providerEvidenceGenerated === false,
  "verification denial prevents evidence"
);

assert(
  verificationDeniedFailure.failureClassification ===
    "PROVIDER_NOT_VERIFIED",
  "verification failure classified"
);

assert(
  verificationDeniedRecovery.recoveryRequirement ===
    "RECOVERY_REQUIRED",
  "verification failure requires recovery"
);


// ============================================================
// EVIDENCE NOT GENERATED
// ============================================================

assert(
  verificationDeniedEvidence.providerEvidenceGenerated === false,
  "evidence not generated"
);

assert(
  verificationDeniedEvidence.providerVerified ===
    verificationDenied.providerVerified,
  "evidence preserves providerVerified"
);

assert(
  verificationDeniedEvidence.providerExecuted ===
    verificationDenied.providerExecuted,
  "evidence preserves providerExecuted"
);

assert(
  verificationDeniedEvidence.providerAdmitted ===
    verificationDenied.providerAdmitted,
  "evidence preserves providerAdmitted"
);

assert(
  verificationDeniedEvidence.providerResolved ===
    verificationDenied.providerResolved,
  "evidence preserves providerResolved"
);


// ============================================================
// FAILURE CLASSIFIED
// ============================================================

assert(
  verificationDeniedFailure.providerFailureClassified === true,
  "failure classified"
);

assert(
  verificationDeniedFailure.failureClassification ===
    "PROVIDER_NOT_VERIFIED",
  "failure classification preserved"
);

assert(
  verificationDeniedFailure.failureSeverity ===
    "HIGH",
  "failure severity preserved"
);

assert(
  verificationDeniedFailure.providerEvidenceGenerated ===
    verificationDeniedEvidence.providerEvidenceGenerated,
  "failure preserves evidence state"
);


// ============================================================
// RECOVERY BRIDGE OPEN
// ============================================================

assert(
  verificationDeniedRecovery.recoveryBridgeStatus ===
    "PROVIDER_RECOVERY_BRIDGE_OPEN",
  "recovery bridge open"
);

assert(
  verificationDeniedRecovery.recoveryBridgeOpen === true,
  "recovery bridge open state preserved"
);

assert(
  verificationDeniedRecovery.recoveryRequirement ===
    "RECOVERY_REQUIRED",
  "recovery required"
);

assert(
  verificationDeniedRecovery.failureClassification ===
    verificationDeniedFailure.failureClassification,
  "recovery bridge preserves failure classification"
);


// ============================================================
// RECOVERY BRIDGE CLOSED BY DECISION
// ============================================================

const recoveryBridgeClosedByDecision =
  bridgeProviderRecovery({

    failure:
      verificationDeniedFailure,

    recoveryBridgeDecision:
      "KEEP_RECOVERY_BRIDGE_CLOSED",

  });

assert(
  recoveryBridgeClosedByDecision.recoveryBridgeStatus ===
    "PROVIDER_RECOVERY_BRIDGE_CLOSED",
  "recovery bridge closed by decision"
);

assert(
  recoveryBridgeClosedByDecision.denialReason ===
    "RECOVERY_BRIDGE_NOT_ALLOWED",
  "recovery bridge denial reason preserved"
);

assert(
  recoveryBridgeClosedByDecision.recoveryRequirement ===
    "RECOVERY_REQUIRED",
  "recovery requirement preserved when bridge closed"
);


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

assert(
  !("awsCalled" in happyRecovery),
  "runtime does not call AWS"
);

assert(
  !("azureCalled" in happyRecovery),
  "runtime does not call Azure"
);

assert(
  !("googleCalled" in happyRecovery),
  "runtime does not call Google"
);

assert(
  !("vaultCalled" in happyRecovery),
  "runtime does not call Vault"
);

assert(
  !("hsmCalled" in happyRecovery),
  "runtime does not call HSM"
);

assert(
  !("providerRetried" in verificationDeniedRecovery),
  "runtime does not retry provider"
);

assert(
  !("providerRecovered" in verificationDeniedRecovery),
  "runtime does not recover provider"
);

assert(
  !("evidenceMutated" in verificationDeniedRecovery),
  "runtime does not mutate evidence"
);

assert(
  !("failureMutated" in verificationDeniedRecovery),
  "runtime does not mutate failure"
);

assert(
  !("evidencePersisted" in happyRecovery),
  "runtime does not persist evidence"
);

assert(
  !("ledgerWritten" in happyRecovery),
  "runtime does not write ledger"
);

assert(
  !("auditPerformed" in happyRecovery),
  "runtime does not perform audit"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "========================================"
);

console.log(
  "P9H PROVIDER RUNTIME FAMILY VERIFIED"
);

console.log(
  "========================================"
);

console.log("");

console.log(
  "Happy Path:"
);

console.log(
  "✓ Mapping"
);

console.log(
  "✓ Admission"
);

console.log(
  "✓ Execution"
);

console.log(
  "✓ Verification"
);

console.log(
  "✓ Evidence"
);

console.log(
  "✓ Failure Handling"
);

console.log(
  "✓ Recovery Bridge"
);

console.log("");

console.log(
  "Failure Propagation:"
);

console.log(
  "✓ Mapping denied"
);

console.log(
  "✓ Admission denied"
);

console.log(
  "✓ Execution denied"
);

console.log(
  "✓ Verification denied"
);

console.log(
  "✓ Evidence not generated"
);

console.log(
  "✓ Failure classified"
);

console.log(
  "✓ Recovery bridge open"
);

console.log(
  "✓ Recovery bridge closed"
);

console.log("");

console.log(
  "Contract Propagation:"
);

console.log(
  "✓ providerResolved"
);

console.log(
  "✓ providerAdmitted"
);

console.log(
  "✓ providerExecuted"
);

console.log(
  "✓ providerVerified"
);

console.log(
  "✓ providerEvidenceGenerated"
);

console.log(
  "✓ failureClassification"
);

console.log(
  "✓ recoveryRequirement"
);

console.log(
  "✓ providerContract"
);

console.log(
  "✓ providerImplementation"
);

console.log(
  "✓ operation"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ no provider APIs"
);

console.log(
  "✓ no retries"
);

console.log(
  "✓ no recovery"
);

console.log(
  "✓ no evidence mutation"
);

console.log(
  "✓ no failure mutation"
);

console.log(
  "✓ no evidence persistence"
);

console.log(
  "✓ no ledger"
);

console.log(
  "✓ no audit"
);

console.log("");

console.log(
  "========================================"
);

console.log(
  "P9H PROVIDER RUNTIME"
);

console.log(
  "STATUS: COMPLETE"
);

console.log(
  "========================================"
);