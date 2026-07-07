// ============================================================
// PlannerAgent — Provider Adapter Failure Surface
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/adapters/
// P9I.provider.adapter.failure.surface.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Provider Adapters
//
// DOMAIN
// ------------------------------------------------------------
// P9I.5 — Provider Adapter Failure Surface
//
// PURPOSE
// ------------------------------------------------------------
// Preserve adapter-safe provider
// failure surfaces from normalized
// adapter results.
//
// Provider Adapter Failure Surface
// preserves sanitized provider failure
// details.
//
// It does not classify runtime failure.
//
// It does not retry providers.
//
// It does not decide recovery.
//
// It does not write evidence, ledger,
// or audit.
//
// This file receives
// ProviderAdapterNormalizedResult
// and produces
// ProviderAdapterFailureSurfaceResult.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Adapter Execution executes
// adapter boundary.
//
// Provider Adapter Result Normalization
// normalizes adapter result.
//
// Provider Adapter Failure Surface
// preserves sanitized provider failure
// surface.
//
// Adapter Failure Surface
// ≠
// Runtime Failure Classification
//
// Raw Failure Surface
// ≠
// Sanitized Failure Surface
//
// ============================================================

import {
  ProviderAdapterFailureSurface,
} from "./P9I.provider.adapter.contract";

import {
  ProviderAdapterNormalizedResult,
} from "./P9I.provider.adapter.result.normalization";


// ============================================================
// FAILURE SURFACE STATUS
// ============================================================

export type ProviderAdapterFailureSurfaceStatus =
  | "PROVIDER_ADAPTER_FAILURE_SURFACE_PRESERVED"
  | "PROVIDER_ADAPTER_FAILURE_SURFACE_NOT_PRESERVED";


// ============================================================
// FAILURE SURFACE DENIAL REASON
// ============================================================

export type ProviderAdapterFailureSurfaceDenialReason =
  | "NO_ADAPTER_FAILURE_SURFACE"
  | "ADAPTER_RESULT_NOT_NORMALIZED"
  | "UNSANITIZED_FAILURE_SURFACE";


// ============================================================
// FAILURE SURFACE PRESERVATION RESULT
// ============================================================

export interface ProviderAdapterFailureSurfaceResult {

  failureSurfaceStatus:
    ProviderAdapterFailureSurfaceStatus;

  failureSurfacePreserved:
    boolean;

  adapterResultNormalized:
    ProviderAdapterNormalizedResult["adapterResultNormalized"];

  providerAdapterExecuted:
    ProviderAdapterNormalizedResult["providerAdapterExecuted"];

  adapterRequestMapped:
    ProviderAdapterNormalizedResult["adapterRequestMapped"];

  executionStatus:
    ProviderAdapterNormalizedResult["executionStatus"];

  providerCallAttempted:
    ProviderAdapterNormalizedResult["providerCallAttempted"];

  providerCallCompleted:
    ProviderAdapterNormalizedResult["providerCallCompleted"];

  providerContract:
    ProviderAdapterNormalizedResult["providerContract"];

  providerImplementation:
    ProviderAdapterNormalizedResult["providerImplementation"];

  operation:
    ProviderAdapterNormalizedResult["operation"];

  providerResourceId:
    ProviderAdapterNormalizedResult["providerResourceId"];

  providerConfigurationRef:
    ProviderAdapterNormalizedResult["providerConfigurationRef"];

  providerCredentialRef:
    ProviderAdapterNormalizedResult["providerCredentialRef"];

  providerReference?:
    ProviderAdapterNormalizedResult["providerReference"];

  providerRawStatus?:
    ProviderAdapterNormalizedResult["providerRawStatus"];

  failureSurface?:
    ProviderAdapterFailureSurface;

  denialReason?:
    ProviderAdapterFailureSurfaceDenialReason;

  normalizedSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderAdapterFailureSurfaceInput {

  normalized:
    ProviderAdapterNormalizedResult;

}


// ============================================================
// FAILURE SURFACE GUARD
// ============================================================

function isFailureSurfaceSanitized(
  failureSurface: ProviderAdapterFailureSurface
): boolean {

  const unsafeKeys = [

    "providerRawErrorMessage",

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

  return !unsafeKeys.some(
    (key) =>
      Object.prototype.hasOwnProperty.call(
        failureSurface,
        key
      )
  );

}


// ============================================================
// FAILURE SURFACE PRESERVATION
// ============================================================

export function preserveProviderAdapterFailureSurface(
  input: ProviderAdapterFailureSurfaceInput
): ProviderAdapterFailureSurfaceResult {

  const normalized =
    input.normalized;

  if (!normalized.adapterResultNormalized) {

    return {

      failureSurfaceStatus:
        "PROVIDER_ADAPTER_FAILURE_SURFACE_NOT_PRESERVED",

      failureSurfacePreserved:
        false,

      adapterResultNormalized:
        normalized.adapterResultNormalized,

      providerAdapterExecuted:
        normalized.providerAdapterExecuted,

      adapterRequestMapped:
        normalized.adapterRequestMapped,

      executionStatus:
        normalized.executionStatus,

      providerCallAttempted:
        normalized.providerCallAttempted,

      providerCallCompleted:
        normalized.providerCallCompleted,

      providerContract:
        normalized.providerContract,

      providerImplementation:
        normalized.providerImplementation,

      operation:
        normalized.operation,

      providerResourceId:
        normalized.providerResourceId,

      providerConfigurationRef:
        normalized.providerConfigurationRef,

      providerCredentialRef:
        normalized.providerCredentialRef,

      providerReference:
        normalized.providerReference,

      providerRawStatus:
        normalized.providerRawStatus,

      failureSurface:
        normalized.failureSurface,

      denialReason:
        "ADAPTER_RESULT_NOT_NORMALIZED",

      normalizedSummary: [
        ...normalized.summary,
      ],

      summary: [
        ...normalized.summary,
        "adapter_result_not_normalized",
        "provider_adapter_failure_surface_not_preserved",
      ],

    };

  }

  if (!normalized.failureSurface) {

    return {

      failureSurfaceStatus:
        "PROVIDER_ADAPTER_FAILURE_SURFACE_NOT_PRESERVED",

      failureSurfacePreserved:
        false,

      adapterResultNormalized:
        normalized.adapterResultNormalized,

      providerAdapterExecuted:
        normalized.providerAdapterExecuted,

      adapterRequestMapped:
        normalized.adapterRequestMapped,

      executionStatus:
        normalized.executionStatus,

      providerCallAttempted:
        normalized.providerCallAttempted,

      providerCallCompleted:
        normalized.providerCallCompleted,

      providerContract:
        normalized.providerContract,

      providerImplementation:
        normalized.providerImplementation,

      operation:
        normalized.operation,

      providerResourceId:
        normalized.providerResourceId,

      providerConfigurationRef:
        normalized.providerConfigurationRef,

      providerCredentialRef:
        normalized.providerCredentialRef,

      providerReference:
        normalized.providerReference,

      providerRawStatus:
        normalized.providerRawStatus,

      failureSurface:
        normalized.failureSurface,

      denialReason:
        "NO_ADAPTER_FAILURE_SURFACE",

      normalizedSummary: [
        ...normalized.summary,
      ],

      summary: [
        ...normalized.summary,
        "no_adapter_failure_surface",
        "provider_adapter_failure_surface_not_preserved",
      ],

    };

  }

  if (
    !isFailureSurfaceSanitized(
      normalized.failureSurface
    )
  ) {

    return {

      failureSurfaceStatus:
        "PROVIDER_ADAPTER_FAILURE_SURFACE_NOT_PRESERVED",

      failureSurfacePreserved:
        false,

      adapterResultNormalized:
        normalized.adapterResultNormalized,

      providerAdapterExecuted:
        normalized.providerAdapterExecuted,

      adapterRequestMapped:
        normalized.adapterRequestMapped,

      executionStatus:
        normalized.executionStatus,

      providerCallAttempted:
        normalized.providerCallAttempted,

      providerCallCompleted:
        normalized.providerCallCompleted,

      providerContract:
        normalized.providerContract,

      providerImplementation:
        normalized.providerImplementation,

      operation:
        normalized.operation,

      providerResourceId:
        normalized.providerResourceId,

      providerConfigurationRef:
        normalized.providerConfigurationRef,

      providerCredentialRef:
        normalized.providerCredentialRef,

      providerReference:
        normalized.providerReference,

      providerRawStatus:
        normalized.providerRawStatus,

      failureSurface:
        normalized.failureSurface,

      denialReason:
        "UNSANITIZED_FAILURE_SURFACE",

      normalizedSummary: [
        ...normalized.summary,
      ],

      summary: [
        ...normalized.summary,
        "unsanitized_failure_surface",
        "provider_adapter_failure_surface_not_preserved",
      ],

    };

  }

  return {

    failureSurfaceStatus:
      "PROVIDER_ADAPTER_FAILURE_SURFACE_PRESERVED",

    failureSurfacePreserved:
      true,

    adapterResultNormalized:
      normalized.adapterResultNormalized,

    providerAdapterExecuted:
      normalized.providerAdapterExecuted,

    adapterRequestMapped:
      normalized.adapterRequestMapped,

    executionStatus:
      normalized.executionStatus,

    providerCallAttempted:
      normalized.providerCallAttempted,

    providerCallCompleted:
      normalized.providerCallCompleted,

    providerContract:
      normalized.providerContract,

    providerImplementation:
      normalized.providerImplementation,

    operation:
      normalized.operation,

    providerResourceId:
      normalized.providerResourceId,

    providerConfigurationRef:
      normalized.providerConfigurationRef,

    providerCredentialRef:
      normalized.providerCredentialRef,

    providerReference:
      normalized.providerReference,

    providerRawStatus:
      normalized.providerRawStatus,

    failureSurface:
      normalized.failureSurface,

    normalizedSummary: [
      ...normalized.summary,
    ],

    summary: [
      ...normalized.summary,
      "provider_adapter_failure_surface_preserved",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Adapter Failure Surface
// receives ProviderAdapterNormalizedResult.
//
// It preserves adapter-safe failure
// surface data only after normalization.
//
// It preserves:
//
// ✓ adapterResultNormalized
// ✓ providerAdapterExecuted
// ✓ adapterRequestMapped
// ✓ executionStatus
// ✓ providerCallAttempted
// ✓ providerCallCompleted
// ✓ providerContract
// ✓ providerImplementation
// ✓ operation
// ✓ providerResourceId
// ✓ providerConfigurationRef
// ✓ providerCredentialRef
// ✓ providerReference
// ✓ providerRawStatus
// ✓ failureSurface
// ✓ normalizedSummary
//
// It never:
//
// - executes providers
// - re-runs normalization
// - classifies runtime failure
// - decides recovery
// - writes evidence
// - writes ledger
// - performs audit
//
// ============================================================


// ============================================================
// SECURITY OBSERVATION
// ============================================================
//
// Raw provider failure surfaces must
// not be preserved blindly.
//
// ProviderAdapterFailureSurface must
// contain sanitized provider error
// content only.
//
// providerSanitizedErrorMessage
// is permitted.
//
// providerRawErrorMessage
// is not permitted.
//
// Sensitive provider payloads,
// credentials, tokens, key material,
// secret references, and confidential
// provider metadata must never be
// preserved as raw failure content.
//
// Sanitization guards must reject known
// unsafe raw diagnostic fields, even
// when they are introduced through
// runtime objects, casts, or provider
// SDK payloads.
//
// ============================================================


// ============================================================
// FAILURE SURFACE PRINCIPLES
// ============================================================
//
// Provider Adapter Result Normalization
// ≠
// Provider Adapter Failure Surface
//
// Provider Adapter Failure Surface
// ≠
// Runtime Failure Classification
//
// Failure Surface Preserved
// ≠
// Runtime Failure Classified
//
// Raw Failure Surface
// ≠
// Sanitized Failure Surface
//
// Adapter failure surfaces are
// preserved for runtime consumption.
//
// Runtime domains decide whether and
// how to classify them.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - execute providers
// - re-run adapter execution
// - re-run result normalization
// - call AWS APIs
// - call Azure APIs
// - call Google APIs
// - call Vault APIs
// - call HSM APIs
// - call provider SDKs
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
// ✓ receive ProviderAdapterNormalizedResult
//
// ✓ preserve normalized adapter context
//
// ✓ preserve sanitized failure surface
//
// ✓ reject unsanitized failure surface
//
// ✓ preserve normalized summary
//
// ✗ execute providers
//
// ✗ re-run normalization
//
// ✗ classify runtime failure
//
// ✗ decide recovery
//
// ✗ persist evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================


