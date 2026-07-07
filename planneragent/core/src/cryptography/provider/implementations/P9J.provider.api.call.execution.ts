// ============================================================
// PlannerAgent — Provider API Call Execution
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/implementations/
// P9J.provider.api.call.execution.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Provider-Specific Implementations
//
// DOMAIN
// ------------------------------------------------------------
// P9J.3 — Provider API Call Execution
//
// PURPOSE
// ------------------------------------------------------------
// Execute the provider API / SDK call
// boundary from a translated
// ProviderImplementationRequest.
//
// Provider API Call Execution
// crosses the provider API / SDK
// execution boundary contractually.
//
// Current implementation receives a
// rawProviderResult supplied by an
// external provider-specific caller.
//
// Concrete SDK / API invocation
// belongs to provider-specific
// implementation modules that feed
// this boundary.
//
// It does not translate final results.
//
// It does not sanitize provider errors.
//
// It does not produce adapter-
// compatible output.
//
// It does not verify runtime.
//
// It does not classify runtime failure.
//
// It does not decide recovery.
//
// It does not write evidence, ledger,
// or audit.
//
// This file receives
// ProviderImplementationRequestTranslationResult
// and produces ProviderApiCallExecutionResult.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Implementation Request
// Translation prepares.
//
// Provider API Call Execution
// represents the provider API / SDK
// execution boundary.
//
// Provider Result Translation
// translates.
//
// Provider Error Sanitization
// sanitizes.
//
// API Call Executed
// ≠
// Result Translated
//
// Raw Provider Result
// ≠
// Adapter-Compatible Output
//
// ============================================================

import {
  ProviderImplementationFailureSurface,
  ProviderImplementationRequest,
  ProviderImplementationResult,
  ProviderImplementationExecutionStatus,
} from "./P9J.provider.implementation.contract";

import {
  ProviderImplementationRequestTranslationResult,
} from "./P9J.provider.implementation.request.translation";


// ============================================================
// API CALL DECISION
// ============================================================

export type ProviderApiCallExecutionDecision =
  | "EXECUTE_PROVIDER_API_CALL"
  | "REJECT_PROVIDER_API_CALL_EXECUTION";


// ============================================================
// API CALL BOUNDARY STATUS
// ============================================================

export type ProviderApiCallBoundaryStatus =
  | "PROVIDER_API_CALL_BOUNDARY_CROSSED"
  | "PROVIDER_API_CALL_BOUNDARY_NOT_CROSSED";


// ============================================================
// API CALL DENIAL REASON
// ============================================================

export type ProviderApiCallExecutionDenialReason =
  | "IMPLEMENTATION_REQUEST_NOT_TRANSLATED"
  | "PROVIDER_API_CALL_EXECUTION_NOT_ALLOWED";


// ============================================================
// RAW PROVIDER RESULT
// ============================================================

export interface RawProviderApiCallResult {

  providerReference?:
    string;

  providerRawStatus?:
    string;

  providerRawErrorCode?:
    string;

  providerRawErrorMessage?:
    string;

  providerRawDiagnostic?:
    unknown;

  retryable?:
    boolean;

}


// ============================================================
// API CALL INPUT
// ============================================================

export interface ProviderApiCallExecutionInput {

  translation:
    ProviderImplementationRequestTranslationResult;

  apiCallDecision:
    ProviderApiCallExecutionDecision;

  rawProviderResult?:
    RawProviderApiCallResult;

  apiCallSummary?:
    string[];

}


// ============================================================
// API CALL EXECUTION RESULT
// ============================================================

export interface ProviderApiCallExecutionResult {

  apiCallBoundaryStatus:
    ProviderApiCallBoundaryStatus;

  apiCallDecision:
    ProviderApiCallExecutionDecision;

  providerApiCallExecuted:
    boolean;

  implementationRequestTranslated:
    ProviderImplementationRequestTranslationResult["implementationRequestTranslated"];

  providerImplementation:
    ProviderImplementationRequestTranslationResult["providerImplementation"];

  providerContract:
    ProviderImplementationRequestTranslationResult["providerContract"];

  operation:
    ProviderImplementationRequestTranslationResult["operation"];

  providerResourceId:
    ProviderImplementationRequestTranslationResult["providerResourceId"];

  providerConfigurationRef:
    ProviderImplementationRequestTranslationResult["providerConfigurationRef"];

  providerCredentialRef:
    ProviderImplementationRequestTranslationResult["providerCredentialRef"];

  executionMetadata?:
    ProviderImplementationRequestTranslationResult["executionMetadata"];

  implementationRequest?:
    ProviderImplementationRequest;

  providerCallAttempted:
    boolean;

  providerCallCompleted:
    boolean;

  providerReference?:
    string;

  providerRawStatus?:
    string;

  failureSurface?:
    ProviderImplementationFailureSurface;

  implementationResult:
    ProviderImplementationResult;

  denialReason?:
    ProviderApiCallExecutionDenialReason;

  translationSummary:
    string[];

  apiCallSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// FAILURE SURFACE FROM RAW RESULT
// ============================================================

function buildFailureSurfaceFromRawResult(
  rawProviderResult: RawProviderApiCallResult
): ProviderImplementationFailureSurface {

  return {

    failureCode:
      "PROVIDER_SDK_UNKNOWN_FAILURE",

    providerRawStatus:
      rawProviderResult.providerRawStatus,

    providerRawErrorCode:
      rawProviderResult.providerRawErrorCode,

    providerRawErrorMessage:
      rawProviderResult.providerRawErrorMessage,

    providerRawDiagnostic:
      rawProviderResult.providerRawDiagnostic,

    retryable:
      rawProviderResult.retryable ?? false,

    summary: [
      "provider_raw_failure_surface_created",
    ],

  };

}


// ============================================================
// API CALL EXECUTION
// ============================================================

export function executeProviderApiCall(
  input: ProviderApiCallExecutionInput
): ProviderApiCallExecutionResult {

  const translation =
    input.translation;

  const apiCallSummary = [
    ...(input.apiCallSummary ?? []),
  ];

  if (!translation.implementationRequestTranslated) {

    const implementationResult:
      ProviderImplementationResult = {

        executionStatus:
          "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED",

        providerImplementation:
          translation.providerImplementation,

        providerContract:
          translation.providerContract,

        operation:
          translation.operation,

        providerResourceId:
          translation.providerResourceId,

        providerConfigurationRef:
          translation.providerConfigurationRef,

        providerCredentialRef:
          translation.providerCredentialRef,

        providerCallAttempted:
          false,

        providerCallCompleted:
          false,

        requiresResultTranslation:
          true,

        requiresErrorSanitization:
          false,

        summary: [
          ...translation.summary,
          "implementation_request_not_translated",
          "provider_api_call_boundary_not_crossed",
        ],

      };

    return {

      apiCallBoundaryStatus:
        "PROVIDER_API_CALL_BOUNDARY_NOT_CROSSED",

      apiCallDecision:
        input.apiCallDecision,

      providerApiCallExecuted:
        false,

      implementationRequestTranslated:
        translation.implementationRequestTranslated,

      providerImplementation:
        translation.providerImplementation,

      providerContract:
        translation.providerContract,

      operation:
        translation.operation,

      providerResourceId:
        translation.providerResourceId,

      providerConfigurationRef:
        translation.providerConfigurationRef,

      providerCredentialRef:
        translation.providerCredentialRef,

      executionMetadata:
        translation.executionMetadata,

      implementationRequest:
        translation.implementationRequest,

      providerCallAttempted:
        false,

      providerCallCompleted:
        false,

      implementationResult,

      denialReason:
        "IMPLEMENTATION_REQUEST_NOT_TRANSLATED",

      translationSummary: [
        ...translation.summary,
      ],

      apiCallSummary,

      summary: [
        ...translation.summary,
        ...apiCallSummary,
        "implementation_request_not_translated",
        "provider_api_call_boundary_not_crossed",
      ],

    };

  }

  if (
    input.apiCallDecision ===
    "REJECT_PROVIDER_API_CALL_EXECUTION"
  ) {

    const implementationResult:
      ProviderImplementationResult = {

        executionStatus:
          "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED",

        providerImplementation:
          translation.providerImplementation,

        providerContract:
          translation.providerContract,

        operation:
          translation.operation,

        providerResourceId:
          translation.providerResourceId,

        providerConfigurationRef:
          translation.providerConfigurationRef,

        providerCredentialRef:
          translation.providerCredentialRef,

        providerCallAttempted:
          false,

        providerCallCompleted:
          false,

        requiresResultTranslation:
          true,

        requiresErrorSanitization:
          false,

        summary: [
          ...translation.summary,
          "provider_api_call_execution_not_allowed",
          "provider_api_call_boundary_not_crossed",
        ],

      };

    return {

      apiCallBoundaryStatus:
        "PROVIDER_API_CALL_BOUNDARY_NOT_CROSSED",

      apiCallDecision:
        input.apiCallDecision,

      providerApiCallExecuted:
        false,

      implementationRequestTranslated:
        translation.implementationRequestTranslated,

      providerImplementation:
        translation.providerImplementation,

      providerContract:
        translation.providerContract,

      operation:
        translation.operation,

      providerResourceId:
        translation.providerResourceId,

      providerConfigurationRef:
        translation.providerConfigurationRef,

      providerCredentialRef:
        translation.providerCredentialRef,

      executionMetadata:
        translation.executionMetadata,

      implementationRequest:
        translation.implementationRequest,

      providerCallAttempted:
        false,

      providerCallCompleted:
        false,

      implementationResult,

      denialReason:
        "PROVIDER_API_CALL_EXECUTION_NOT_ALLOWED",

      translationSummary: [
        ...translation.summary,
      ],

      apiCallSummary,

      summary: [
        ...translation.summary,
        ...apiCallSummary,
        "provider_api_call_execution_not_allowed",
        "provider_api_call_boundary_not_crossed",
      ],

    };

  }

  const rawProviderResult =
    input.rawProviderResult;

  const providerCallCompleted =
    !rawProviderResult?.providerRawErrorCode &&
    !rawProviderResult?.providerRawErrorMessage &&
    !rawProviderResult?.providerRawDiagnostic;

  const failureSurface =
    providerCallCompleted
      ? undefined
      : buildFailureSurfaceFromRawResult(
          rawProviderResult ?? {}
        );

  const executionStatus:
    ProviderImplementationExecutionStatus =
      providerCallCompleted
        ? "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED"
        : "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED";

  const implementationResult:
    ProviderImplementationResult = {

      executionStatus,

      providerImplementation:
        translation.providerImplementation,

      providerContract:
        translation.providerContract,

      operation:
        translation.operation,

      providerResourceId:
        translation.providerResourceId,

      providerConfigurationRef:
        translation.providerConfigurationRef,

      providerCredentialRef:
        translation.providerCredentialRef,

      providerCallAttempted:
        true,

      providerCallCompleted,

      providerReference:
        rawProviderResult?.providerReference,

      providerRawStatus:
        rawProviderResult?.providerRawStatus,

      failureSurface,

      requiresResultTranslation:
        true,

      requiresErrorSanitization:
        !!failureSurface,

      summary: [
        ...translation.summary,
        ...apiCallSummary,
        providerCallCompleted
          ? "provider_api_call_completed"
          : "provider_api_call_failed",
      ],

    };

  return {

    apiCallBoundaryStatus:
      "PROVIDER_API_CALL_BOUNDARY_CROSSED",

    apiCallDecision:
      input.apiCallDecision,

    providerApiCallExecuted:
      true,

    implementationRequestTranslated:
      translation.implementationRequestTranslated,

    providerImplementation:
      translation.providerImplementation,

    providerContract:
      translation.providerContract,

    operation:
      translation.operation,

    providerResourceId:
      translation.providerResourceId,

    providerConfigurationRef:
      translation.providerConfigurationRef,

    providerCredentialRef:
      translation.providerCredentialRef,

    executionMetadata:
      translation.executionMetadata,

    implementationRequest:
      translation.implementationRequest,

    providerCallAttempted:
      true,

    providerCallCompleted,

    providerReference:
      rawProviderResult?.providerReference,

    providerRawStatus:
      rawProviderResult?.providerRawStatus,

    failureSurface,

    implementationResult,

    translationSummary: [
      ...translation.summary,
    ],

    apiCallSummary,

    summary: [
      ...translation.summary,
      ...apiCallSummary,
      providerCallCompleted
        ? "provider_api_call_boundary_crossed"
        : "provider_api_call_boundary_crossed_with_failure",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider API Call Execution receives
// ProviderImplementationRequestTranslationResult.
//
// It preserves:
//
// ✓ implementationRequestTranslated
// ✓ providerImplementation
// ✓ providerContract
// ✓ operation
// ✓ providerResourceId
// ✓ providerConfigurationRef
// ✓ providerCredentialRef
// ✓ executionMetadata
// ✓ implementationRequest
// ✓ translationSummary
//
// It adds:
//
// ✓ providerApiCallExecuted
// ✓ providerCallAttempted
// ✓ providerCallCompleted
// ✓ providerReference
// ✓ providerRawStatus
// ✓ raw implementation failure surface
// ✓ implementationResult
//
// This is the first P9J layer allowed
// to represent the provider API / SDK
// execution boundary.
//
// ============================================================


// ============================================================
// API CALL PRINCIPLES
// ============================================================
//
// Provider Implementation Request
// Translation
// ≠
// Provider API Call Execution
//
// Provider API Call Execution
// ≠
// Provider Result Translation
//
// Provider API Call Execution
// ≠
// Provider Error Sanitization
//
// Provider API / SDK Result
// ≠
// Adapter-Compatible Output
//
// Raw Provider Result
// ≠
// Sanitized Provider Result
//
// API Call Execution represents the
// provider execution boundary.
//
// Result Translation translates.
//
// Error Sanitization sanitizes.
//
// ============================================================


// ============================================================
// SECURITY OBSERVATION
// ============================================================
//
// Raw provider outputs may enter this
// domain.
//
// Raw provider outputs may include:
//
// - raw provider status
// - raw provider error code
// - raw provider error message
// - raw provider diagnostic payload
//
// These raw outputs must not leave
// P9J without result translation and,
// when failure material exists,
// provider error sanitization.
//
// requiresErrorSanitization must be
// true whenever raw failure material
// exists.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - translate final adapter results
// - sanitize provider errors
// - produce adapter-compatible output
// - verify runtime
// - classify runtime failure
// - decide recovery
// - persist evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive ProviderImplementationRequestTranslationResult
//
// ✓ preserve implementation request
//   context
//
// ✓ represent provider API / SDK
//   execution boundary
//
// ✓ preserve raw provider status
//
// ✓ preserve raw provider failure
//   material inside P9J only
//
// ✓ produce ProviderImplementationResult
//
// ✓ set requiresResultTranslation
//
// ✓ set requiresErrorSanitization
//   when raw failure material exists
//
// ✗ translate final adapter result
//
// ✗ sanitize provider errors
//
// ✗ verify runtime
//
// ✗ classify runtime failure
//
// ✗ recover
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================
