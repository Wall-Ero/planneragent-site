// ============================================================
// PlannerAgent — Provider Result Translation
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/implementations/
// P9J.provider.result.translation.ts
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
// P9J.4 — Provider Result Translation
//
// PURPOSE
// ------------------------------------------------------------
// Receive ProviderApiCallExecutionResult.
//
// Translate raw ProviderImplementationResult
// into adapter-compatible provider
// execution material.
//
// Preserve providerReference.
//
// Preserve providerRawStatus.
//
// Preserve providerRawErrorCode when
// present.
//
// Preserve failure surface internally.
//
// Do not sanitize provider errors yet.
//
// Do not produce final P9I-safe output
// if raw failure material exists.
//
// Do not verify runtime.
//
// Do not classify runtime failure.
//
// Do not decide recovery.
//
// Do not write evidence, ledger,
// or audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider API Call Execution
// produces ProviderImplementationResult.
//
// Provider Result Translation
// translates implementation result
// material into adapter-compatible
// execution material.
//
// Provider Result Translation does not
// sanitize raw provider failure
// material.
//
// Raw Provider Failure
// ≠
// Sanitized Provider Failure
//
// Provider Result Translated
// ≠
// Adapter-Safe Failure Surface
//
// ============================================================

import {
  ProviderAdapterFailureSurface,
} from "../adapters/P9I.provider.adapter.contract";

import {
  ProviderApiCallExecutionResult,
} from "./P9J.provider.api.call.execution";

import {
  ProviderImplementationFailureSurface,
} from "./P9J.provider.implementation.contract";


// ============================================================
// RESULT TRANSLATION STATUS
// ============================================================

export type ProviderResultTranslationStatus =
  | "PROVIDER_RESULT_TRANSLATED"
  | "PROVIDER_RESULT_NOT_TRANSLATED";


// ============================================================
// RESULT TRANSLATION DECISION
// ============================================================

export type ProviderResultTranslationDecision =
  | "TRANSLATE_PROVIDER_RESULT"
  | "REJECT_PROVIDER_RESULT_TRANSLATION";


// ============================================================
// RESULT TRANSLATION DENIAL REASON
// ============================================================

export type ProviderResultTranslationDenialReason =
  | "PROVIDER_API_CALL_NOT_EXECUTED"
  | "PROVIDER_RESULT_TRANSLATION_NOT_ALLOWED";


// ============================================================
// TRANSLATED PROVIDER RESULT
// ============================================================

export interface TranslatedProviderResult {

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

  adapterCompatible:
    boolean;

  requiresErrorSanitization:
    boolean;

  failureSurface?:
    ProviderImplementationFailureSurface;

  summary:
    string[];

}


// ============================================================
// RESULT TRANSLATION INPUT
// ============================================================

export interface ProviderResultTranslationInput {

  execution:
    ProviderApiCallExecutionResult;

  translationDecision:
    ProviderResultTranslationDecision;

}


// ============================================================
// RESULT TRANSLATION RESULT
// ============================================================

export interface ProviderResultTranslationResult {

  translationStatus:
    ProviderResultTranslationStatus;

  translationDecision:
    ProviderResultTranslationDecision;

  resultTranslated:
    boolean;

  providerApiCallExecuted:
    ProviderApiCallExecutionResult["providerApiCallExecuted"];

  providerImplementation:
    ProviderApiCallExecutionResult["providerImplementation"];

  providerContract:
    ProviderApiCallExecutionResult["providerContract"];

  operation:
    ProviderApiCallExecutionResult["operation"];

  providerResourceId:
    ProviderApiCallExecutionResult["providerResourceId"];

  providerConfigurationRef:
    ProviderApiCallExecutionResult["providerConfigurationRef"];

  providerCredentialRef:
    ProviderApiCallExecutionResult["providerCredentialRef"];

  providerCallAttempted:
    ProviderApiCallExecutionResult["providerCallAttempted"];

  providerCallCompleted:
    ProviderApiCallExecutionResult["providerCallCompleted"];

  providerReference?:
    ProviderApiCallExecutionResult["providerReference"];

  providerRawStatus?:
    ProviderApiCallExecutionResult["providerRawStatus"];

  providerRawErrorCode?:
    string;

  translatedResult?:
    TranslatedProviderResult;

  translatedFailureSurface?:
    ProviderAdapterFailureSurface;

  denialReason?:
    ProviderResultTranslationDenialReason;

  executionSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// RAW FAILURE EXTRACTION
// ============================================================

function extractProviderRawErrorCode(
  failureSurface?: ProviderImplementationFailureSurface
): string | undefined {

  return failureSurface?.providerRawErrorCode;

}


// ============================================================
// FAILURE SURFACE TRANSLATION
// ============================================================
//
// This translation is intentionally
// partial.
//
// It preserves failure shape for the
// next sanitization boundary.
//
// It does not sanitize provider raw
// fields.
//
// Therefore the translated failure
// surface is adapter-compatible in
// structure, but not yet P9I-safe when
// raw provider failure material is
// present.
//

function translateFailureSurface(
  failureSurface: ProviderImplementationFailureSurface
): ProviderAdapterFailureSurface {

  return {

    failureCode:
      failureSurface.failureCode,

    providerRawStatus:
      failureSurface.providerRawStatus,

    providerRawErrorCode:
      failureSurface.providerRawErrorCode,

    retryable:
      failureSurface.retryable,

    summary: [
      ...failureSurface.summary,
      "provider_failure_surface_translated",
      "provider_failure_surface_requires_sanitization",
    ],

  };

}


// ============================================================
// RESULT TRANSLATION
// ============================================================

export function translateProviderResult(
  input: ProviderResultTranslationInput
): ProviderResultTranslationResult {

  const execution =
    input.execution;

  if (!execution.providerApiCallExecuted) {

    return {

      translationStatus:
        "PROVIDER_RESULT_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      resultTranslated:
        false,

      providerApiCallExecuted:
        execution.providerApiCallExecuted,

      providerImplementation:
        execution.providerImplementation,

      providerContract:
        execution.providerContract,

      operation:
        execution.operation,

      providerResourceId:
        execution.providerResourceId,

      providerConfigurationRef:
        execution.providerConfigurationRef,

      providerCredentialRef:
        execution.providerCredentialRef,

      providerCallAttempted:
        execution.providerCallAttempted,

      providerCallCompleted:
        execution.providerCallCompleted,

      providerReference:
        execution.providerReference,

      providerRawStatus:
        execution.providerRawStatus,

      providerRawErrorCode:
        extractProviderRawErrorCode(
          execution.failureSurface
        ),

      denialReason:
        "PROVIDER_API_CALL_NOT_EXECUTED",

      executionSummary: [
        ...execution.summary,
      ],

      summary: [
        ...execution.summary,
        "provider_api_call_not_executed",
        "provider_result_not_translated",
      ],

    };

  }

  if (
    input.translationDecision ===
    "REJECT_PROVIDER_RESULT_TRANSLATION"
  ) {

    return {

      translationStatus:
        "PROVIDER_RESULT_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      resultTranslated:
        false,

      providerApiCallExecuted:
        execution.providerApiCallExecuted,

      providerImplementation:
        execution.providerImplementation,

      providerContract:
        execution.providerContract,

      operation:
        execution.operation,

      providerResourceId:
        execution.providerResourceId,

      providerConfigurationRef:
        execution.providerConfigurationRef,

      providerCredentialRef:
        execution.providerCredentialRef,

      providerCallAttempted:
        execution.providerCallAttempted,

      providerCallCompleted:
        execution.providerCallCompleted,

      providerReference:
        execution.providerReference,

      providerRawStatus:
        execution.providerRawStatus,

      providerRawErrorCode:
        extractProviderRawErrorCode(
          execution.failureSurface
        ),

      denialReason:
        "PROVIDER_RESULT_TRANSLATION_NOT_ALLOWED",

      executionSummary: [
        ...execution.summary,
      ],

      summary: [
        ...execution.summary,
        "provider_result_translation_not_allowed",
        "provider_result_not_translated",
      ],

    };

  }

  const providerRawErrorCode =
    extractProviderRawErrorCode(
      execution.failureSurface
    );

  const translatedFailureSurface =
    execution.failureSurface
      ? translateFailureSurface(
          execution.failureSurface
        )
      : undefined;

  const requiresErrorSanitization =
    execution.implementationResult
      .requiresErrorSanitization;

  const translatedResult:
    TranslatedProviderResult = {

      providerReference:
        execution.providerReference,

      providerRawStatus:
        execution.providerRawStatus,

      providerRawErrorCode,

      providerCallAttempted:
        execution.providerCallAttempted,

      providerCallCompleted:
        execution.providerCallCompleted,

      adapterCompatible:
        !requiresErrorSanitization,

      requiresErrorSanitization,

      failureSurface:
        execution.failureSurface,

      summary: [
        ...execution.summary,
        "provider_result_translated",
      ],

    };

  return {

    translationStatus:
      "PROVIDER_RESULT_TRANSLATED",

    translationDecision:
      input.translationDecision,

    resultTranslated:
      true,

    providerApiCallExecuted:
      execution.providerApiCallExecuted,

    providerImplementation:
      execution.providerImplementation,

    providerContract:
      execution.providerContract,

    operation:
      execution.operation,

    providerResourceId:
      execution.providerResourceId,

    providerConfigurationRef:
      execution.providerConfigurationRef,

    providerCredentialRef:
      execution.providerCredentialRef,

    providerCallAttempted:
      execution.providerCallAttempted,

    providerCallCompleted:
      execution.providerCallCompleted,

    providerReference:
      execution.providerReference,

    providerRawStatus:
      execution.providerRawStatus,

    providerRawErrorCode,

    translatedResult,

    translatedFailureSurface,

    executionSummary: [
      ...execution.summary,
    ],

    summary: [
      ...execution.summary,
      requiresErrorSanitization
        ? "provider_result_translated_with_raw_failure_material"
        : "provider_result_translated",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Result Translation receives
// ProviderApiCallExecutionResult.
//
// It preserves:
//
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
// ✓ executionSummary
//
// It translates:
//
// ✓ implementation result material
// ✓ provider failure surface shape
//
// It does not sanitize raw provider
// failure material.
//
// It does not decide whether failure
// material is safe to leave P9J.
//
// That responsibility belongs to
// Provider Error Sanitization.
//
// ============================================================


// ============================================================
// RESULT TRANSLATION PRINCIPLES
// ============================================================
//
// Provider API Call Execution
// ≠
// Provider Result Translation
//
// Provider Result Translation
// ≠
// Provider Error Sanitization
//
// Provider Result Translated
// ≠
// Adapter-Safe Failure Surface
//
// Raw Provider Failure
// ≠
// Sanitized Provider Failure
//
// Result Translation translates
// implementation result material into
// adapter-compatible execution
// material.
//
// Error Sanitization sanitizes raw
// provider failure material before it
// can safely leave P9J.
//
// ============================================================


// ============================================================
// SECURITY OBSERVATION
// ============================================================
//
// Translated provider failure material
// may still contain raw provider
// fields.
//
// Therefore translated provider result
// material must not be treated as P9I-
// safe whenever
// requiresErrorSanitization === true.
//
// Provider Result Translation may
// preserve providerRawErrorCode and
// raw failure shape.
//
// It must not sanitize error message
// material.
//
// It must not remove or rewrite raw
// failure context.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - sanitize provider errors
// - produce final P9I-safe failure
//   output when raw provider failure
//   material exists
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
// ✓ receive ProviderApiCallExecutionResult
//
// ✓ preserve implementation execution
//   context
//
// ✓ translate implementation result
//   into adapter-compatible execution
//   material
//
// ✓ preserve providerReference
//
// ✓ preserve providerRawStatus
//
// ✓ preserve providerRawErrorCode
//   when present
//
// ✓ preserve failure surface
//   internally
//
// ✓ preserve requiresErrorSanitization
//
// ✗ sanitize provider errors
//
// ✗ produce final P9I-safe output when
//   raw failure material exists
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


