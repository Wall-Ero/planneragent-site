// ============================================================
// PlannerAgent — Provider Adapter Result Normalization
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/adapters/
// P9I.provider.adapter.result.normalization.ts
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
// P9I.4 — Provider Adapter Result Normalization
//
// PURPOSE
// ------------------------------------------------------------
// Normalize Provider Adapter execution
// results into contract-safe adapter
// outputs.
//
// Provider Adapter Result Normalization
// normalizes.
//
// It does not execute providers.
//
// It does not verify runtime execution.
//
// It does not classify runtime failure.
//
// It does not decide recovery.
//
// It does not write evidence, ledger,
// or audit.
//
// This file receives
// ProviderAdapterExecutionResult
// and produces
// ProviderAdapterNormalizedResult.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Adapter Execution executes
// adapter boundary.
//
// Provider Adapter Result Normalization
// normalizes adapter execution result.
//
// Provider Adapter Result Normalized
// ≠
// Runtime Verified
//
// Provider Adapter Result Normalized
// ≠
// Runtime Failure Classified
//
// ============================================================

import {
  ProviderAdapterExecutionStatus,
  ProviderAdapterFailureSurface,
} from "./P9I.provider.adapter.contract";

import {
  ProviderAdapterExecutionResult,
} from "./P9I.provider.adapter.execution";


// ============================================================
// NORMALIZATION STATUS
// ============================================================

export type ProviderAdapterNormalizationStatus =
  | "PROVIDER_ADAPTER_RESULT_NORMALIZED"
  | "PROVIDER_ADAPTER_RESULT_NOT_NORMALIZED";


// ============================================================
// NORMALIZATION DENIAL REASON
// ============================================================

export type ProviderAdapterNormalizationDenialReason =
  | "ADAPTER_NOT_EXECUTED"
  | "ADAPTER_RESULT_NORMALIZATION_NOT_ALLOWED";


// ============================================================
// NORMALIZATION DECISION
// ============================================================

export type ProviderAdapterNormalizationDecision =
  | "NORMALIZE_PROVIDER_ADAPTER_RESULT"
  | "REJECT_PROVIDER_ADAPTER_RESULT_NORMALIZATION";


// ============================================================
// NORMALIZED RESULT
// ============================================================

export interface ProviderAdapterNormalizedResult {

  normalizationStatus:
    ProviderAdapterNormalizationStatus;

  normalizationDecision:
    ProviderAdapterNormalizationDecision;

  adapterResultNormalized:
    boolean;

  providerAdapterExecuted:
    ProviderAdapterExecutionResult["providerAdapterExecuted"];

  adapterRequestMapped:
    ProviderAdapterExecutionResult["adapterRequestMapped"];

  executionStatus:
    ProviderAdapterExecutionStatus;

  providerCallAttempted:
    ProviderAdapterExecutionResult["providerCallAttempted"];

  providerCallCompleted:
    ProviderAdapterExecutionResult["providerCallCompleted"];

  providerContract:
    ProviderAdapterExecutionResult["providerContract"];

  providerImplementation:
    ProviderAdapterExecutionResult["providerImplementation"];

  operation:
    ProviderAdapterExecutionResult["operation"];

  providerResourceId:
    ProviderAdapterExecutionResult["providerResourceId"];

  providerConfigurationRef:
    ProviderAdapterExecutionResult["providerConfigurationRef"];

  providerCredentialRef:
    ProviderAdapterExecutionResult["providerCredentialRef"];

  providerReference?:
    ProviderAdapterExecutionResult["providerReference"];

  providerRawStatus?:
    ProviderAdapterExecutionResult["providerRawStatus"];

  failureSurface?:
    ProviderAdapterFailureSurface;

  denialReason?:
    ProviderAdapterNormalizationDenialReason;

  adapterExecutionSummary:
    string[];

  executionSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderAdapterNormalizationInput {

  execution:
    ProviderAdapterExecutionResult;

  normalizationDecision:
    ProviderAdapterNormalizationDecision;

}


// ============================================================
// NORMALIZATION
// ============================================================

export function normalizeProviderAdapterResult(
  input: ProviderAdapterNormalizationInput
): ProviderAdapterNormalizedResult {

  const execution =
    input.execution;

  if (!execution.providerAdapterExecuted) {

    return {

      normalizationStatus:
        "PROVIDER_ADAPTER_RESULT_NOT_NORMALIZED",

      normalizationDecision:
        input.normalizationDecision,

      adapterResultNormalized:
        false,

      providerAdapterExecuted:
        execution.providerAdapterExecuted,

      adapterRequestMapped:
        execution.adapterRequestMapped,

      executionStatus:
        execution.executionStatus,

      providerCallAttempted:
        execution.providerCallAttempted,

      providerCallCompleted:
        execution.providerCallCompleted,

      providerContract:
        execution.providerContract,

      providerImplementation:
        execution.providerImplementation,

      operation:
        execution.operation,

      providerResourceId:
        execution.providerResourceId,

      providerConfigurationRef:
        execution.providerConfigurationRef,

      providerCredentialRef:
        execution.providerCredentialRef,

      providerReference:
        execution.providerReference,

      providerRawStatus:
        execution.providerRawStatus,

      failureSurface:
        execution.failureSurface,

      denialReason:
        "ADAPTER_NOT_EXECUTED",

      adapterExecutionSummary: [
        ...execution.adapterExecutionSummary,
      ],

      executionSummary: [
        ...execution.summary,
      ],

      summary: [
        ...execution.summary,
        "adapter_not_executed",
        "provider_adapter_result_not_normalized",
      ],

    };

  }

  if (
    input.normalizationDecision ===
    "REJECT_PROVIDER_ADAPTER_RESULT_NORMALIZATION"
  ) {

    return {

      normalizationStatus:
        "PROVIDER_ADAPTER_RESULT_NOT_NORMALIZED",

      normalizationDecision:
        input.normalizationDecision,

      adapterResultNormalized:
        false,

      providerAdapterExecuted:
        execution.providerAdapterExecuted,

      adapterRequestMapped:
        execution.adapterRequestMapped,

      executionStatus:
        execution.executionStatus,

      providerCallAttempted:
        execution.providerCallAttempted,

      providerCallCompleted:
        execution.providerCallCompleted,

      providerContract:
        execution.providerContract,

      providerImplementation:
        execution.providerImplementation,

      operation:
        execution.operation,

      providerResourceId:
        execution.providerResourceId,

      providerConfigurationRef:
        execution.providerConfigurationRef,

      providerCredentialRef:
        execution.providerCredentialRef,

      providerReference:
        execution.providerReference,

      providerRawStatus:
        execution.providerRawStatus,

      failureSurface:
        execution.failureSurface,

      denialReason:
        "ADAPTER_RESULT_NORMALIZATION_NOT_ALLOWED",

      adapterExecutionSummary: [
        ...execution.adapterExecutionSummary,
      ],

      executionSummary: [
        ...execution.summary,
      ],

      summary: [
        ...execution.summary,
        "adapter_result_normalization_not_allowed",
        "provider_adapter_result_not_normalized",
      ],

    };

  }

  return {

    normalizationStatus:
      "PROVIDER_ADAPTER_RESULT_NORMALIZED",

    normalizationDecision:
      input.normalizationDecision,

    adapterResultNormalized:
      true,

    providerAdapterExecuted:
      execution.providerAdapterExecuted,

    adapterRequestMapped:
      execution.adapterRequestMapped,

    executionStatus:
      execution.executionStatus,

    providerCallAttempted:
      execution.providerCallAttempted,

    providerCallCompleted:
      execution.providerCallCompleted,

    providerContract:
      execution.providerContract,

    providerImplementation:
      execution.providerImplementation,

    operation:
      execution.operation,

    providerResourceId:
      execution.providerResourceId,

    providerConfigurationRef:
      execution.providerConfigurationRef,

    providerCredentialRef:
      execution.providerCredentialRef,

    providerReference:
      execution.providerReference,

    providerRawStatus:
      execution.providerRawStatus,

    failureSurface:
      execution.failureSurface,

    adapterExecutionSummary: [
      ...execution.adapterExecutionSummary,
    ],

    executionSummary: [
      ...execution.summary,
    ],

    summary: [
      ...execution.summary,
      "provider_adapter_result_normalized",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Adapter Result Normalization
// receives ProviderAdapterExecutionResult.
//
// It preserves:
//
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
// ✓ adapterExecutionSummary
//
// It does not:
//
// - re-run adapter execution
// - call provider APIs
// - call provider SDKs
// - verify runtime execution
// - classify runtime failure
// - decide recovery
//
// ============================================================


// ============================================================
// NORMALIZATION PRINCIPLES
// ============================================================
//
// Provider Adapter Execution
// ≠
// Provider Adapter Result Normalization
//
// Provider Adapter Result Normalization
// ≠
// Provider Runtime Verification
//
// Provider Adapter Result Normalization
// ≠
// Provider Runtime Failure Handling
//
// Provider Adapter Result Normalized
// ≠
// Runtime Verified
//
// Provider Adapter Result Normalized
// ≠
// Runtime Failure Classified
//
// Normalization Decision
// ≠
// Runtime Authorization
//
// Normalization Decision is an
// adapter-layer normalization gate.
//
// It never introduces a new runtime
// authorization boundary.
//
// ============================================================


// ============================================================
// FAILURE SURFACE PRINCIPLE
// ============================================================
//
// Normalization preserves adapter-safe
// failure surfaces.
//
// Normalization does not classify those
// failure surfaces.
//
// ProviderAdapterFailureSurface
// ≠
// Runtime Failure Classification
//
// Sanitized provider failure surfaces
// remain adapter-layer data until
// explicitly handed to runtime domains.
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
// - call AWS APIs
// - call Azure APIs
// - call Google APIs
// - call Vault APIs
// - call HSM APIs
// - call provider SDKs
// - verify runtime execution
// - classify runtime failure
// - decide recovery
// - write evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive ProviderAdapterExecutionResult
//
// ✓ preserve adapter execution context
//
// ✓ preserve provider adapter context
//
// ✓ preserve provider call attempted /
//   completed flags
//
// ✓ preserve provider reference / raw
//   status / failure surface
//
// ✓ normalize adapter execution result
//
// ✓ expose deterministic normalization
//   gate without introducing runtime
//   authorization
//
// ✗ execute providers
//
// ✗ call provider APIs
//
// ✗ call provider SDKs
//
// ✗ verify runtime execution
//
// ✗ classify runtime failure
//
// ✗ decide recovery
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================



