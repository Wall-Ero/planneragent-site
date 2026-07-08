// ============================================================
// PlannerAgent — Provider Error Sanitization
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/implementations/
// P9J.provider.error.sanitization.ts
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
// P9J.5 — Provider Error Sanitization
//
// PURPOSE
// ------------------------------------------------------------
// Sanitize raw provider failure
// material before it leaves P9J.
//
// Provider Error Sanitization receives
// ProviderResultTranslationResult.
//
// It sanitizes provider failure
// surfaces when raw failure material
// exists.
//
// It produces adapter-safe failure
// material compatible with P9I.
//
// It does not execute provider calls.
//
// It does not translate provider API
// call results.
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
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Result Translation
// translates.
//
// Provider Error Sanitization
// sanitizes.
//
// Raw Provider Failure
// ≠
// Sanitized Provider Failure
//
// Sanitized Provider Failure
// ≠
// Runtime Failure Classification
//
// Only sanitized, adapter-compatible
// outputs may leave P9J.
//
// ============================================================

import {
  ProviderAdapterFailureSurface,
} from "../adapters/P9I.provider.adapter.contract";

import {
  ProviderResultTranslationResult,
} from "./P9J.provider.result.translation";

import {
  ProviderImplementationFailureSurface,
} from "./P9J.provider.implementation.contract";


// ============================================================
// SANITIZATION STATUS
// ============================================================

export type ProviderErrorSanitizationStatus =
  | "PROVIDER_ERROR_SANITIZED"
  | "PROVIDER_ERROR_SANITIZATION_NOT_REQUIRED"
  | "PROVIDER_ERROR_NOT_SANITIZED";


// ============================================================
// SANITIZATION DECISION
// ============================================================

export type ProviderErrorSanitizationDecision =
  | "SANITIZE_PROVIDER_ERROR"
  | "REJECT_PROVIDER_ERROR_SANITIZATION";


// ============================================================
// SANITIZATION DENIAL REASON
// ============================================================

export type ProviderErrorSanitizationDenialReason =
  | "PROVIDER_RESULT_NOT_TRANSLATED"
  | "PROVIDER_ERROR_SANITIZATION_NOT_ALLOWED"
  | "RAW_FAILURE_SURFACE_MISSING"
  | "RAW_FAILURE_SURFACE_NOT_UNSAFE";


// ============================================================
// SANITIZED PROVIDER OUTPUT
// ============================================================

export interface SanitizedProviderOutput {

  adapterCompatible:
    boolean;

  providerReference?:
    string;

  providerRawStatus?:
    string;

  providerRawErrorCode?:
    string;

  providerCallAttempted:
    boolean;

  providerCallCompleted:
    boolean;

  failureSurface?:
    ProviderAdapterFailureSurface;

  summary:
    string[];

}


// ============================================================
// SANITIZATION INPUT
// ============================================================

export interface ProviderErrorSanitizationInput {

  translation:
    ProviderResultTranslationResult;

  sanitizationDecision:
    ProviderErrorSanitizationDecision;

}


// ============================================================
// SANITIZATION RESULT
// ============================================================

export interface ProviderErrorSanitizationResult {

  sanitizationStatus:
    ProviderErrorSanitizationStatus;

  sanitizationDecision:
    ProviderErrorSanitizationDecision;

  providerErrorSanitized:
    boolean;

  sanitizationRequired:
    boolean;

  resultTranslated:
    ProviderResultTranslationResult["resultTranslated"];

  providerApiCallExecuted:
    ProviderResultTranslationResult["providerApiCallExecuted"];

  providerImplementation:
    ProviderResultTranslationResult["providerImplementation"];

  providerContract:
    ProviderResultTranslationResult["providerContract"];

  operation:
    ProviderResultTranslationResult["operation"];

  providerResourceId:
    ProviderResultTranslationResult["providerResourceId"];

  providerConfigurationRef:
    ProviderResultTranslationResult["providerConfigurationRef"];

  providerCredentialRef:
    ProviderResultTranslationResult["providerCredentialRef"];

  providerCallAttempted:
    ProviderResultTranslationResult["providerCallAttempted"];

  providerCallCompleted:
    ProviderResultTranslationResult["providerCallCompleted"];

  providerReference?:
    ProviderResultTranslationResult["providerReference"];

  providerRawStatus?:
    ProviderResultTranslationResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderResultTranslationResult["providerRawErrorCode"];

  sanitizedOutput?:
    SanitizedProviderOutput;

  sanitizedFailureSurface?:
    ProviderAdapterFailureSurface;

  denialReason?:
    ProviderErrorSanitizationDenialReason;

  translationSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// UNSAFE FIELD GUARD
// ============================================================

function containsUnsafeFailureMaterial(
  failureSurface: ProviderImplementationFailureSurface
): boolean {

  const unsafeKeys = [

    "providerRawErrorMessage",

    "providerRawDiagnostic",

    "rawErrorMessage",

    "errorMessage",

    "stack",

    "credential",

    "credentials",

    "token",

    "secret",

    "keyMaterial",

    "payload",

  ];

  return unsafeKeys.some(
    (key) =>
      Object.prototype.hasOwnProperty.call(
        failureSurface,
        key
      )
  );

}


// ============================================================
// SANITIZED ERROR MESSAGE
// ============================================================

function buildSanitizedErrorMessage(
  failureSurface: ProviderImplementationFailureSurface
): string {

  switch (failureSurface.failureCode) {

    case "PROVIDER_CALL_TIMEOUT":
    case "PROVIDER_SDK_TIMEOUT":
      return "provider operation timed out";

    case "PROVIDER_CALL_THROTTLED":
      return "provider operation was throttled";

    case "PROVIDER_CALL_UNAUTHORIZED":
    case "PROVIDER_SDK_AUTHENTICATION_FAILED":
    case "PROVIDER_SDK_AUTHORIZATION_FAILED":
      return "provider authorization failed";

    case "PROVIDER_CALL_INVALID_STATE":
    case "PROVIDER_SDK_INVALID_KEY_STATE":
      return "provider resource is in an invalid state";

    case "PROVIDER_SDK_INVALID_REQUEST":
      return "provider request was invalid";

    case "PROVIDER_SDK_UNAVAILABLE":
      return "provider service unavailable";

    default:
      return "provider operation failed";

  }

}


// ============================================================
// FAILURE SURFACE SANITIZATION
// ============================================================

function sanitizeFailureSurface(
  failureSurface: ProviderImplementationFailureSurface
): ProviderAdapterFailureSurface {

  return {

    failureCode:
      failureSurface.failureCode,

    providerRawStatus:
      failureSurface.providerRawStatus,

    providerRawErrorCode:
      failureSurface.providerRawErrorCode,

    providerSanitizedErrorMessage:
      buildSanitizedErrorMessage(
        failureSurface
      ),

    retryable:
      failureSurface.retryable,

    summary: [
      ...failureSurface.summary,
      "provider_failure_surface_sanitized",
    ],

  };

}


// ============================================================
// PROVIDER ERROR SANITIZATION
// ============================================================

export function sanitizeProviderError(
  input: ProviderErrorSanitizationInput
): ProviderErrorSanitizationResult {

  const translation =
    input.translation;

  if (!translation.resultTranslated) {

    return {

      sanitizationStatus:
        "PROVIDER_ERROR_NOT_SANITIZED",

      sanitizationDecision:
        input.sanitizationDecision,

      providerErrorSanitized:
        false,

      sanitizationRequired:
        false,

      resultTranslated:
        translation.resultTranslated,

      providerApiCallExecuted:
        translation.providerApiCallExecuted,

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
        translation.providerCallAttempted,

      providerCallCompleted:
        translation.providerCallCompleted,

      providerReference:
        translation.providerReference,

      providerRawStatus:
        translation.providerRawStatus,

      providerRawErrorCode:
        translation.providerRawErrorCode,

      denialReason:
        "PROVIDER_RESULT_NOT_TRANSLATED",

      translationSummary: [
        ...translation.summary,
      ],

      summary: [
        ...translation.summary,
        "provider_result_not_translated",
        "provider_error_not_sanitized",
      ],

    };

  }

  const translatedResult =
    translation.translatedResult;

  const sanitizationRequired =
    translatedResult?.requiresErrorSanitization === true;

  if (!sanitizationRequired) {

    const sanitizedOutput:
      SanitizedProviderOutput = {

        adapterCompatible:
          true,

        providerReference:
          translation.providerReference,

        providerRawStatus:
          translation.providerRawStatus,

        providerRawErrorCode:
          translation.providerRawErrorCode,

        providerCallAttempted:
          translation.providerCallAttempted,

        providerCallCompleted:
          translation.providerCallCompleted,

        summary: [
          ...translation.summary,
          "provider_error_sanitization_not_required",
        ],

      };

    return {

      sanitizationStatus:
        "PROVIDER_ERROR_SANITIZATION_NOT_REQUIRED",

      sanitizationDecision:
        input.sanitizationDecision,

      providerErrorSanitized:
        false,

      sanitizationRequired:
        false,

      resultTranslated:
        translation.resultTranslated,

      providerApiCallExecuted:
        translation.providerApiCallExecuted,

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
        translation.providerCallAttempted,

      providerCallCompleted:
        translation.providerCallCompleted,

      providerReference:
        translation.providerReference,

      providerRawStatus:
        translation.providerRawStatus,

      providerRawErrorCode:
        translation.providerRawErrorCode,

      sanitizedOutput,

      translationSummary: [
        ...translation.summary,
      ],

      summary: [
        ...translation.summary,
        "provider_error_sanitization_not_required",
      ],

    };

  }

  if (
    input.sanitizationDecision ===
    "REJECT_PROVIDER_ERROR_SANITIZATION"
  ) {

    return {

      sanitizationStatus:
        "PROVIDER_ERROR_NOT_SANITIZED",

      sanitizationDecision:
        input.sanitizationDecision,

      providerErrorSanitized:
        false,

      sanitizationRequired:
        true,

      resultTranslated:
        translation.resultTranslated,

      providerApiCallExecuted:
        translation.providerApiCallExecuted,

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
        translation.providerCallAttempted,

      providerCallCompleted:
        translation.providerCallCompleted,

      providerReference:
        translation.providerReference,

      providerRawStatus:
        translation.providerRawStatus,

      providerRawErrorCode:
        translation.providerRawErrorCode,

      denialReason:
        "PROVIDER_ERROR_SANITIZATION_NOT_ALLOWED",

      translationSummary: [
        ...translation.summary,
      ],

      summary: [
        ...translation.summary,
        "provider_error_sanitization_not_allowed",
        "provider_error_not_sanitized",
      ],

    };

  }

  const rawFailureSurface =
    translatedResult?.failureSurface;

  if (!rawFailureSurface) {

    return {

      sanitizationStatus:
        "PROVIDER_ERROR_NOT_SANITIZED",

      sanitizationDecision:
        input.sanitizationDecision,

      providerErrorSanitized:
        false,

      sanitizationRequired:
        true,

      resultTranslated:
        translation.resultTranslated,

      providerApiCallExecuted:
        translation.providerApiCallExecuted,

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
        translation.providerCallAttempted,

      providerCallCompleted:
        translation.providerCallCompleted,

      providerReference:
        translation.providerReference,

      providerRawStatus:
        translation.providerRawStatus,

      providerRawErrorCode:
        translation.providerRawErrorCode,

      denialReason:
        "RAW_FAILURE_SURFACE_MISSING",

      translationSummary: [
        ...translation.summary,
      ],

      summary: [
        ...translation.summary,
        "raw_failure_surface_missing",
        "provider_error_not_sanitized",
      ],

    };

  }

  if (
    !containsUnsafeFailureMaterial(
      rawFailureSurface
    )
  ) {

    return {

      sanitizationStatus:
        "PROVIDER_ERROR_NOT_SANITIZED",

      sanitizationDecision:
        input.sanitizationDecision,

      providerErrorSanitized:
        false,

      sanitizationRequired:
        true,

      resultTranslated:
        translation.resultTranslated,

      providerApiCallExecuted:
        translation.providerApiCallExecuted,

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
        translation.providerCallAttempted,

      providerCallCompleted:
        translation.providerCallCompleted,

      providerReference:
        translation.providerReference,

      providerRawStatus:
        translation.providerRawStatus,

      providerRawErrorCode:
        translation.providerRawErrorCode,

      denialReason:
        "RAW_FAILURE_SURFACE_NOT_UNSAFE",

      translationSummary: [
        ...translation.summary,
      ],

      summary: [
        ...translation.summary,
        "raw_failure_surface_not_unsafe",
        "provider_error_not_sanitized",
      ],

    };

  }

  const sanitizedFailureSurface =
    sanitizeFailureSurface(
      rawFailureSurface
    );

  const sanitizedOutput:
    SanitizedProviderOutput = {

      adapterCompatible:
        true,

      providerReference:
        translation.providerReference,

      providerRawStatus:
        translation.providerRawStatus,

      providerRawErrorCode:
        translation.providerRawErrorCode,

      providerCallAttempted:
        translation.providerCallAttempted,

      providerCallCompleted:
        translation.providerCallCompleted,

      failureSurface:
        sanitizedFailureSurface,

      summary: [
        ...translation.summary,
        "provider_error_sanitized",
      ],

    };

  return {

    sanitizationStatus:
      "PROVIDER_ERROR_SANITIZED",

    sanitizationDecision:
      input.sanitizationDecision,

    providerErrorSanitized:
      true,

    sanitizationRequired:
      true,

    resultTranslated:
      translation.resultTranslated,

    providerApiCallExecuted:
      translation.providerApiCallExecuted,

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
      translation.providerCallAttempted,

    providerCallCompleted:
      translation.providerCallCompleted,

    providerReference:
      translation.providerReference,

    providerRawStatus:
      translation.providerRawStatus,

    providerRawErrorCode:
      translation.providerRawErrorCode,

    sanitizedFailureSurface,

    sanitizedOutput,

    translationSummary: [
      ...translation.summary,
    ],

    summary: [
      ...translation.summary,
      "provider_error_sanitized",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Error Sanitization receives
// ProviderResultTranslationResult.
//
// It preserves:
//
// ✓ resultTranslated
// ✓ providerApiCallExecuted
// ✓ providerImplementation
// ✓ providerContract
// ✓ operation
// ✓ providerResourceId
// ✓ providerConfigurationRef
// ✓ providerCredentialRef
// ✓ providerCallAttempted
// ✓ providerCallCompleted
// ✓ providerReference
// ✓ providerRawStatus
// ✓ providerRawErrorCode
// ✓ translationSummary
//
// It validates:
//
// ✓ sanitization required flag
//   corresponds to unsafe raw failure
//   material
//
// It sanitizes:
//
// ✓ provider raw failure message
// ✓ provider raw diagnostic material
// ✓ unsafe provider failure surface
//   fields
//
// It produces:
//
// ✓ adapter-compatible sanitized
//   provider output
//
// It does not:
//
// - translate provider result again
// - execute provider calls
// - verify runtime
// - classify runtime failure
// - decide recovery
// - write evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// SANITIZATION PRINCIPLES
// ============================================================
//
// Provider Result Translation
// ≠
// Provider Error Sanitization
//
// Provider Error Sanitization
// ≠
// Runtime Failure Classification
//
// Sanitized Provider Failure
// ≠
// Runtime Failure Classified
//
// Raw Provider Failure
// ≠
// Sanitized Provider Failure
//
// Sanitization Required
// ≠
// Unsafe Material Assumed
//
// Raw provider outputs may enter P9J.
//
// Only sanitized, adapter-compatible
// outputs may leave P9J.
//
// Sanitization removes unsafe raw
// diagnostic material.
//
// Sanitization preserves safe provider
// status and error-code surfaces.
//
// ============================================================


// ============================================================
// SECURITY OBSERVATION
// ============================================================
//
// Raw provider failure material must
// not leave P9J.
//
// Unsafe raw fields include:
//
// - providerRawErrorMessage
// - providerRawDiagnostic
// - rawErrorMessage
// - errorMessage
// - stack
// - credential
// - credentials
// - token
// - secret
// - keyMaterial
// - payload
//
// Sanitization must produce
// providerSanitizedErrorMessage only.
//
// Sanitization must never expose raw
// provider error messages as sanitized
// content.
//
// If sanitizationRequired is true,
// Provider Error Sanitization must
// verify that unsafe raw failure
// material is actually present before
// producing sanitized output.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - execute provider calls
// - translate provider result again
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
// ✓ receive ProviderResultTranslationResult
//
// ✓ preserve translated provider
//   context
//
// ✓ detect whether sanitization is
//   required
//
// ✓ verify unsafe raw failure material
//   exists when sanitization is
//   required
//
// ✓ sanitize raw provider failure
//   material
//
// ✓ produce adapter-compatible
//   sanitized output
//
// ✓ preserve providerReference
//
// ✓ preserve providerRawStatus
//
// ✓ preserve providerRawErrorCode
//
// ✗ execute provider calls
//
// ✗ translate provider result again
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


