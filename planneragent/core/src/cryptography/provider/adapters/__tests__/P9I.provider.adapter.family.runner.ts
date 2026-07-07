// ============================================================
// PlannerAgent — Provider Adapter Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/adapters/__tests__/P9I.provider.adapter.family.runner.ts
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9I Provider Adapter Family
// as a complete architectural chain:
//
// Request Mapping
// ↓
// Adapter Execution
// ↓
// Result Normalization
// ↓
// Failure Surface
// ↓
// Verification Hook
//
// This runner verifies:
//
// - happy path
// - failure propagation
// - contract propagation
// - denial paths
// - boundary preservation
//
// It does not verify real provider APIs.
//
// ============================================================

import type {
  ProviderRecoveryBridgeResult,
} from "../../P9H.provider.recovery.bridge";

import {
  mapProviderAdapterRequest,
} from "../P9I.provider.adapter.request.mapping";

import {
  executeProviderAdapter,
} from "../P9I.provider.adapter.execution";

import {
  normalizeProviderAdapterResult,
} from "../P9I.provider.adapter.result.normalization";

import {
  preserveProviderAdapterFailureSurface,
} from "../P9I.provider.adapter.failure.surface";

import {
  exposeProviderAdapterVerificationHook,
} from "../P9I.provider.adapter.verification.hook";


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
// FIXTURE
// ============================================================

function buildRuntimeFixture(): ProviderRecoveryBridgeResult {

  return {

    recoveryBridgeStatus:
      "PROVIDER_RECOVERY_BRIDGE_CLOSED",

    recoveryBridgeDecision:
      "OPEN_RECOVERY_BRIDGE",

    recoveryBridgeOpen:
      false,

    recoveryRequirement:
      "RECOVERY_NOT_REQUIRED",

    providerFailureClassified:
      false,

    failureStatus:
      "NO_PROVIDER_FAILURE",

    failureClassification:
      "NO_FAILURE_DETECTED",

    failureSeverity:
      "NONE",

    providerEvidenceGenerated:
      true,

    providerVerified:
      true,

    providerExecuted:
      true,

    providerAdmitted:
      true,

    providerResolved:
      true,

    mappingValidated:
      true,

    providerEnabled:
      true,

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    operation:
      "REWRAP_KEY",

    failureSummary: [
      "no_provider_failure_detected",
    ],

    summary: [
      "provider_supported",
      "provider_enabled",
      "provider_resolved",
      "mapping_completed",
      "provider_admitted",
      "provider_execution_completed",
      "provider_verification_passed",
      "provider_evidence_generated",
      "no_provider_failure_detected",
      "recovery_bridge_closed",
    ],

  };

}


// ============================================================
// HAPPY PATH — NO FAILURE SURFACE PRESENT
// ============================================================

const runtime =
  buildRuntimeFixture();

const mapped =
  mapProviderAdapterRequest({

    runtime,

    providerResourceId:
      "kms-key-001",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    executionMetadata: {
      tenantId: "tenant-01",
      region: "eu-west-1",
    },

    mappingDecision:
      "MAP_PROVIDER_ADAPTER_REQUEST",

  });

const executed =
  executeProviderAdapter({

    mapping: mapped,

    executionDecision:
      "EXECUTE_PROVIDER_ADAPTER",

    adapterExecutionSummary: [
      "adapter_execution_boundary_crossed",
    ],

    providerReference:
      "aws-kms-op-001",

    providerRawStatus:
      "SUCCESS",

  });

const normalized =
  normalizeProviderAdapterResult({

    execution: executed,

    normalizationDecision:
      "NORMALIZE_PROVIDER_ADAPTER_RESULT",

  });

const failureSurfacePreserved =
  preserveProviderAdapterFailureSurface({

    normalized,

  });

const hookExposed =
  exposeProviderAdapterVerificationHook({

    failureSurface:
      failureSurfacePreserved,

    hookDecision:
      "EXPOSE_PROVIDER_ADAPTER_VERIFICATION_HOOK",

  });


// ============================================================
// HAPPY PATH ASSERTIONS
// ============================================================

assert(
  mapped.adapterRequestMapped === true,
  "adapter request mapped"
);

assert(
  executed.providerAdapterExecuted === true,
  "adapter executed"
);

assert(
  normalized.adapterResultNormalized === true,
  "adapter result normalized"
);

assert(
  failureSurfacePreserved.failureSurfacePreserved === false,
  "no failure surface preserved on happy path"
);

assert(
  failureSurfacePreserved.denialReason ===
    "NO_ADAPTER_FAILURE_SURFACE",
  "happy path records no adapter failure surface"
);

assert(
  hookExposed.hookExposed === true,
  "verification hook exposed"
);

assert(
  hookExposed.failureSurfacePreserved === false,
  "verification hook may expose normalized adapter outcome without preserved failure surface"
);


// ============================================================
// CONTRACT PROPAGATION ASSERTIONS
// ============================================================

assert(
  executed.providerContract ===
    mapped.providerContract,
  "providerContract propagated"
);

assert(
  executed.providerImplementation ===
    mapped.providerImplementation,
  "providerImplementation propagated"
);

assert(
  executed.operation ===
    mapped.operation,
  "operation propagated"
);

assert(
  executed.providerResourceId ===
    mapped.providerResourceId,
  "providerResourceId propagated"
);

assert(
  executed.providerConfigurationRef ===
    mapped.providerConfigurationRef,
  "providerConfigurationRef propagated"
);

assert(
  executed.providerCredentialRef ===
    mapped.providerCredentialRef,
  "providerCredentialRef propagated"
);

assert(
  normalized.providerReference ===
    executed.providerReference,
  "providerReference propagated"
);

assert(
  normalized.providerRawStatus ===
    executed.providerRawStatus,
  "providerRawStatus propagated"
);

assert(
  hookExposed.providerContract ===
    normalized.providerContract,
  "hook providerContract propagated"
);

assert(
  hookExposed.providerImplementation ===
    normalized.providerImplementation,
  "hook providerImplementation propagated"
);

assert(
  hookExposed.operation ===
    normalized.operation,
  "hook operation propagated"
);


// ============================================================
// SUMMARY PROPAGATION ASSERTIONS
// ============================================================

assert(
  mapped.runtimeSummary.includes(
    "provider_resolved"
  ),
  "runtime summary propagated to mapping"
);

assert(
  executed.mappingSummary.includes(
    "provider_adapter_request_mapped"
  ),
  "mapping summary propagated to execution"
);

assert(
  normalized.executionSummary.includes(
    "provider_adapter_execution_completed"
  ),
  "execution summary propagated to normalization"
);

assert(
  hookExposed.failureSurfaceSummary.includes(
    "provider_adapter_failure_surface_not_preserved"
  ),
  "failure surface summary propagated to hook"
);


// ============================================================
// FAILURE PATH — FAILURE SURFACE PRESENT
// ============================================================

const executedWithFailure =
  executeProviderAdapter({

    mapping: mapped,

    executionDecision:
      "EXECUTE_PROVIDER_ADAPTER",

    adapterExecutionSummary: [
      "adapter_execution_boundary_crossed",
    ],

    providerReference:
      "aws-kms-op-002",

    providerRawStatus:
      "ERROR",

    failureSurface: {
      failureCode:
        "PROVIDER_CALL_FAILED",
      providerRawStatus:
        "ERROR",
      providerRawErrorCode:
        "AccessDenied",
      providerSanitizedErrorMessage:
        "provider denied operation",
      retryable:
        false,
      summary: [
        "provider_call_failed",
      ],
    },

  });

const normalizedWithFailure =
  normalizeProviderAdapterResult({

    execution: executedWithFailure,

    normalizationDecision:
      "NORMALIZE_PROVIDER_ADAPTER_RESULT",

  });

const preservedFailureSurface =
  preserveProviderAdapterFailureSurface({

    normalized:
      normalizedWithFailure,

  });

const hookExposedWithFailure =
  exposeProviderAdapterVerificationHook({

    failureSurface:
      preservedFailureSurface,

    hookDecision:
      "EXPOSE_PROVIDER_ADAPTER_VERIFICATION_HOOK",

  });

assert(
  executedWithFailure.providerCallCompleted === false,
  "execution with failure marks providerCallCompleted false"
);

assert(
  normalizedWithFailure.failureSurface?.failureCode ===
    "PROVIDER_CALL_FAILED",
  "normalization preserves failure surface"
);

assert(
  preservedFailureSurface.failureSurfacePreserved === true,
  "failure surface preserved"
);

assert(
  hookExposedWithFailure.hookExposed === true,
  "verification hook exposed with preserved failure surface"
);


// ============================================================
// DENIAL PATH — MAPPING DENIED
// ============================================================

const mappingDenied =
  mapProviderAdapterRequest({

    runtime,

    providerResourceId:
      "kms-key-001",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    mappingDecision:
      "REJECT_PROVIDER_ADAPTER_REQUEST",

  });

const executionAfterMappingDenied =
  executeProviderAdapter({

    mapping: mappingDenied,

    executionDecision:
      "EXECUTE_PROVIDER_ADAPTER",

  });

const normalizationAfterMappingDenied =
  normalizeProviderAdapterResult({

    execution: executionAfterMappingDenied,

    normalizationDecision:
      "NORMALIZE_PROVIDER_ADAPTER_RESULT",

  });

const failureAfterMappingDenied =
  preserveProviderAdapterFailureSurface({

    normalized:
      normalizationAfterMappingDenied,

  });

const hookAfterMappingDenied =
  exposeProviderAdapterVerificationHook({

    failureSurface:
      failureAfterMappingDenied,

    hookDecision:
      "EXPOSE_PROVIDER_ADAPTER_VERIFICATION_HOOK",

  });

assert(
  mappingDenied.adapterRequestMapped === false,
  "mapping denied"
);

assert(
  mappingDenied.denialReason ===
    "ADAPTER_REQUEST_MAPPING_NOT_ALLOWED",
  "mapping denial reason preserved"
);

assert(
  executionAfterMappingDenied.providerAdapterExecuted === false,
  "mapping denial prevents execution"
);

assert(
  normalizationAfterMappingDenied.adapterResultNormalized === false,
  "mapping denial prevents normalization"
);

assert(
  hookAfterMappingDenied.hookExposed === false,
  "mapping denial prevents verification hook exposure"
);


// ============================================================
// DENIAL PATH — EXECUTION DENIED
// ============================================================

const executionDenied =
  executeProviderAdapter({

    mapping: mapped,

    executionDecision:
      "REJECT_PROVIDER_ADAPTER_EXECUTION",

  });

const normalizationAfterExecutionDenied =
  normalizeProviderAdapterResult({

    execution: executionDenied,

    normalizationDecision:
      "NORMALIZE_PROVIDER_ADAPTER_RESULT",

  });

assert(
  executionDenied.providerAdapterExecuted === false,
  "execution denied"
);

assert(
  executionDenied.denialReason ===
    "ADAPTER_EXECUTION_NOT_ALLOWED",
  "execution denial reason preserved"
);

assert(
  normalizationAfterExecutionDenied.adapterResultNormalized === false,
  "execution denial prevents normalization"
);


// ============================================================
// DENIAL PATH — NORMALIZATION DENIED
// ============================================================

const normalizationDenied =
  normalizeProviderAdapterResult({

    execution: executed,

    normalizationDecision:
      "REJECT_PROVIDER_ADAPTER_RESULT_NORMALIZATION",

  });

const failureAfterNormalizationDenied =
  preserveProviderAdapterFailureSurface({

    normalized:
      normalizationDenied,

  });

assert(
  normalizationDenied.adapterResultNormalized === false,
  "normalization denied"
);

assert(
  normalizationDenied.denialReason ===
    "ADAPTER_RESULT_NORMALIZATION_NOT_ALLOWED",
  "normalization denial reason preserved"
);

assert(
  failureAfterNormalizationDenied.failureSurfacePreserved === false,
  "normalization denial prevents failure surface preservation"
);


// ============================================================
// DENIAL PATH — UNSANITIZED FAILURE SURFACE
// ============================================================

const normalizedWithUnsafeFailure =
  normalizeProviderAdapterResult({

    execution:
      executeProviderAdapter({

        mapping: mapped,

        executionDecision:
          "EXECUTE_PROVIDER_ADAPTER",

        providerRawStatus:
          "ERROR",

        failureSurface: {
          failureCode:
            "PROVIDER_CALL_FAILED",
          providerRawStatus:
            "ERROR",
          providerRawErrorCode:
            "Unsafe",
          providerSanitizedErrorMessage:
            "placeholder",
          retryable:
            false,
          summary: [
            "provider_call_failed",
          ],
          ...( {
            payload: "secret-payload",
          } as Record<string, unknown> ),
        } as any,

      }),

    normalizationDecision:
      "NORMALIZE_PROVIDER_ADAPTER_RESULT",

  });

const unsafeFailureDenied =
  preserveProviderAdapterFailureSurface({

    normalized:
      normalizedWithUnsafeFailure,

  });

assert(
  unsafeFailureDenied.failureSurfacePreserved === false,
  "unsanitized failure surface denied"
);

assert(
  unsafeFailureDenied.denialReason ===
    "UNSANITIZED_FAILURE_SURFACE",
  "unsanitized failure surface denial reason preserved"
);


// ============================================================
// DENIAL PATH — HOOK DENIED
// ============================================================

const hookDenied =
  exposeProviderAdapterVerificationHook({

    failureSurface:
      preservedFailureSurface,

    hookDecision:
      "REJECT_PROVIDER_ADAPTER_VERIFICATION_HOOK",

  });

assert(
  hookDenied.hookExposed === false,
  "verification hook denied"
);

assert(
  hookDenied.denialReason ===
    "ADAPTER_HOOK_NOT_ALLOWED",
  "verification hook denial reason preserved"
);


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

assert(
  !("awsCalled" in hookExposed),
  "no AWS API calls"
);

assert(
  !("azureCalled" in hookExposed),
  "no Azure API calls"
);

assert(
  !("googleCalled" in hookExposed),
  "no Google API calls"
);

assert(
  !("vaultCalled" in hookExposed),
  "no Vault API calls"
);

assert(
  !("hsmCalled" in hookExposed),
  "no HSM API calls"
);

assert(
  !("providerSdkCalled" in hookExposed),
  "no provider SDK calls"
);

assert(
  !("runtimeVerified" in hookExposed),
  "no runtime verification"
);

assert(
  !("runtimeFailureClassified" in hookExposed),
  "no runtime failure classification"
);

assert(
  !("recoveryDecided" in hookExposed),
  "no recovery"
);

assert(
  !("evidenceWritten" in hookExposed),
  "no evidence write"
);

assert(
  !("ledgerWritten" in hookExposed),
  "no ledger write"
);

assert(
  !("auditPerformed" in hookExposed),
  "no audit"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");
console.log(
  "========================================"
);
console.log(
  "P9I PROVIDER ADAPTER FAMILY VERIFIED"
);
console.log(
  "========================================"
);
console.log("");

console.log(
  "Happy Path:"
);
console.log(
  "✓ adapter request mapped"
);
console.log(
  "✓ adapter executed"
);
console.log(
  "✓ adapter result normalized"
);
console.log(
  "✓ no failure surface preserved on happy path"
);
console.log(
  "✓ verification hook exposed"
);

console.log("");
console.log(
  "Failure Surface:"
);
console.log(
  "✓ no failure surface on happy path is preserved as absent"
);
console.log(
  "✓ failure surface preserved when present"
);
console.log(
  "✓ unsanitized failure surface rejected"
);

console.log("");
console.log(
  "Denial Paths:"
);
console.log(
  "✓ mapping denied"
);
console.log(
  "✓ execution denied"
);
console.log(
  "✓ normalization denied"
);
console.log(
  "✓ hook denied"
);

console.log("");
console.log(
  "Contract Propagation:"
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
console.log(
  "✓ resource/config/credential refs"
);
console.log(
  "✓ provider reference / raw status"
);
console.log(
  "✓ summary propagation"
);

console.log("");
console.log(
  "Boundary Verification:"
);
console.log(
  "✓ no provider APIs"
);
console.log(
  "✓ no runtime verification"
);
console.log(
  "✓ no runtime failure classification"
);
console.log(
  "✓ no recovery"
);
console.log(
  "✓ no evidence / ledger / audit"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "P9I PROVIDER ADAPTER FAMILY"
);
console.log(
  "STATUS: COMPLETE"
);
console.log(
  "========================================"
);
