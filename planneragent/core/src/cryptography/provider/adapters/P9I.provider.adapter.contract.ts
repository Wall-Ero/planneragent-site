// ============================================================
// PlannerAgent — Provider Adapter Contract
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/adapters/
// P9I.provider.adapter.contract.ts
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
// P9I.1 — Provider Adapter Contract
//
// PURPOSE
// ------------------------------------------------------------
// Define the canonical contract for
// Provider Adapter execution.
//
// This file defines:
//
// - ProviderAdapterRequest
// - ProviderAdapterResult
// - ProviderAdapterFailureSurface
// - ProviderAdapterExecutionStatus
//
// Provider Adapter Contract defines
// the stable contract between:
//
// - Provider Runtime
// and
// - Provider-specific adapters
//
// It does not execute providers.
//
// It does not classify runtime failure.
//
// It does not verify runtime execution.
//
// It does not write evidence, ledger,
// or audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Runtime decides.
//
// Provider Adapter executes.
//
// Provider Adapter Contract stabilizes
// the request/result boundary between
// runtime and provider-specific
// implementations.
//
// ============================================================

import {
  ProviderContract,
  ProviderImplementation,
} from "../P9H.provider.mapping";

import {
  ProviderOperation,
} from "../P9H.provider.execution";


// ============================================================
// EXECUTION STATUS
// ============================================================

export type ProviderAdapterExecutionStatus =
  | "PROVIDER_ADAPTER_EXECUTION_COMPLETED"
  | "PROVIDER_ADAPTER_EXECUTION_FAILED";


// ============================================================
// FAILURE SURFACE CODE
// ============================================================

export type ProviderAdapterFailureCode =
  | "PROVIDER_CALL_FAILED"
  | "PROVIDER_CALL_TIMEOUT"
  | "PROVIDER_CALL_THROTTLED"
  | "PROVIDER_CALL_UNAUTHORIZED"
  | "PROVIDER_CALL_INVALID_STATE"
  | "PROVIDER_CALL_UNKNOWN_FAILURE";


// ============================================================
// FAILURE SURFACE
// ============================================================

export interface ProviderAdapterFailureSurface {

  failureCode:
    ProviderAdapterFailureCode;

  providerRawStatus?:
    string;

  providerRawErrorCode?:
    string;

  providerSanitizedErrorMessage?:
    string;

  retryable:
    boolean;

  summary:
    string[];

}


// ============================================================
// REQUEST
// ============================================================

export interface ProviderAdapterRequest {

  providerContract:
    ProviderContract;

  providerImplementation:
    ProviderImplementation;

  operation:
    ProviderOperation;

  providerResourceId:
    string;

  providerConfigurationRef:
    string;

  providerCredentialRef:
    string;

  executionMetadata?:
    Record<string, unknown>;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderAdapterResult {

  executionStatus:
    ProviderAdapterExecutionStatus;

  providerCallAttempted:
    boolean;

  providerCallCompleted:
    boolean;

  providerContract:
    ProviderContract;

  providerImplementation:
    ProviderImplementation;

  operation:
    ProviderOperation;

  providerResourceId:
    string;

  providerReference?:
    string;

  providerRawStatus?:
    string;

  failureSurface?:
    ProviderAdapterFailureSurface;

  summary:
    string[];

}


// ============================================================
// CONTRACT PRINCIPLE
// ============================================================
//
// ProviderAdapterRequest is the
// canonical input to provider-specific
// adapters.
//
// ProviderAdapterResult is the
// canonical output from provider-
// specific adapters.
//
// ProviderAdapterFailureSurface is the
// canonical provider-specific failure
// surface preserved by adapters.
//
// This contract must remain stable
// even if:
//
// - AWS KMS changes
// - Azure Key Vault changes
// - Google Cloud KMS changes
// - Vault changes
// - HSM integrations change
//
// ============================================================


// ============================================================
// REQUEST CONTRACT OBSERVATION
// ============================================================
//
// ProviderAdapterRequest carries only
// adapter-safe execution data.
//
// It may contain:
//
// - provider contract
// - provider implementation
// - operation
// - resource identifier
// - configuration reference
// - credential reference
// - execution metadata
//
// It must not contain:
//
// - governance authority logic
// - runtime admission logic
// - failure classification logic
// - recovery decisions
// - ledger instructions
// - audit instructions
//
// ============================================================


// ============================================================
// RESULT CONTRACT OBSERVATION
// ============================================================
//
// ProviderAdapterResult preserves the
// outcome of a concrete provider call
// without classifying runtime failure.
//
// It reports:
//
// - whether the provider call was
//   attempted
//
// - whether the provider call
//   completed
//
// - which provider implementation
//   executed
//
// - which provider operation was
//   attempted
//
// - optional provider reference
//
// - optional provider raw status
//
// - optional provider failure surface
//
// Runtime domains may later verify,
// classify, preserve, or recover.
//
// Adapter Result itself does not do
// those things.
//
// ============================================================


// ============================================================
// FAILURE SURFACE OBSERVATION
// ============================================================
//
// ProviderAdapterFailureSurface
// preserves provider-specific failure
// output in a contract-safe structure.
//
// It does not classify runtime failure.
//
// It does not decide recovery.
//
// It does not retry provider calls.
//
// providerSanitizedErrorMessage
// represents sanitized provider error
// content only.
//
// Raw provider error messages must
// never be preserved directly through
// this contract.
//
// This contract intentionally avoids
// normalizing the preservation of raw
// provider error messages.
//
// It exists so provider-specific
// failure details can be preserved
// without leaking provider SDK/API
// contracts into runtime domains.
//
// ============================================================


// ============================================================
// SECURITY NOTE
// ============================================================
//
// Raw provider failure surfaces may be
// useful for adapter diagnostics, but
// they must never be preserved blindly.
//
// Raw provider failure surfaces must be
// sanitized before preservation.
//
// Sensitive provider payloads,
// credentials, tokens, key material,
// secret references, and provider-side
// confidential metadata must never be
// propagated as preserved error
// content.
//
// Sanitization rules belong to:
//
// P9I.5 — Provider Adapter Failure Surface
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
// - verify runtime execution
// - recover providers
// - write evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ define ProviderAdapterRequest
//
// ✓ define ProviderAdapterResult
//
// ✓ define ProviderAdapterFailureSurface
//
// ✓ define ProviderAdapterExecutionStatus
//
// ✓ stabilize adapter request/result
//   contract
//
// ✓ preserve provider-specific failure
//   surface as a contract-safe type
//
// ✓ require sanitized provider error
//   message surfaces
//
// ✗ execute providers
//
// ✗ classify runtime failure
//
// ✗ verify runtime execution
//
// ✗ recover providers
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================