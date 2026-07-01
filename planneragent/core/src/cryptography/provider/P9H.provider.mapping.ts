// ============================================================
// PlannerAgent — Provider Mapping
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/
// P9H.provider.mapping.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime
//
// DOMAIN
// ------------------------------------------------------------
// P9H.1 — Provider Mapping
//
// PURPOSE
// ------------------------------------------------------------
// Resolve an abstract Provider Runtime
// contract into a concrete provider
// implementation.
//
// Provider Mapping:
//
// - resolves providers
// - validates mappings
// - preserves contracts
//
// It never:
//
// - admits providers
// - authorizes governance
// - defines mechanisms
// - provisions infrastructure
// - executes provider operations
// - verifies execution
// - generates evidence
// - writes ledger
// - performs audit
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Mapping resolves.
//
// Provider Admission admits.
//
// Provider Execution executes.
//
// ============================================================


// ============================================================
// PROVIDER CONTRACT
// ============================================================

export type ProviderContract =
  | "KEY_MANAGEMENT"
  | "SECRET_STORAGE"
  | "HARDWARE_SECURITY_MODULE";


// ============================================================
// PROVIDER IMPLEMENTATION
// ============================================================

export type ProviderImplementation =
  | "AWS_KMS"
  | "AZURE_KEY_VAULT"
  | "GOOGLE_CLOUD_KMS"
  | "HASHICORP_VAULT"
  | "ON_PREMISE_HSM";


// ============================================================
// SUPPORTED PROVIDER MAPPINGS
// ============================================================

export const SUPPORTED_PROVIDER_MAPPINGS:
  Record<
    ProviderContract,
    readonly ProviderImplementation[]
  > = {

  KEY_MANAGEMENT: [

    "AWS_KMS",

    "AZURE_KEY_VAULT",

    "GOOGLE_CLOUD_KMS",

  ],

  SECRET_STORAGE: [

    "HASHICORP_VAULT",

  ],

  HARDWARE_SECURITY_MODULE: [

    "ON_PREMISE_HSM",

  ],

};


// ============================================================
// MAPPING STATUS
// ============================================================

export type ProviderMappingStatus =
  | "PROVIDER_RESOLVED"
  | "PROVIDER_NOT_RESOLVED";


// ============================================================
// DENIAL
// ============================================================

export type ProviderMappingDenialReason =
  | "PROVIDER_NOT_SUPPORTED"
  | "PROVIDER_DISABLED";


// ============================================================
// INPUT
// ============================================================

export interface ProviderMappingRequest {

  providerContract:
    ProviderContract;

  providerImplementation:
    ProviderImplementation;

  providerEnabled:
    boolean;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderMappingResult {

  mappingStatus:
    ProviderMappingStatus;

  denialReason?:
    ProviderMappingDenialReason;

  providerContract:
    ProviderContract;

  providerImplementation:
    ProviderImplementation;

  providerEnabled:
    boolean;

  mappingValidated:
    boolean;

  providerResolved:
    boolean;

  summary:
    string[];

}


// ============================================================
// MAPPING
// ============================================================

export function resolveProviderMapping(
  request: ProviderMappingRequest
): ProviderMappingResult {

  if (!request.providerEnabled) {

    return {

      mappingStatus:
        "PROVIDER_NOT_RESOLVED",

      denialReason:
        "PROVIDER_DISABLED",

      providerContract:
        request.providerContract,

      providerImplementation:
        request.providerImplementation,

      providerEnabled:
        request.providerEnabled,

      mappingValidated:
        false,

      providerResolved:
        false,

      summary: [

        "provider_disabled",

        "mapping_denied",

      ],

    };

  }

  const supported =
    SUPPORTED_PROVIDER_MAPPINGS[
      request.providerContract
    ].includes(
      request.providerImplementation
    );

  if (!supported) {

    return {

      mappingStatus:
        "PROVIDER_NOT_RESOLVED",

      denialReason:
        "PROVIDER_NOT_SUPPORTED",

      providerContract:
        request.providerContract,

      providerImplementation:
        request.providerImplementation,

      providerEnabled:
        request.providerEnabled,

      mappingValidated:
        false,

      providerResolved:
        false,

      summary: [

        "provider_not_supported",

        "mapping_denied",

      ],

    };

  }

  return {

    mappingStatus:
      "PROVIDER_RESOLVED",

    providerContract:
      request.providerContract,

    providerImplementation:
      request.providerImplementation,

    providerEnabled:
      request.providerEnabled,

    mappingValidated:
      true,

    providerResolved:
      true,

    summary: [

      "provider_supported",

      "provider_enabled",

      "provider_resolved",

      "mapping_completed",

    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Provider Mapping resolves
// implementations.
//
// It validates whether a provider
// implementation is supported for a
// provider contract.
//
// Provider Mapping preserves provider
// enabled state.
//
// It never executes providers.
//
// It never admits providers.
//
// Provider Runtime Execution receives
// an already resolved provider contract.
//
// ============================================================


// ============================================================
// P9H.1 PRINCIPLE
// ============================================================
//
// Provider Contract
// ≠
// Provider Implementation
//
// Provider Resolved
// ≠
// Provider Admitted
//
// Provider Mapping
// ≠
// Provider Admission
//
// Mapping resolves.
//
// Admission admits.
//
// Execution executes.
//
// Verification verifies.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - admit providers
// - execute provider operations
// - call provider APIs
// - authorize governance
// - define mechanisms
// - provision infrastructure
// - generate evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ define supported provider mappings
//
// ✓ validate provider mapping
//
// ✓ preserve provider enabled state
//
// ✓ resolve provider contract
//
// ✓ deny disabled providers
//
// ✓ deny unsupported providers
//
// ✗ admit providers
//
// ✗ execute providers
//
// ✗ call provider APIs
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================