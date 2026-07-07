// ============================================================
// PlannerAgent — Provider Adapter Verification Hook
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/adapters/
// P9I.provider.adapter.verification.hook.ts
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
// P9I.6 — Provider Adapter Verification Hook
//
// PURPOSE
// ------------------------------------------------------------
// Receive ProviderAdapterFailureSurfaceResult.
//
// Preserve normalized adapter outcome.
//
// Expose adapter result to the runtime
// verification boundary.
//
// Provider Adapter Verification Hook
// does not verify runtime.
//
// It does not classify runtime failure.
//
// It does not decide recovery.
//
// It does not write evidence, ledger,
// or audit.
//
// This file receives
// ProviderAdapterFailureSurfaceResult
// and produces
// ProviderAdapterVerificationHookResult.
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
// preserves sanitized adapter failure
// surface.
//
// Provider Adapter Verification Hook
// exposes adapter-safe execution
// output to runtime verification
// boundary.
//
// It does not perform runtime
// verification itself.
//
// ============================================================

import {
  ProviderAdapterFailureSurface,
} from "./P9I.provider.adapter.contract";

import {
  ProviderAdapterFailureSurfaceResult,
} from "./P9I.provider.adapter.failure.surface";


// ============================================================
// HOOK STATUS
// ============================================================

export type ProviderAdapterVerificationHookStatus =
  | "PROVIDER_ADAPTER_VERIFICATION_HOOK_EXPOSED"
  | "PROVIDER_ADAPTER_VERIFICATION_HOOK_NOT_EXPOSED";


// ============================================================
// HOOK DENIAL REASON
// ============================================================

export type ProviderAdapterVerificationHookDenialReason =
  | "ADAPTER_RESULT_NOT_NORMALIZED"
  | "ADAPTER_HOOK_NOT_ALLOWED";


// ============================================================
// HOOK DECISION
// ============================================================

export type ProviderAdapterVerificationHookDecision =
  | "EXPOSE_PROVIDER_ADAPTER_VERIFICATION_HOOK"
  | "REJECT_PROVIDER_ADAPTER_VERIFICATION_HOOK";


// ============================================================
// RESULT
// ============================================================

export interface ProviderAdapterVerificationHookResult {

  hookStatus:
    ProviderAdapterVerificationHookStatus;

  hookExposed:
    boolean;

  adapterResultNormalized:
    ProviderAdapterFailureSurfaceResult["adapterResultNormalized"];

  failureSurfacePreserved:
    ProviderAdapterFailureSurfaceResult["failureSurfacePreserved"];

  providerAdapterExecuted:
    ProviderAdapterFailureSurfaceResult["providerAdapterExecuted"];

  adapterRequestMapped:
    ProviderAdapterFailureSurfaceResult["adapterRequestMapped"];

  executionStatus:
    ProviderAdapterFailureSurfaceResult["executionStatus"];

  providerCallAttempted:
    ProviderAdapterFailureSurfaceResult["providerCallAttempted"];

  providerCallCompleted:
    ProviderAdapterFailureSurfaceResult["providerCallCompleted"];

  providerContract:
    ProviderAdapterFailureSurfaceResult["providerContract"];

  providerImplementation:
    ProviderAdapterFailureSurfaceResult["providerImplementation"];

  operation:
    ProviderAdapterFailureSurfaceResult["operation"];

  providerResourceId:
    ProviderAdapterFailureSurfaceResult["providerResourceId"];

  providerConfigurationRef:
    ProviderAdapterFailureSurfaceResult["providerConfigurationRef"];

  providerCredentialRef:
    ProviderAdapterFailureSurfaceResult["providerCredentialRef"];

  providerReference?:
    ProviderAdapterFailureSurfaceResult["providerReference"];

  providerRawStatus?:
    ProviderAdapterFailureSurfaceResult["providerRawStatus"];

  failureSurface?:
    ProviderAdapterFailureSurface;

  denialReason?:
    ProviderAdapterVerificationHookDenialReason;

  failureSurfaceSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderAdapterVerificationHookInput {

  failureSurface:
    ProviderAdapterFailureSurfaceResult;

  hookDecision:
    ProviderAdapterVerificationHookDecision;

}


// ============================================================
// VERIFICATION HOOK
// ============================================================

export function exposeProviderAdapterVerificationHook(
  input: ProviderAdapterVerificationHookInput
): ProviderAdapterVerificationHookResult {

  const failureSurfaceResult =
    input.failureSurface;

  if (!failureSurfaceResult.adapterResultNormalized) {

    return {

      hookStatus:
        "PROVIDER_ADAPTER_VERIFICATION_HOOK_NOT_EXPOSED",

      hookExposed:
        false,

      adapterResultNormalized:
        failureSurfaceResult.adapterResultNormalized,

      failureSurfacePreserved:
        failureSurfaceResult.failureSurfacePreserved,

      providerAdapterExecuted:
        failureSurfaceResult.providerAdapterExecuted,

      adapterRequestMapped:
        failureSurfaceResult.adapterRequestMapped,

      executionStatus:
        failureSurfaceResult.executionStatus,

      providerCallAttempted:
        failureSurfaceResult.providerCallAttempted,

      providerCallCompleted:
        failureSurfaceResult.providerCallCompleted,

      providerContract:
        failureSurfaceResult.providerContract,

      providerImplementation:
        failureSurfaceResult.providerImplementation,

      operation:
        failureSurfaceResult.operation,

      providerResourceId:
        failureSurfaceResult.providerResourceId,

      providerConfigurationRef:
        failureSurfaceResult.providerConfigurationRef,

      providerCredentialRef:
        failureSurfaceResult.providerCredentialRef,

      providerReference:
        failureSurfaceResult.providerReference,

      providerRawStatus:
        failureSurfaceResult.providerRawStatus,

      failureSurface:
        failureSurfaceResult.failureSurface,

      denialReason:
        "ADAPTER_RESULT_NOT_NORMALIZED",

      failureSurfaceSummary: [
        ...failureSurfaceResult.summary,
      ],

      summary: [
        ...failureSurfaceResult.summary,
        "adapter_result_not_normalized",
        "provider_adapter_verification_hook_not_exposed",
      ],

    };

  }

  if (
    input.hookDecision ===
    "REJECT_PROVIDER_ADAPTER_VERIFICATION_HOOK"
  ) {

    return {

      hookStatus:
        "PROVIDER_ADAPTER_VERIFICATION_HOOK_NOT_EXPOSED",

      hookExposed:
        false,

      adapterResultNormalized:
        failureSurfaceResult.adapterResultNormalized,

      failureSurfacePreserved:
        failureSurfaceResult.failureSurfacePreserved,

      providerAdapterExecuted:
        failureSurfaceResult.providerAdapterExecuted,

      adapterRequestMapped:
        failureSurfaceResult.adapterRequestMapped,

      executionStatus:
        failureSurfaceResult.executionStatus,

      providerCallAttempted:
        failureSurfaceResult.providerCallAttempted,

      providerCallCompleted:
        failureSurfaceResult.providerCallCompleted,

      providerContract:
        failureSurfaceResult.providerContract,

      providerImplementation:
        failureSurfaceResult.providerImplementation,

      operation:
        failureSurfaceResult.operation,

      providerResourceId:
        failureSurfaceResult.providerResourceId,

      providerConfigurationRef:
        failureSurfaceResult.providerConfigurationRef,

      providerCredentialRef:
        failureSurfaceResult.providerCredentialRef,

      providerReference:
        failureSurfaceResult.providerReference,

      providerRawStatus:
        failureSurfaceResult.providerRawStatus,

      failureSurface:
        failureSurfaceResult.failureSurface,

      denialReason:
        "ADAPTER_HOOK_NOT_ALLOWED",

      failureSurfaceSummary: [
        ...failureSurfaceResult.summary,
      ],

      summary: [
        ...failureSurfaceResult.summary,
        "adapter_hook_not_allowed",
        "provider_adapter_verification_hook_not_exposed",
      ],

    };

  }

  return {

    hookStatus:
      "PROVIDER_ADAPTER_VERIFICATION_HOOK_EXPOSED",

    hookExposed:
      true,

    adapterResultNormalized:
      failureSurfaceResult.adapterResultNormalized,

    failureSurfacePreserved:
      failureSurfaceResult.failureSurfacePreserved,

    providerAdapterExecuted:
      failureSurfaceResult.providerAdapterExecuted,

    adapterRequestMapped:
      failureSurfaceResult.adapterRequestMapped,

    executionStatus:
      failureSurfaceResult.executionStatus,

    providerCallAttempted:
      failureSurfaceResult.providerCallAttempted,

    providerCallCompleted:
      failureSurfaceResult.providerCallCompleted,

    providerContract:
      failureSurfaceResult.providerContract,

    providerImplementation:
      failureSurfaceResult.providerImplementation,

    operation:
      failureSurfaceResult.operation,

    providerResourceId:
      failureSurfaceResult.providerResourceId,

    providerConfigurationRef:
      failureSurfaceResult.providerConfigurationRef,

    providerCredentialRef:
      failureSurfaceResult.providerCredentialRef,

    providerReference:
      failureSurfaceResult.providerReference,

    providerRawStatus:
      failureSurfaceResult.providerRawStatus,

    failureSurface:
      failureSurfaceResult.failureSurface,

    failureSurfaceSummary: [
      ...failureSurfaceResult.summary,
    ],

    summary: [
      ...failureSurfaceResult.summary,
      "provider_adapter_verification_hook_exposed",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Adapter Verification Hook
// receives ProviderAdapterFailureSurfaceResult.
//
// It preserves:
//
// ✓ adapterResultNormalized
// ✓ failureSurfacePreserved
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
// ✓ failureSurfaceSummary
//
// It never:
//
// - executes providers
// - re-runs adapter execution
// - re-runs result normalization
// - re-runs failure surface preservation
// - verifies runtime execution
// - classifies runtime failure
// - decides recovery
// - writes evidence
// - writes ledger
// - performs audit
//
// ============================================================


// ============================================================
// VERIFICATION HOOK PRINCIPLES
// ============================================================
//
// Provider Adapter Failure Surface
// ≠
// Provider Adapter Verification Hook
//
// Provider Adapter Verification Hook
// ≠
// Provider Runtime Verification
//
// Adapter Hook Exposed
// ≠
// Runtime Verified
//
// Adapter Failure Surface Preserved
// ≠
// Runtime Failure Classified
//
// Hook exposure makes adapter-safe
// execution output available to the
// runtime verification boundary.
//
// It does not verify runtime outcome.
//
// It does not classify runtime
// failure.
//
// ============================================================


// ============================================================
// HOOK DECISION OBSERVATION
// ============================================================
//
// ProviderAdapterVerificationHookDecision
// is not runtime verification.
//
// It is an adapter-layer exposure gate
// controlling whether an already
// normalized adapter outcome may be
// exposed to runtime verification
// boundary.
//
// Runtime verification belongs to the
// Provider Runtime family.
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
// - re-run failure surface preservation
// - call AWS APIs
// - call Azure APIs
// - call Google APIs
// - call Vault APIs
// - call HSM APIs
// - call provider SDKs
// - verify runtime execution
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
// ✓ receive ProviderAdapterFailureSurfaceResult
//
// ✓ preserve normalized adapter outcome
//
// ✓ preserve sanitized adapter failure
//   surface result
//
// ✓ expose adapter result to runtime
//   verification boundary
//
// ✓ preserve failure surface summary
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


