// ============================================================
// PlannerAgent — Provider Implementation Contract
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/implementations/
// P9J.provider.implementation.contract.ts
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
// P9J.1 — Provider Implementation Contract
//
// PURPOSE
// ------------------------------------------------------------
// Define the canonical contract for
// provider-specific implementations.
//
// This file defines:
//
// - ProviderImplementationRequest
// - ProviderImplementationResult
// - ProviderImplementationFailureSurface
// - ProviderImplementationExecutionStatus
//
// P9J implementation contracts sit
// below Provider Adapter contracts.
//
// P9J may call concrete provider SDKs
// and APIs in later implementation
// files.
//
// This file does not call providers.
//
// It does not execute SDKs.
//
// It does not redefine adapter
// contracts.
//
// It does not verify runtime.
//
// It does not classify runtime failure.
//
// It does not recover.
//
// It does not write evidence, ledger,
// or audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Adapter defines stable
// adapter contracts.
//
// Provider-Specific Implementation
// defines provider-specific execution
// contracts.
//
// P9J may be provider-specific
// internally.
//
// P9J outputs must remain adapter-
// compatible after translation and
// sanitization.
//
// ============================================================

import {
  ProviderAdapterFailureCode,
  ProviderAdapterRequest,
} from "../adapters/P9I.provider.adapter.contract";

import {
  ProviderContract,
  ProviderImplementation,
} from "../P9H.provider.mapping";

import {
  ProviderOperation,
} from "../P9H.provider.execution";


// ============================================================
// IMPLEMENTATION EXECUTION STATUS
// ============================================================

export type ProviderImplementationExecutionStatus =
  | "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED"
  | "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED";


// ============================================================
// IMPLEMENTATION FAILURE CODE
// ============================================================

export type ProviderImplementationFailureCode =
  | ProviderAdapterFailureCode
  | "PROVIDER_SDK_ERROR"
  | "PROVIDER_SDK_TIMEOUT"
  | "PROVIDER_SDK_AUTHENTICATION_FAILED"
  | "PROVIDER_SDK_AUTHORIZATION_FAILED"
  | "PROVIDER_SDK_INVALID_REQUEST"
  | "PROVIDER_SDK_INVALID_KEY_STATE"
  | "PROVIDER_SDK_UNAVAILABLE"
  | "PROVIDER_SDK_UNKNOWN_FAILURE";


// ============================================================
// IMPLEMENTATION FAILURE SURFACE
// ============================================================

export interface ProviderImplementationFailureSurface {

  failureCode:
    ProviderImplementationFailureCode;

  providerRawStatus?:
    string;

  providerRawErrorCode?:
    string;

  providerRawErrorMessage?:
    string;

  providerRawDiagnostic?:
    unknown;

  retryable:
    boolean;

  summary:
    string[];

}


// ============================================================
// IMPLEMENTATION REQUEST
// ============================================================

export interface ProviderImplementationRequest {

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

  adapterRequest:
    ProviderAdapterRequest;

}


// ============================================================
// IMPLEMENTATION RESULT
// ============================================================

export interface ProviderImplementationResult {

  executionStatus:
    ProviderImplementationExecutionStatus;

  providerImplementation:
    ProviderImplementation;

  providerContract:
    ProviderContract;

  operation:
    ProviderOperation;

  providerResourceId:
    string;

  providerConfigurationRef:
    string;

  providerCredentialRef:
    string;

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

  requiresResultTranslation:
    boolean;

  requiresErrorSanitization:
    boolean;

  summary:
    string[];

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// ProviderImplementationRequest is
// derived from ProviderAdapterRequest.
//
// ProviderImplementationResult is an
// internal P9J result.
//
// It is not adapter-compatible by
// itself.
//
// It must pass through result
// translation and, when failure
// material exists, error sanitization
// before crossing back into P9I.
//
// ProviderImplementationFailureSurface
// may contain raw provider material
// while it remains inside P9J.
//
// Raw provider material must not leave
// P9J without sanitization.
//
// ============================================================


// ============================================================
// REQUEST CONTRACT PRINCIPLE
// ============================================================
//
// ProviderAdapterRequest
// ≠
// ProviderImplementationRequest
//
// Adapter Request is stable.
//
// Implementation Request is
// provider-specific.
//
// Implementation Request may carry
// provider-specific execution material,
// but must preserve adapter request
// context.
//
// ============================================================


// ============================================================
// RESULT CONTRACT PRINCIPLE
// ============================================================
//
// ProviderImplementationResult
// ≠
// ProviderAdapterResult
//
// ProviderImplementationResult is not
// adapter-compatible by itself.
//
// It must pass through result
// translation and, when failure
// material exists, error sanitization
// before crossing back into P9I.
//
// ProviderImplementationResult may
// contain provider-specific raw output
// inside P9J.
//
// ProviderAdapterResult-compatible
// output must be produced only after
// result translation and sanitization.
//
// Raw Provider Output
// ≠
// Adapter-Compatible Output
//
// ============================================================


// ============================================================
// FAILURE SURFACE PRINCIPLE
// ============================================================
//
// ProviderImplementationFailureSurface
// may carry raw provider failure
// material inside P9J.
//
// ProviderAdapterFailureSurface must
// receive sanitized failure material
// only.
//
// Raw failure material may enter P9J.
//
// Raw failure material must not leave
// P9J.
//
// ============================================================


// ============================================================
// SECURITY PRINCIPLE
// ============================================================
//
// P9J is the first and last trusted
// boundary where raw provider failure
// material may exist.
//
// Raw provider outputs may include:
//
// - provider SDK errors
// - provider raw status
// - provider raw error codes
// - provider raw error messages
// - provider diagnostics
// - provider exception payloads
//
// These may contain sensitive
// information.
//
// Therefore, raw provider failure
// material must be sanitized before
// crossing back into P9I.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - call provider SDKs
// - call AWS APIs
// - call Azure APIs
// - call Google APIs
// - call Vault APIs
// - call HSM APIs
// - redefine adapter contracts
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
// ✓ define ProviderImplementationRequest
//
// ✓ define ProviderImplementationResult
//
// ✓ define ProviderImplementationFailureSurface
//
// ✓ define ProviderImplementationExecutionStatus
//
// ✓ preserve adapter request context
//
// ✓ allow raw provider material inside
//   P9J only
//
// ✓ require result translation before
//   crossing back into P9I
//
// ✓ require error sanitization before
//   exposing provider failure material
//   outside P9J
//
// ✗ call provider SDKs
//
// ✗ redefine adapter contracts
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
