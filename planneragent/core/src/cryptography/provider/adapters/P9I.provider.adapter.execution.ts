// ============================================================
// PlannerAgent — Provider Adapter Execution
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/adapters/
// P9I.provider.adapter.execution.ts
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
// P9I.3 — Provider Adapter Execution
//
// PURPOSE
// ------------------------------------------------------------
// Execute a canonical ProviderAdapterRequest
// against a provider-specific adapter
// execution boundary.
//
// Provider Adapter Execution executes
// adapter requests.
//
// Current P9I.3 execution is an
// adapter execution boundary.
//
// It does not perform concrete
// Provider API calls.
//
// Concrete provider API calls belong
// to provider-specific implementations
// introduced after this contract.
//
// Provider Adapter Execution does not:
//
// - re-authorize runtime
// - re-map adapter request
// - verify runtime execution
// - classify runtime failure
// - decide recovery
// - write evidence
// - write ledger
// - perform audit
//
// This file receives
// ProviderAdapterRequestMappingResult
// and produces ProviderAdapterExecutionResult.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Runtime authorizes runtime
// participation.
//
// Provider Adapter Request Mapping
// materializes adapter request.
//
// Provider Adapter Execution executes
// adapter request boundary.
//
// Provider Adapter Result Normalization
// normalizes provider-specific outputs.
//
// ============================================================

import {
  ProviderAdapterExecutionStatus,
  ProviderAdapterFailureSurface,
  ProviderAdapterRequest,
} from "./P9I.provider.adapter.contract";

import {
  ProviderAdapterRequestMappingResult,
} from "./P9I.provider.adapter.request.mapping";


// ============================================================
// EXECUTION DECISION
// ============================================================

export type ProviderAdapterExecutionDecision =
  | "EXECUTE_PROVIDER_ADAPTER"
  | "REJECT_PROVIDER_ADAPTER_EXECUTION";


// ============================================================
// EXECUTION STATUS
// ============================================================

export type ProviderAdapterExecutionBoundaryStatus =
  | "PROVIDER_ADAPTER_EXECUTED"
  | "PROVIDER_ADAPTER_NOT_EXECUTED";


// ============================================================
// DENIAL REASON
// ============================================================

export type ProviderAdapterExecutionDenialReason =
  | "ADAPTER_REQUEST_NOT_MAPPED"
  | "ADAPTER_EXECUTION_NOT_ALLOWED";


// ============================================================
// INPUT
// ============================================================

export interface ProviderAdapterExecutionInput {

  mapping:
    ProviderAdapterRequestMappingResult;

  executionDecision:
    ProviderAdapterExecutionDecision;

  adapterExecutionSummary?:
    string[];

  providerReference?:
    string;

  providerRawStatus?:
    string;

  failureSurface?:
    ProviderAdapterFailureSurface;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderAdapterExecutionResult {

  executionBoundaryStatus:
    ProviderAdapterExecutionBoundaryStatus;

  executionStatus:
    ProviderAdapterExecutionStatus;

  providerAdapterExecuted:
    boolean;

  adapterRequestMapped:
    ProviderAdapterRequestMappingResult["adapterRequestMapped"];

  providerContract:
    ProviderAdapterRequestMappingResult["providerContract"];

  providerImplementation:
    ProviderAdapterRequestMappingResult["providerImplementation"];

  operation:
    ProviderAdapterRequestMappingResult["operation"];

  providerResourceId:
    ProviderAdapterRequestMappingResult["providerResourceId"];

  providerConfigurationRef:
    ProviderAdapterRequestMappingResult["providerConfigurationRef"];

  providerCredentialRef:
    ProviderAdapterRequestMappingResult["providerCredentialRef"];

  adapterRequest?:
    ProviderAdapterRequest;

  providerCallAttempted:
    boolean;

  providerCallCompleted:
    boolean;

  providerReference?:
    string;

  providerRawStatus?:
    string;

  failureSurface?:
    ProviderAdapterFailureSurface;

  adapterExecutionSummary:
    string[];

  denialReason?:
    ProviderAdapterExecutionDenialReason;

  mappingSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// EXECUTION
// ============================================================

export function executeProviderAdapter(
  input: ProviderAdapterExecutionInput
): ProviderAdapterExecutionResult {

  const mapping =
    input.mapping;

  if (!mapping.adapterRequestMapped) {

    return {

      executionBoundaryStatus:
        "PROVIDER_ADAPTER_NOT_EXECUTED",

      executionStatus:
        "PROVIDER_ADAPTER_EXECUTION_FAILED",

      providerAdapterExecuted:
        false,

      adapterRequestMapped:
        mapping.adapterRequestMapped,

      providerContract:
        mapping.providerContract,

      providerImplementation:
        mapping.providerImplementation,

      operation:
        mapping.operation,

      providerResourceId:
        mapping.providerResourceId,

      providerConfigurationRef:
        mapping.providerConfigurationRef,

      providerCredentialRef:
        mapping.providerCredentialRef,

      adapterRequest:
        mapping.adapterRequest,

      providerCallAttempted:
        false,

      providerCallCompleted:
        false,

      adapterExecutionSummary: [],

      denialReason:
        "ADAPTER_REQUEST_NOT_MAPPED",

      mappingSummary: [
        ...mapping.summary,
      ],

      summary: [
        ...mapping.summary,
        "adapter_request_not_mapped",
        "provider_adapter_not_executed",
      ],

    };

  }

  if (
    input.executionDecision ===
    "REJECT_PROVIDER_ADAPTER_EXECUTION"
  ) {

    return {

      executionBoundaryStatus:
        "PROVIDER_ADAPTER_NOT_EXECUTED",

      executionStatus:
        "PROVIDER_ADAPTER_EXECUTION_FAILED",

      providerAdapterExecuted:
        false,

      adapterRequestMapped:
        mapping.adapterRequestMapped,

      providerContract:
        mapping.providerContract,

      providerImplementation:
        mapping.providerImplementation,

      operation:
        mapping.operation,

      providerResourceId:
        mapping.providerResourceId,

      providerConfigurationRef:
        mapping.providerConfigurationRef,

      providerCredentialRef:
        mapping.providerCredentialRef,

      adapterRequest:
        mapping.adapterRequest,

      providerCallAttempted:
        false,

      providerCallCompleted:
        false,

      adapterExecutionSummary: [],

      denialReason:
        "ADAPTER_EXECUTION_NOT_ALLOWED",

      mappingSummary: [
        ...mapping.summary,
      ],

      summary: [
        ...mapping.summary,
        "adapter_execution_not_allowed",
        "provider_adapter_not_executed",
      ],

    };

  }

  const providerCallCompleted =
    !input.failureSurface;

  const executionStatus:
    ProviderAdapterExecutionStatus =
      providerCallCompleted
        ? "PROVIDER_ADAPTER_EXECUTION_COMPLETED"
        : "PROVIDER_ADAPTER_EXECUTION_FAILED";

  return {

    executionBoundaryStatus:
      "PROVIDER_ADAPTER_EXECUTED",

    executionStatus,

    providerAdapterExecuted:
      true,

    adapterRequestMapped:
      mapping.adapterRequestMapped,

    providerContract:
      mapping.providerContract,

    providerImplementation:
      mapping.providerImplementation,

    operation:
      mapping.operation,

    providerResourceId:
      mapping.providerResourceId,

    providerConfigurationRef:
      mapping.providerConfigurationRef,

    providerCredentialRef:
      mapping.providerCredentialRef,

    adapterRequest:
      mapping.adapterRequest,

    providerCallAttempted:
      true,

    providerCallCompleted,

    providerReference:
      input.providerReference,

    providerRawStatus:
      input.providerRawStatus,

    failureSurface:
      input.failureSurface,

    adapterExecutionSummary: [
      ...(input.adapterExecutionSummary ?? []),
    ],

    mappingSummary: [
      ...mapping.summary,
    ],

    summary: [
      ...mapping.summary,
      ...(input.adapterExecutionSummary ?? []),
      providerCallCompleted
        ? "provider_adapter_execution_completed"
        : "provider_adapter_execution_failed",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Adapter Execution receives a
// ProviderAdapterRequestMappingResult.
//
// It preserves:
//
// ✓ adapterRequestMapped
// ✓ providerContract
// ✓ providerImplementation
// ✓ operation
// ✓ providerResourceId
// ✓ providerConfigurationRef
// ✓ providerCredentialRef
// ✓ mappingSummary
//
// It adds execution-boundary material:
//
// ✓ providerAdapterExecuted
// ✓ executionStatus
// ✓ providerCallAttempted
// ✓ providerCallCompleted
// ✓ providerReference
// ✓ providerRawStatus
// ✓ failureSurface
// ✓ adapterExecutionSummary
//
// It never:
//
// - re-runs runtime authorization
// - re-runs adapter request mapping
// - verifies provider runtime
// - classifies runtime failure
// - decides recovery
//
// ============================================================


// ============================================================
// EXECUTION BOUNDARY PRINCIPLES
// ============================================================
//
// Provider Adapter Request Mapping
// ≠
// Provider Adapter Execution
//
// Provider Adapter Execution
// ≠
// Provider Adapter Result Normalization
//
// Provider Adapter Execution
// ≠
// Provider API Call
//
// Provider Adapter Execution
// ≠
// Concrete Provider SDK Execution
//
// Execution Decision
// ≠
// Runtime Authorization
//
// Runtime Authorization belongs to
// Provider Runtime.
//
// Execution Decision is an adapter-
// layer execution gate controlling
// whether an already mapped adapter
// request may cross the execution
// boundary.
//
// It never introduces a new runtime
// authorization boundary.
//
// ============================================================


// ============================================================
// EXECUTION STATUS OBSERVATION
// ============================================================
//
// ProviderAdapterExecutionStatus
// describes the outcome of adapter
// execution at the adapter layer.
//
// It does not classify runtime
// legitimacy.
//
// It does not classify recovery.
//
// It does not classify governance.
//
// It only states whether adapter
// execution completed or failed.
//
// ============================================================


// ============================================================
// FAILURE SURFACE OBSERVATION
// ============================================================
//
// ProviderAdapterExecutionResult may
// carry a ProviderAdapterFailureSurface.
//
// That surface preserves adapter-safe
// provider failure output.
//
// It does not classify runtime failure.
//
// It does not decide recovery.
//
// Runtime domains may later normalize,
// verify, preserve, or classify the
// execution result.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - re-authorize runtime
// - re-map adapter request
// - verify runtime execution
// - classify runtime failure
// - decide recovery
// - call AWS APIs
// - call Azure APIs
// - call Google APIs
// - call Vault APIs
// - call HSM APIs
// - execute concrete provider SDK calls
// - write evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive ProviderAdapterRequestMappingResult
//
// ✓ preserve mapped adapter request
//
// ✓ preserve provider adapter context
//
// ✓ preserve mapping summary
//
// ✓ execute provider adapter boundary
//
// ✓ expose provider call attempted /
//   completed flags
//
// ✓ preserve provider reference / raw
//   status / failure surface
//
// ✓ expose deterministic adapter
//   execution gate without introducing
//   new runtime authorization
//
// ✗ re-authorize runtime
//
// ✗ re-map adapter request
//
// ✗ verify runtime execution
//
// ✗ classify runtime failure
//
// ✗ decide recovery
//
// ✗ call provider APIs
//
// ✗ call provider SDKs
//
// ✗ execute concrete provider operations
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================


