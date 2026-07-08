// ============================================================
// PlannerAgent — Provider Implementation Family Runner
// ============================================================
//
// PATH
// core/src/cryptography/provider/implementations/__tests__/
// P9J.provider.implementation.family.runner.ts
//
// ============================================================

import assert from "node:assert/strict";

import {
  translateProviderImplementationRequest,
  ProviderImplementationRequestTranslationResult,
} from "../P9J.provider.implementation.request.translation";

import {
  executeProviderApiCall,
  ProviderApiCallExecutionResult,
} from "../P9J.provider.api.call.execution";

import {
  translateProviderResult,
  ProviderResultTranslationResult,
} from "../P9J.provider.result.translation";

import {
  sanitizeProviderError,
  ProviderErrorSanitizationResult,
} from "../P9J.provider.error.sanitization";

import type {
  ProviderAdapterRequest,
} from "../../adapters/P9I.provider.adapter.contract";


// ============================================================
// TEST UTILITIES
// ============================================================

function pass(label: string): void {
  console.log(`✅ ${label}`);
}

function assertNoCrossLayerFields(
  value: Record<string, unknown>
): void {

  const forbiddenFields = [
    "runtimeVerified",
    "runtimeFailureClassified",
    "recoveryDecided",
    "evidenceWritten",
    "ledgerWritten",
    "auditPerformed",
    "adapterExecutionAllowed",
    "providerVerificationPassed",
  ];

  for (const field of forbiddenFields) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

    pass(
      `cross-layer field not exposed: ${field}`
    );

  }

}

function buildAdapterRequest(): ProviderAdapterRequest {

  return {

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    operation:
      "REWRAP_KEY",

    providerResourceId:
      "kms-key-rotation-primary",

    providerConfigurationRef:
      "cfg/aws-kms/eu-west-1",

    providerCredentialRef:
      "cred/aws/runtime-rotation",

    executionMetadata: {
      rotationBatchId: "batch-001",
    },

  };

}

function buildTranslatedRequest(): ProviderImplementationRequestTranslationResult {

  return translateProviderImplementationRequest({

    adapterRequest:
      buildAdapterRequest(),

    translationDecision:
      "TRANSLATE_PROVIDER_IMPLEMENTATION_REQUEST",

  });

}


// ============================================================
// HAPPY PATH
// ============================================================

function runHappyPath(): {
  requestTranslation: ProviderImplementationRequestTranslationResult;
  apiExecution: ProviderApiCallExecutionResult;
  resultTranslation: ProviderResultTranslationResult;
  sanitization: ProviderErrorSanitizationResult;
} {

  const requestTranslation =
    buildTranslatedRequest();

  assert(
    requestTranslation.implementationRequestTranslated === true,
    "implementation request translated"
  );
  pass("implementation request translated");

  const apiExecution =
    executeProviderApiCall({

      translation:
        requestTranslation,

      apiCallDecision:
        "EXECUTE_PROVIDER_API_CALL",

      rawProviderResult: {
        providerReference:
          "arn:aws:kms:eu-west-1:123456789012:key/abcd-1234",
        providerRawStatus:
          "KMS_SUCCESS",
      },

      apiCallSummary: [
        "provider_api_call_started",
      ],

    });

  assert(
    apiExecution.providerApiCallExecuted === true,
    "provider api call executed"
  );

  assert(
    apiExecution.providerCallCompleted === true,
    "provider api call completed"
  );

  pass("provider api call executed");
  pass("provider api call completed");

  const resultTranslation =
    translateProviderResult({

      execution:
        apiExecution,

      translationDecision:
        "TRANSLATE_PROVIDER_RESULT",

    });

  assert(
    resultTranslation.resultTranslated === true,
    "provider result translated"
  );

  assert(
    resultTranslation.translatedResult?.adapterCompatible === true,
    "translated success result adapter-compatible"
  );

  pass("provider result translated");
  pass("translated success result adapter-compatible");

  const sanitization =
    sanitizeProviderError({

      translation:
        resultTranslation,

      sanitizationDecision:
        "SANITIZE_PROVIDER_ERROR",

    });

  assert(
    sanitization.sanitizationStatus ===
      "PROVIDER_ERROR_SANITIZATION_NOT_REQUIRED",
    "sanitization not required on happy path"
  );

  assert(
    sanitization.sanitizedOutput?.adapterCompatible === true,
    "sanitized output remains adapter-compatible"
  );

  pass("sanitization not required on happy path");
  pass("sanitized output remains adapter-compatible");

  return {
    requestTranslation,
    apiExecution,
    resultTranslation,
    sanitization,
  };

}


// ============================================================
// FAILURE + SANITIZATION PATH
// ============================================================

function runFailureSanitizationPath(): {
  requestTranslation: ProviderImplementationRequestTranslationResult;
  apiExecution: ProviderApiCallExecutionResult;
  resultTranslation: ProviderResultTranslationResult;
  sanitization: ProviderErrorSanitizationResult;
} {

  const requestTranslation =
    buildTranslatedRequest();

  const apiExecution =
    executeProviderApiCall({

      translation:
        requestTranslation,

      apiCallDecision:
        "EXECUTE_PROVIDER_API_CALL",

      rawProviderResult: {
        providerReference:
          "arn:aws:kms:eu-west-1:123456789012:key/abcd-1234",
        providerRawStatus:
          "KMS_ERROR",
        providerRawErrorCode:
          "AccessDeniedException",
        providerRawErrorMessage:
          "kms denied access using runtime secret token=abc123",
        providerRawDiagnostic: {
          requestId: "req-123",
          token: "abc123",
        },
        retryable:
          false,
      },

      apiCallSummary: [
        "provider_api_call_started",
        "provider_api_call_failed",
      ],

    });

  assert(
    apiExecution.providerCallCompleted === false,
    "provider api call failure marked incomplete"
  );

  assert(
    apiExecution.failureSurface !== undefined,
    "raw implementation failure surface preserved"
  );

  pass("provider api call failure marked incomplete");
  pass("raw implementation failure surface preserved");

  const resultTranslation =
    translateProviderResult({

      execution:
        apiExecution,

      translationDecision:
        "TRANSLATE_PROVIDER_RESULT",

    });

  assert(
    resultTranslation.resultTranslated === true,
    "failed provider result still translated"
  );

  assert(
    resultTranslation.translatedResult?.requiresErrorSanitization === true,
    "failed provider result requires sanitization"
  );

  assert(
    resultTranslation.translatedResult?.adapterCompatible === false,
    "raw failure result not adapter-compatible before sanitization"
  );

  pass("failed provider result still translated");
  pass("failed provider result requires sanitization");
  pass("raw failure result not adapter-compatible before sanitization");

  const sanitization =
    sanitizeProviderError({

      translation:
        resultTranslation,

      sanitizationDecision:
        "SANITIZE_PROVIDER_ERROR",

    });

  assert(
    sanitization.providerErrorSanitized === true,
    "provider error sanitized"
  );

  assert(
    sanitization.sanitizedFailureSurface
      ?.providerSanitizedErrorMessage !== undefined,
    "sanitized failure surface exposes sanitized message"
  );

  assert(
    sanitization.sanitizedFailureSurface
      ?.providerSanitizedErrorMessage !==
      "kms denied access using runtime secret token=abc123",
    "raw provider error message not leaked"
  );

  assert(
    sanitization.sanitizedOutput?.adapterCompatible === true,
    "sanitized output becomes adapter-compatible"
  );

  pass("provider error sanitized");
  pass("sanitized failure surface exposes sanitized message");
  pass("raw provider error message not leaked");
  pass("sanitized output becomes adapter-compatible");

  return {
    requestTranslation,
    apiExecution,
    resultTranslation,
    sanitization,
  };

}


// ============================================================
// CONTRACT PROPAGATION
// ============================================================

function runContractPropagationChecks(
  requestTranslation: ProviderImplementationRequestTranslationResult,
  apiExecution: ProviderApiCallExecutionResult,
  resultTranslation: ProviderResultTranslationResult,
  sanitization: ProviderErrorSanitizationResult
): void {

  assert(
    apiExecution.providerContract ===
      requestTranslation.providerContract,
    "providerContract propagated to api execution"
  );

  assert(
    apiExecution.providerImplementation ===
      requestTranslation.providerImplementation,
    "providerImplementation propagated to api execution"
  );

  assert(
    apiExecution.operation ===
      requestTranslation.operation,
    "operation propagated to api execution"
  );

  assert(
    apiExecution.providerResourceId ===
      requestTranslation.providerResourceId,
    "providerResourceId propagated to api execution"
  );

  assert(
    apiExecution.providerConfigurationRef ===
      requestTranslation.providerConfigurationRef,
    "providerConfigurationRef propagated to api execution"
  );

  assert(
    apiExecution.providerCredentialRef ===
      requestTranslation.providerCredentialRef,
    "providerCredentialRef propagated to api execution"
  );

  assert(
    resultTranslation.providerReference ===
      apiExecution.providerReference,
    "providerReference propagated to result translation"
  );

  assert(
    resultTranslation.providerRawStatus ===
      apiExecution.providerRawStatus,
    "providerRawStatus propagated to result translation"
  );

  assert(
    sanitization.providerContract ===
      resultTranslation.providerContract,
    "providerContract propagated to sanitization"
  );

  pass("contract propagation verified");
  pass("providerRawStatus propagated to result translation");

}


// ============================================================
// SUMMARY PROPAGATION
// ============================================================

function runSummaryPropagationChecks(
  requestTranslation: ProviderImplementationRequestTranslationResult,
  apiExecution: ProviderApiCallExecutionResult,
  resultTranslation: ProviderResultTranslationResult,
  sanitization: ProviderErrorSanitizationResult
): void {

  assert(
    apiExecution.translationSummary.includes(
      "provider_implementation_request_translated"
    ),
    "request translation summary propagated to api execution"
  );

  assert(
    resultTranslation.executionSummary.includes(
      "provider_api_call_boundary_crossed_with_failure"
    ) ||
      resultTranslation.executionSummary.includes(
        "provider_api_call_boundary_crossed"
      ),
    "api execution summary propagated to result translation"
  );

  assert(
    sanitization.translationSummary.includes(
      "provider_result_translated_with_raw_failure_material"
    ) ||
      sanitization.translationSummary.includes(
        "provider_result_translated"
      ),
    "result translation summary propagated to sanitization"
  );

  assert(
    requestTranslation.summary.includes(
      "provider_implementation_request_translated"
    ),
    "request translation summary preserved"
  );

  pass("summary propagation verified");

}


// ============================================================
// DENIAL PATHS
// ============================================================

function runDenialPaths(): void {

  const requestDenied =
    translateProviderImplementationRequest({

      adapterRequest:
        buildAdapterRequest(),

      translationDecision:
        "REJECT_PROVIDER_IMPLEMENTATION_REQUEST_TRANSLATION",

    });

  assert(
    requestDenied.implementationRequestTranslated === false,
    "request translation denied"
  );

  assert(
    requestDenied.denialReason ===
      "IMPLEMENTATION_REQUEST_TRANSLATION_NOT_ALLOWED",
    "request translation denial reason preserved"
  );

  pass("request translation denied");
  pass("request translation denial reason preserved");

  const apiDenied =
    executeProviderApiCall({

      translation:
        buildTranslatedRequest(),

      apiCallDecision:
        "REJECT_PROVIDER_API_CALL_EXECUTION",

    });

  assert(
    apiDenied.providerApiCallExecuted === false,
    "provider api call execution denied"
  );

  assert(
    apiDenied.denialReason ===
      "PROVIDER_API_CALL_EXECUTION_NOT_ALLOWED",
    "provider api call denial reason preserved"
  );

  pass("provider api call execution denied");
  pass("provider api call denial reason preserved");

  const translationDenied =
    translateProviderResult({

      execution:
        executeProviderApiCall({

          translation:
            buildTranslatedRequest(),

          apiCallDecision:
            "EXECUTE_PROVIDER_API_CALL",

          rawProviderResult: {
            providerReference:
              "arn:aws:kms:key/test",
            providerRawStatus:
              "KMS_SUCCESS",
          },

        }),

      translationDecision:
        "REJECT_PROVIDER_RESULT_TRANSLATION",

    });

  assert(
    translationDenied.resultTranslated === false,
    "provider result translation denied"
  );

  assert(
    translationDenied.denialReason ===
      "PROVIDER_RESULT_TRANSLATION_NOT_ALLOWED",
    "provider result translation denial reason preserved"
  );

  pass("provider result translation denied");
  pass("provider result translation denial reason preserved");

  const sanitizationDenied =
    sanitizeProviderError({

      translation:
        translateProviderResult({

          execution:
            executeProviderApiCall({

              translation:
                buildTranslatedRequest(),

              apiCallDecision:
                "EXECUTE_PROVIDER_API_CALL",

              rawProviderResult: {
                providerReference:
                  "arn:aws:kms:key/test",
                providerRawStatus:
                  "KMS_ERROR",
                providerRawErrorCode:
                  "AccessDeniedException",
                providerRawErrorMessage:
                  "secret token leaked",
                providerRawDiagnostic: {
                  token: "secret-token",
                },
              },

            }),

          translationDecision:
            "TRANSLATE_PROVIDER_RESULT",

        }),

      sanitizationDecision:
        "REJECT_PROVIDER_ERROR_SANITIZATION",

    });

  assert(
    sanitizationDenied.providerErrorSanitized === false,
    "provider error sanitization denied"
  );

  assert(
    sanitizationDenied.denialReason ===
      "PROVIDER_ERROR_SANITIZATION_NOT_ALLOWED",
    "provider error sanitization denial reason preserved"
  );

  pass("provider error sanitization denied");
  pass("provider error sanitization denial reason preserved");

}


// ============================================================
// UNSAFE SURFACE COHERENCE DENIAL
// ============================================================

function runUnsafeSurfaceCoherenceDenial(): void {

  const translated =
    translateProviderResult({

      execution:
        executeProviderApiCall({

          translation:
            buildTranslatedRequest(),

          apiCallDecision:
            "EXECUTE_PROVIDER_API_CALL",

          rawProviderResult: {
            providerReference:
              "arn:aws:kms:key/test",
            providerRawStatus:
              "KMS_ERROR",
            providerRawErrorCode:
              "AccessDeniedException",
            providerRawErrorMessage:
              "provider denied request",
            providerRawDiagnostic: {
              requestId: "req-1",
            },
          },

        }),

      translationDecision:
        "TRANSLATE_PROVIDER_RESULT",

    });

  if (!translated.translatedResult?.failureSurface) {
    throw new Error("expected failure surface");
  }

  delete (
    translated.translatedResult.failureSurface as
      Record<string, unknown>
  ).providerRawErrorMessage;

  delete (
    translated.translatedResult.failureSurface as
      Record<string, unknown>
  ).providerRawDiagnostic;

  const denied =
    sanitizeProviderError({

      translation:
        translated,

      sanitizationDecision:
        "SANITIZE_PROVIDER_ERROR",

    });

  assert(
    denied.providerErrorSanitized === false,
    "unsafe-surface coherence denial triggered"
  );

  assert(
    denied.denialReason ===
      "RAW_FAILURE_SURFACE_NOT_UNSAFE",
    "unsafe-surface coherence denial reason preserved"
  );

  pass("unsafe-surface coherence denial triggered");
  pass("unsafe-surface coherence denial reason preserved");

}


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(
  failure: {
    apiExecution: ProviderApiCallExecutionResult;
    resultTranslation: ProviderResultTranslationResult;
    sanitization: ProviderErrorSanitizationResult;
  }
): void {

  assertNoCrossLayerFields(
    failure.apiExecution as unknown as
      Record<string, unknown>
  );

  assertNoCrossLayerFields(
    failure.resultTranslation as unknown as
      Record<string, unknown>
  );

  assertNoCrossLayerFields(
    failure.sanitization as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runHappyPath();

  const failure =
    runFailureSanitizationPath();

  runContractPropagationChecks(
    failure.requestTranslation,
    failure.apiExecution,
    failure.resultTranslation,
    failure.sanitization
  );

  runSummaryPropagationChecks(
    failure.requestTranslation,
    failure.apiExecution,
    failure.resultTranslation,
    failure.sanitization
  );

  runDenialPaths();

  runUnsafeSurfaceCoherenceDenial();

  runBoundaryVerification({
    apiExecution:
      failure.apiExecution,
    resultTranslation:
      failure.resultTranslation,
    sanitization:
      failure.sanitization,
  });

  console.log("");
  console.log("========================================");
  console.log("P9J PROVIDER IMPLEMENTATION FAMILY");
  console.log("========================================");
  console.log("");

  console.log("Happy Path:");
  console.log("✓ implementation request translated");
  console.log("✓ provider api call executed");
  console.log("✓ provider result translated");
  console.log("✓ sanitization not required on success");

  console.log("");
  console.log("Failure + Sanitization:");
  console.log("✓ raw provider failure preserved");
  console.log("✓ failed provider result translated");
  console.log("✓ sanitization required");
  console.log("✓ sanitized failure surface emitted");
  console.log("✓ raw provider error message not leaked");

  console.log("");
  console.log("Denial Paths:");
  console.log("✓ request translation denied");
  console.log("✓ provider api call denied");
  console.log("✓ result translation denied");
  console.log("✓ sanitization denied");
  console.log("✓ unsafe-surface coherence denied");

  console.log("");
  console.log("Contract Propagation:");
  console.log("✓ providerContract");
  console.log("✓ providerImplementation");
  console.log("✓ operation");
  console.log("✓ resource/config/credential refs");
  console.log("✓ providerReference / raw status");
  console.log("✓ summary propagation");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no recovery");
  console.log("✓ no evidence / ledger / audit");
  console.log("✓ no adapter contract redefinition");

  console.log("");
  console.log("========================================");
  console.log("P9J PROVIDER IMPLEMENTATION FAMILY VERIFIED");
  console.log("========================================");

}

main();


