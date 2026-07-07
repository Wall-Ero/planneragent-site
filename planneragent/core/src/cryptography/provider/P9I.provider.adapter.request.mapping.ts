// ============================================================
// PlannerAgent — Provider Adapter Request Mapping
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/adapters/
// P9I.provider.adapter.request.mapping.ts
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
// P9I.2 — Provider Adapter Request Mapping
//
// PURPOSE
// ------------------------------------------------------------
// Map runtime-approved provider context
// into a canonical ProviderAdapterRequest.
//
// Provider Adapter Request Mapping
// materializes runtime-approved
// provider context as a stable adapter
// request.
//
// It does not execute providers.
//
// It does not re-authorize runtime.
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
// Provider Runtime decides whether a
// provider operation may proceed.
//
// Provider Adapter Request Mapping
// materializes that approved runtime
// context as a canonical
// ProviderAdapterRequest.
//
// It never executes the provider.
//
// It never reinterprets runtime
// decisions.
//
// ============================================================

import {
  ProviderRecoveryBridgeResult,
} from "./P9H.provider.recovery.bridge";

import {
  ProviderAdapterRequest,
} from "./adapters/P9I.provider.adapter.contract";


// ============================================================
// MAPPING STATUS
// ============================================================

export type ProviderAdapterRequestMappingStatus =
  | "PROVIDER_ADAPTER_REQUEST_MAPPED"
  | "PROVIDER_ADAPTER_REQUEST_NOT_MAPPED";


// ============================================================
// MAPPING DECISION
// ============================================================

export type ProviderAdapterRequestMappingDecision =
  | "MAP_PROVIDER_ADAPTER_REQUEST"
  | "REJECT_PROVIDER_ADAPTER_REQUEST";


// ============================================================
// DENIAL REASON
// ============================================================

export type ProviderAdapterRequestMappingDenialReason =
  | "PROVIDER_NOT_RESOLVED"
  | "PROVIDER_NOT_ADMITTED"
  | "PROVIDER_OPERATION_MISSING"
  | "ADAPTER_REQUEST_MAPPING_NOT_ALLOWED";


// ============================================================
// INPUT
// ============================================================

export interface ProviderAdapterRequestMappingInput {

  runtime:
    ProviderRecoveryBridgeResult;

  providerResourceId:
    string;

  providerConfigurationRef:
    string;

  providerCredentialRef:
    string;

  executionMetadata?:
    Record<string, unknown>;

  mappingDecision:
    ProviderAdapterRequestMappingDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderAdapterRequestMappingResult {

  mappingStatus:
    ProviderAdapterRequestMappingStatus;

  adapterRequestMapped:
    boolean;

  providerContract:
    ProviderRecoveryBridgeResult["providerContract"];

  providerImplementation:
    ProviderRecoveryBridgeResult["providerImplementation"];

  operation:
    ProviderRecoveryBridgeResult["operation"];

  providerResourceId:
    string;

  providerConfigurationRef:
    string;

  providerCredentialRef:
    string;

  adapterRequest?:
    ProviderAdapterRequest;

  denialReason?:
    ProviderAdapterRequestMappingDenialReason;

  runtimeSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// REQUEST MAPPING
// ============================================================

export function mapProviderAdapterRequest(
  input: ProviderAdapterRequestMappingInput
): ProviderAdapterRequestMappingResult {

  const runtime =
    input.runtime;

  if (!runtime.providerResolved) {

    return {

      mappingStatus:
        "PROVIDER_ADAPTER_REQUEST_NOT_MAPPED",

      adapterRequestMapped:
        false,

      providerContract:
        runtime.providerContract,

      providerImplementation:
        runtime.providerImplementation,

      operation:
        runtime.operation,

      providerResourceId:
        input.providerResourceId,

      providerConfigurationRef:
        input.providerConfigurationRef,

      providerCredentialRef:
        input.providerCredentialRef,

      denialReason:
        "PROVIDER_NOT_RESOLVED",

      runtimeSummary: [
        ...runtime.summary,
      ],

      summary: [
        ...runtime.summary,
        "provider_not_resolved",
        "provider_adapter_request_not_mapped",
      ],

    };

  }

  if (!runtime.providerAdmitted) {

    return {

      mappingStatus:
        "PROVIDER_ADAPTER_REQUEST_NOT_MAPPED",

      adapterRequestMapped:
        false,

      providerContract:
        runtime.providerContract,

      providerImplementation:
        runtime.providerImplementation,

      operation:
        runtime.operation,

      providerResourceId:
        input.providerResourceId,

      providerConfigurationRef:
        input.providerConfigurationRef,

      providerCredentialRef:
        input.providerCredentialRef,

      denialReason:
        "PROVIDER_NOT_ADMITTED",

      runtimeSummary: [
        ...runtime.summary,
      ],

      summary: [
        ...runtime.summary,
        "provider_not_admitted",
        "provider_adapter_request_not_mapped",
      ],

    };

  }

  if (!runtime.operation) {

    return {

      mappingStatus:
        "PROVIDER_ADAPTER_REQUEST_NOT_MAPPED",

      adapterRequestMapped:
        false,

      providerContract:
        runtime.providerContract,

      providerImplementation:
        runtime.providerImplementation,

      operation:
        runtime.operation,

      providerResourceId:
        input.providerResourceId,

      providerConfigurationRef:
        input.providerConfigurationRef,

      providerCredentialRef:
        input.providerCredentialRef,

      denialReason:
        "PROVIDER_OPERATION_MISSING",

      runtimeSummary: [
        ...runtime.summary,
      ],

      summary: [
        ...runtime.summary,
        "provider_operation_missing",
        "provider_adapter_request_not_mapped",
      ],

    };

  }

  if (
    input.mappingDecision ===
    "REJECT_PROVIDER_ADAPTER_REQUEST"
  ) {

    return {

      mappingStatus:
        "PROVIDER_ADAPTER_REQUEST_NOT_MAPPED",

      adapterRequestMapped:
        false,

      providerContract:
        runtime.providerContract,

      providerImplementation:
        runtime.providerImplementation,

      operation:
        runtime.operation,

      providerResourceId:
        input.providerResourceId,

      providerConfigurationRef:
        input.providerConfigurationRef,

      providerCredentialRef:
        input.providerCredentialRef,

      denialReason:
        "ADAPTER_REQUEST_MAPPING_NOT_ALLOWED",

      runtimeSummary: [
        ...runtime.summary,
      ],

      summary: [
        ...runtime.summary,
        "adapter_request_mapping_not_allowed",
        "provider_adapter_request_not_mapped",
      ],

    };

  }

  const adapterRequest:
    ProviderAdapterRequest = {

      providerContract:
        runtime.providerContract,

      providerImplementation:
        runtime.providerImplementation,

      operation:
        runtime.operation,

      providerResourceId:
        input.providerResourceId,

      providerConfigurationRef:
        input.providerConfigurationRef,

      providerCredentialRef:
        input.providerCredentialRef,

      executionMetadata:
        input.executionMetadata,

    };

  return {

    mappingStatus:
      "PROVIDER_ADAPTER_REQUEST_MAPPED",

    adapterRequestMapped:
      true,

    providerContract:
      runtime.providerContract,

    providerImplementation:
      runtime.providerImplementation,

    operation:
      runtime.operation,

    providerResourceId:
      input.providerResourceId,

    providerConfigurationRef:
      input.providerConfigurationRef,

    providerCredentialRef:
      input.providerCredentialRef,

    adapterRequest,

    runtimeSummary: [
      ...runtime.summary,
    ],

    summary: [
      ...runtime.summary,
      "provider_adapter_request_mapped",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Adapter Request Mapping
// receives a ProviderRecoveryBridgeResult.
//
// It preserves:
//
// ✓ providerContract
// ✓ providerImplementation
// ✓ operation
// ✓ runtimeSummary
//
// It adds adapter-local request
// material:
//
// ✓ providerResourceId
// ✓ providerConfigurationRef
// ✓ providerCredentialRef
// ✓ executionMetadata
//
// It never:
//
// - re-runs provider mapping
// - re-runs provider admission
// - re-runs provider execution
// - re-runs provider verification
// - re-generates provider evidence
// - re-classifies failure
// - re-bridges recovery
//
// ============================================================


// ============================================================
// ARCHITECTURAL PRINCIPLES
// ============================================================
//
// Provider Recovery Bridge
// ≠
// Provider Adapter Request Mapping
//
// Provider Adapter Request Mapping
// ≠
// Provider Adapter Execution
//
// Mapping Decision
// ≠
// Runtime Authorization
//
// Runtime Authorization belongs to
// Provider Runtime.
//
// Mapping Decision is a deterministic
// adapter request mapping gate inside
// the adapter layer.
//
// It never introduces a new runtime
// authorization boundary.
//
// ============================================================


// ============================================================
// MAPPING DECISION OBSERVATION
// ============================================================
//
// ProviderAdapterRequestMappingDecision
// is not a new provider authorization.
//
// It is a deterministic adapter-layer
// mapping gate that controls whether
// an already approved runtime context
// may be materialized as a canonical
// ProviderAdapterRequest.
//
// Runtime legitimacy has already been
// decided before this domain.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - execute providers
// - call AWS APIs
// - call Azure APIs
// - call Google APIs
// - call Vault APIs
// - call HSM APIs
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
// ✓ receive runtime-approved provider
//   context
//
// ✓ preserve providerContract
//
// ✓ preserve providerImplementation
//
// ✓ preserve operation
//
// ✓ preserve runtime summary
//
// ✓ materialize ProviderAdapterRequest
//
// ✓ expose deterministic mapping gate
//   without introducing new runtime
//   authorization
//
// ✗ execute providers
//
// ✗ re-authorize runtime
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