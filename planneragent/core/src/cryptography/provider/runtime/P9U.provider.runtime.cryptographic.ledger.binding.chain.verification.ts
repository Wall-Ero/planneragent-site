// ============================================================
// PlannerAgent — Provider Runtime Cryptographic Ledger Binding
// and Chain Verification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9U.provider.runtime.cryptographic.ledger.binding.chain.verification.ts
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
// P9U.1 — Provider Runtime Cryptographic
// Ledger Binding & Chain Verification
//
// PURPOSE
// ------------------------------------------------------------
// Bind one durable P9R provider-runtime ledger fact
// to the immutable governance chain and verify the
// resulting cryptographic chain continuity.
//
// P9U receives:
//
// - ProviderRuntimeEvidenceLedgerWriteResult
// - sovereign chain context
// - optional previous immutable-chain record
// - optional previous canonical chain payloads
//
// P9U:
//
// - validates that P9R actually wrote one durable fact
// - preserves P9R durable identity
// - creates one canonical provider-runtime chain payload
// - appends one immutable governance-chain record
// - verifies payload integrity
// - verifies record integrity
// - verifies chain identity
// - verifies sovereign continuity
// - verifies sequence continuity
//
// P9U does not:
//
// - verify provider execution
// - classify runtime failure
// - decide runtime response
// - execute runtime response
// - certify execution outcome
// - admit evidence
// - persist provider-runtime evidence
// - manufacture P9R durable identifiers
// - admit ledger facts to audit
// - execute audit
// - encrypt payloads
// - decrypt payloads
// - authorize cryptographic execution
// - call provider APIs or SDKs
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9R preserves the durable runtime fact.
//
// P9U cryptographically binds the durable
// runtime fact.
//
// Binding does not reinterpret fact.
//
// Chain verification does not re-perform
// runtime governance.
//
// Durable
// ≠
// Cryptographically Chain-Bound
//
// Chain-Bound
// ≠
// Runtime Verified
//
// Chain Verification
// ≠
// Runtime Audit
//
// ============================================================

import {
  appendImmutableRecord,
  verifyImmutableChain,
} from "../../../ledger/immutable.chain";

import type {
  AppendImmutableRecordInput,
  ImmutableChainRecord,
  ImmutableChainVerification,
} from "../../../ledger/immutable.chain";

import type {
  EncryptionDomain,
} from "../../../security/encryption.domains";

import type {
  ProviderRuntimeEvidenceLedgerWriteResult,
} from "./P9R.provider.runtime.evidence.persistence.ledger.write";


// ============================================================
// BINDING STATUS
// ============================================================

export type ProviderRuntimeCryptographicLedgerBindingStatus =
  | "PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHICALLY_BOUND"
  | "PROVIDER_RUNTIME_LEDGER_NOT_BOUND"
  | "PROVIDER_RUNTIME_LEDGER_BINDING_DENIED";


// ============================================================
// BINDING DECISION
// ============================================================

export type ProviderRuntimeCryptographicLedgerBindingDecision =
  | "BIND_PROVIDER_RUNTIME_LEDGER_TO_CRYPTOGRAPHIC_CHAIN"
  | "REJECT_PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHIC_BINDING";


// ============================================================
// BINDING DENIAL REASON
// ============================================================

export type ProviderRuntimeCryptographicLedgerBindingDenialReason =
  | "RUNTIME_LEDGER_BINDING_NOT_ALLOWED"
  | "RUNTIME_LEDGER_WRITE_NOT_COMPLETED"
  | "RUNTIME_LEDGER_DURABLE_IDENTITY_MISSING"
  | "SOVEREIGN_TENANT_CONTEXT_MISSING"
  | "SOVEREIGN_COMPANY_CONTEXT_MISSING"
  | "RUNTIME_LEDGER_TENANT_MISMATCH";


// ============================================================
// BINDING FAILURE REASON
// ============================================================

export type ProviderRuntimeCryptographicLedgerBindingFailureReason =
  | "CANONICAL_CHAIN_PAYLOAD_NOT_CREATED"
  | "IMMUTABLE_CHAIN_APPEND_FAILED"
  | "IMMUTABLE_CHAIN_RECORD_NOT_CREATED"
  | "IMMUTABLE_CHAIN_VERIFICATION_FAILED"
  | "IMMUTABLE_CHAIN_PAYLOAD_INCOHERENT"
  | "IMMUTABLE_CHAIN_IDENTITY_INCOHERENT";


// ============================================================
// CANONICAL PAYLOAD TYPE
// ============================================================

export type ProviderRuntimeCryptographicLedgerPayloadType =
  "PROVIDER_RUNTIME_DURABLE_LEDGER_FACT";


// ============================================================
// CANONICAL PAYLOAD VERSION
// ============================================================

export type ProviderRuntimeCryptographicLedgerPayloadVersion =
  "P9U.1";


// ============================================================
// PROVIDER-RUNTIME LEDGER FACT VIEW
// ============================================================
//
// P9R remains authoritative for its public result.
//
// This internal structural view allows P9U to validate
// the durable P9R contract without creating new runtime
// meaning or fabricating missing fields.
//
// ============================================================

interface ProviderRuntimeLedgerEntryView {

  executorSummary?: string[];

}


interface ProviderRuntimeLedgerWriteView {

  ledgerWriteStatus?: string;

  runtimeEvidenceLedgerWriteAttempted?: boolean;

  runtimeEvidenceLedgerWritten?: boolean;

  runtimeEvidencePersisted?: boolean;

  persistenceId?: string;

  ledgerEntryId?: string;

  ledgerSequence?: number;

  persistedAt?: string;

  ledgerEntryType?: string;

  ledgerEntryVersion?: string;

  certifiedExecutionOutcome?: string;

  providerContract?: unknown;

  providerImplementation?: unknown;

  operation?: unknown;

  providerResourceId?: unknown;

  providerConfigurationRef?: unknown;

  providerCredentialRef?: unknown;

  executionMetadata?: Record<string, unknown>;

  verificationStatus?: unknown;

  verificationFailureReason?: unknown;

  classificationStatus?: unknown;

  runtimeFailureClass?: unknown;

  runtimeFailureSeverity?: unknown;

  failureCode?: unknown;

  providerRawStatus?: unknown;

  providerRawErrorCode?: unknown;

  providerSanitizedErrorMessage?: unknown;

  retryable?: boolean;

  recoveryIntakeRequired?: boolean;

  recoveryIntakeReady?: boolean;

  recoveryReason?: string;

  runtimeResponse?: unknown;

  responseExecutionStatus?: unknown;

  runtimeResponseExecutionAttempted?: boolean;

  runtimeResponseExecuted?: boolean;

  runtimeInterventionNotRequired?: boolean;

  executorFailureContained?: boolean;

  responseDecisionSummary?: string[];

  executorSummary?: string[];

  ledgerEntry?:
    ProviderRuntimeLedgerEntryView;

  responseExecutionSummary?: string[];

  certificationSummary?: string[];

  evidenceAdmissionSummary?: string[];

  persistenceSummary?: string[];

  ledgerWriteSummary?: string[];

  summary?: string[];

}


// ============================================================
// CANONICAL CHAIN PAYLOAD
// ============================================================
//
// This payload preserves the durable provider-runtime fact
// exactly as exposed by P9R.
//
// It does not re-evaluate or reinterpret any upstream result.
//
// ============================================================

export interface ProviderRuntimeCryptographicLedgerPayload {

  payloadType:
    ProviderRuntimeCryptographicLedgerPayloadType;

  payloadVersion:
    ProviderRuntimeCryptographicLedgerPayloadVersion;

  persistenceId:
    string;

  ledgerEntryId:
    string;

  ledgerSequence:
    number;

  persistedAt:
    string;

  ledgerEntryType?:
    string;

  ledgerEntryVersion?:
    string;

  certifiedExecutionOutcome?:
    string;

  providerContract?:
    unknown;

  providerImplementation?:
    unknown;

  operation?:
    unknown;

  providerResourceId?:
    unknown;

  providerConfigurationRef?:
    unknown;

  providerCredentialRef?:
    unknown;

  executionMetadata?:
    Record<string, unknown>;

  verificationStatus?:
    unknown;

  verificationFailureReason?:
    unknown;

  classificationStatus?:
    unknown;

  runtimeFailureClass?:
    unknown;

  runtimeFailureSeverity?:
    unknown;

  failureCode?:
    unknown;

  providerRawStatus?:
    unknown;

  providerRawErrorCode?:
    unknown;

  providerSanitizedErrorMessage?:
    unknown;

  retryable?:
    boolean;

  recoveryIntakeRequired?:
    boolean;

  recoveryIntakeReady?:
    boolean;

  recoveryReason?:
    string;

  runtimeResponse?:
    unknown;

  responseExecutionStatus?:
    unknown;

  runtimeResponseExecutionAttempted?:
    boolean;

  runtimeResponseExecuted?:
    boolean;

  runtimeInterventionNotRequired?:
    boolean;

  executorFailureContained?:
    boolean;

  responseDecisionSummary:
    string[];

  executorSummary?:
    string[];

  responseExecutionSummary:
    string[];

  certificationSummary:
    string[];

  evidenceAdmissionSummary:
    string[];

  persistenceSummary:
    string[];

  ledgerWriteSummary:
    string[];

  sourceSummary:
    string[];

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderRuntimeCryptographicLedgerBindingInput {

  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult;

  tenantId:
    string;

  companyId:
    string;

  encryptionDomain:
    EncryptionDomain;

  previousRecord?:
    ImmutableChainRecord | null;

  previousPayloads?:
    readonly ProviderRuntimeCryptographicLedgerPayload[];

  bindingDecision:
    ProviderRuntimeCryptographicLedgerBindingDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeCryptographicLedgerBindingResult {

  bindingStatus:
    ProviderRuntimeCryptographicLedgerBindingStatus;

  bindingDecision:
    ProviderRuntimeCryptographicLedgerBindingDecision;

  runtimeLedgerBindingAttempted:
    boolean;

  runtimeLedgerCryptographicallyBound:
    boolean;

  runtimeLedgerBindingDenied:
    boolean;

  immutableChainVerificationAttempted:
    boolean;

  immutableChainVerified:
    boolean;

  bindingDenialReason?:
    ProviderRuntimeCryptographicLedgerBindingDenialReason;

  bindingFailureReason?:
    ProviderRuntimeCryptographicLedgerBindingFailureReason;

  tenantId:
    string;

  companyId:
    string;

  encryptionDomain:
    EncryptionDomain;

  persistenceId?:
    string;

  ledgerEntryId?:
    string;

  ledgerSequence?:
    number;

  persistedAt?:
    string;

  certifiedExecutionOutcome?:
    string;

  providerContract?:
    unknown;

  providerImplementation?:
    unknown;

  operation?:
    unknown;

  providerResourceId?:
    unknown;

  executionMetadata?:
    Record<string, unknown>;

  verificationStatus?:
    unknown;

  classificationStatus?:
    unknown;

  runtimeFailureClass?:
    unknown;

  runtimeResponse?:
    unknown;

  responseExecutionStatus?:
    unknown;

  runtimeResponseExecutionAttempted?:
    boolean;

  runtimeResponseExecuted?:
    boolean;

  runtimeInterventionNotRequired?:
    boolean;

  executorFailureContained?:
    boolean;

  chainPayload?:
    ProviderRuntimeCryptographicLedgerPayload;

  chainRecord?:
    ImmutableChainRecord;

  chainVerification?:
    ImmutableChainVerification;

  ledgerWriteSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// INTERNAL RESULT CONTEXT
// ============================================================

interface ProviderRuntimeBindingResultContext {

  ledgerWrite:
    ProviderRuntimeLedgerWriteView;

  tenantId:
    string;

  companyId:
    string;

  encryptionDomain:
    EncryptionDomain;

}


// ============================================================
// LEDGER-WRITE VIEW
// ============================================================

function asLedgerWriteView(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult
): ProviderRuntimeLedgerWriteView {

  return ledgerWrite as unknown as
    ProviderRuntimeLedgerWriteView;

}


// ============================================================
// STRING VALIDATION
// ============================================================

function isNonEmptyString(
  value:
    unknown
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}


// ============================================================
// POSITIVE INTEGER VALIDATION
// ============================================================

function isPositiveInteger(
  value:
    unknown
): value is number {

  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );

}


// ============================================================
// SUMMARY COPY
// ============================================================

function copySummary(
  value:
    unknown
): string[] {

  if (!Array.isArray(value)) {

    return [];

  }

  return value.filter(
    (
      item:
        unknown
    ): item is string =>
      typeof item === "string"
  );

}


// ============================================================
// OPTIONAL SUMMARY COPY
// ============================================================

function copyOptionalSummary(
  value:
    unknown
): string[] | undefined {

  const copied =
    copySummary(
      value
    );

  return copied.length > 0
    ? copied
    : undefined;

}


// ============================================================
// EXECUTION METADATA COPY
// ============================================================

function copyExecutionMetadata(
  value:
    unknown
): Record<string, unknown> | undefined {

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {

    return undefined;

  }

  return {

    ...(
      value as
        Record<string, unknown>
    ),

  };

}


// ============================================================
// P9R WRITE-COMPLETION CHECK
// ============================================================

function runtimeLedgerWasWritten(
  ledgerWrite:
    ProviderRuntimeLedgerWriteView
): boolean {

  if (
    ledgerWrite.runtimeEvidenceLedgerWritten === true
  ) {

    return true;

  }

  return (
    ledgerWrite.ledgerWriteStatus ===
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITTEN" ||
    ledgerWrite.ledgerWriteStatus ===
      "PROVIDER_RUNTIME_LEDGER_WRITTEN"
  );

}


// ============================================================
// DURABLE IDENTITY CHECK
// ============================================================

function durableLedgerIdentityExists(
  ledgerWrite:
    ProviderRuntimeLedgerWriteView
): boolean {

  return (
    isNonEmptyString(
      ledgerWrite.persistenceId
    ) &&
    isNonEmptyString(
      ledgerWrite.ledgerEntryId
    ) &&
    isPositiveInteger(
      ledgerWrite.ledgerSequence
    ) &&
    isNonEmptyString(
      ledgerWrite.persistedAt
    )
  );

}


// ============================================================
// TENANT EXTRACTION
// ============================================================

function extractRuntimeTenantId(
  ledgerWrite:
    ProviderRuntimeLedgerWriteView
): string | undefined {

  const tenantId =
    ledgerWrite
      .executionMetadata
      ?.tenantId;

  return isNonEmptyString(
    tenantId
  )
    ? tenantId
    : undefined;

}


// ============================================================
// CANONICAL PAYLOAD CREATION
// ============================================================

function createCanonicalChainPayload(
  ledgerWrite:
    ProviderRuntimeLedgerWriteView
): ProviderRuntimeCryptographicLedgerPayload | undefined {

  if (
    !durableLedgerIdentityExists(
      ledgerWrite
    )
  ) {

    return undefined;

  }

  return {

    payloadType:
      "PROVIDER_RUNTIME_DURABLE_LEDGER_FACT",

    payloadVersion:
      "P9U.1",

    persistenceId:
      ledgerWrite.persistenceId!,

    ledgerEntryId:
      ledgerWrite.ledgerEntryId!,

    ledgerSequence:
      ledgerWrite.ledgerSequence!,

    persistedAt:
      ledgerWrite.persistedAt!,

    ledgerEntryType:
      ledgerWrite.ledgerEntryType,

    ledgerEntryVersion:
      ledgerWrite.ledgerEntryVersion,

    certifiedExecutionOutcome:
      ledgerWrite.certifiedExecutionOutcome,

    providerContract:
      ledgerWrite.providerContract,

    providerImplementation:
      ledgerWrite.providerImplementation,

    operation:
      ledgerWrite.operation,

    providerResourceId:
      ledgerWrite.providerResourceId,

    providerConfigurationRef:
      ledgerWrite.providerConfigurationRef,

    providerCredentialRef:
      ledgerWrite.providerCredentialRef,

    executionMetadata:
      copyExecutionMetadata(
        ledgerWrite.executionMetadata
      ),

    verificationStatus:
      ledgerWrite.verificationStatus,

    verificationFailureReason:
      ledgerWrite.verificationFailureReason,

    classificationStatus:
      ledgerWrite.classificationStatus,

    runtimeFailureClass:
      ledgerWrite.runtimeFailureClass,

    runtimeFailureSeverity:
      ledgerWrite.runtimeFailureSeverity,

    failureCode:
      ledgerWrite.failureCode,

    providerRawStatus:
      ledgerWrite.providerRawStatus,

    providerRawErrorCode:
      ledgerWrite.providerRawErrorCode,

    providerSanitizedErrorMessage:
      ledgerWrite.providerSanitizedErrorMessage,

    retryable:
      ledgerWrite.retryable,

    recoveryIntakeRequired:
      ledgerWrite.recoveryIntakeRequired,

    recoveryIntakeReady:
      ledgerWrite.recoveryIntakeReady,

    recoveryReason:
      ledgerWrite.recoveryReason,

    runtimeResponse:
      ledgerWrite.runtimeResponse,

    responseExecutionStatus:
      ledgerWrite.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      ledgerWrite.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      ledgerWrite.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      ledgerWrite.runtimeInterventionNotRequired,

    executorFailureContained:
      ledgerWrite.executorFailureContained,

    responseDecisionSummary:
      copySummary(
        ledgerWrite.responseDecisionSummary
      ),

    executorSummary:
      copyOptionalSummary(
        ledgerWrite.ledgerEntry?.executorSummary ??
        ledgerWrite.executorSummary
      ),

    responseExecutionSummary:
      copySummary(
        ledgerWrite.responseExecutionSummary
      ),

    certificationSummary:
      copySummary(
        ledgerWrite.certificationSummary
      ),

    evidenceAdmissionSummary:
      copySummary(
        ledgerWrite.evidenceAdmissionSummary
      ),

    persistenceSummary:
      copySummary(
        ledgerWrite.persistenceSummary
      ),

    ledgerWriteSummary:
      copySummary(
        ledgerWrite.ledgerWriteSummary
      ),

    sourceSummary:
      copySummary(
        ledgerWrite.summary
      ),

  };

}


// ============================================================
// PAYLOAD COHERENCE CHECK
// ============================================================

function chainPayloadIsCoherent(
  payload:
    ProviderRuntimeCryptographicLedgerPayload,
  ledgerWrite:
    ProviderRuntimeLedgerWriteView
): boolean {

  return (
    payload.payloadType ===
      "PROVIDER_RUNTIME_DURABLE_LEDGER_FACT" &&

    payload.payloadVersion ===
      "P9U.1" &&

    payload.persistenceId ===
      ledgerWrite.persistenceId &&

    payload.ledgerEntryId ===
      ledgerWrite.ledgerEntryId &&

    payload.ledgerSequence ===
      ledgerWrite.ledgerSequence &&

    payload.persistedAt ===
      ledgerWrite.persistedAt &&

    payload.certifiedExecutionOutcome ===
      ledgerWrite.certifiedExecutionOutcome &&

    payload.providerContract ===
      ledgerWrite.providerContract &&

    payload.providerImplementation ===
      ledgerWrite.providerImplementation &&

    payload.operation ===
      ledgerWrite.operation &&

    payload.providerResourceId ===
      ledgerWrite.providerResourceId &&

    payload.runtimeResponse ===
      ledgerWrite.runtimeResponse &&

    payload.responseExecutionStatus ===
      ledgerWrite.responseExecutionStatus &&

    payload.runtimeResponseExecutionAttempted ===
      ledgerWrite.runtimeResponseExecutionAttempted &&

    payload.runtimeResponseExecuted ===
      ledgerWrite.runtimeResponseExecuted &&

    payload.runtimeInterventionNotRequired ===
      ledgerWrite.runtimeInterventionNotRequired &&

    payload.executorFailureContained ===
      ledgerWrite.executorFailureContained
  );

}


// ============================================================
// CHAIN RECORD IDENTITY CHECK
// ============================================================

function chainRecordIdentityIsCoherent(
  record:
    ImmutableChainRecord,
  input:
    ProviderRuntimeCryptographicLedgerBindingInput
): boolean {

  return (
    record.tenant_id ===
      input.tenantId &&

    record.company_id ===
      input.companyId &&

    record.domain ===
      "EXECUTION" &&

    record.encryption_domain ===
      input.encryptionDomain &&

    record.immutable ===
      true
  );

}


// ============================================================
// IMMUTABLE-CHAIN VERIFICATION ADAPTER
// ============================================================
//
// The hardened immutable-chain verifier receives the chain
// records and their corresponding canonical payloads.
//
// The explicit callable type keeps P9U bound to the canonical
// verification contract while preventing provider-runtime
// types from leaking into the ledger module.
//
// ============================================================

async function verifyImmutableChainWithPayloads(
  records:
    ImmutableChainRecord[],
  payloads:
    unknown[]
): Promise<ImmutableChainVerification> {

  return verifyImmutableChain({

    records,

    payloads,

  });

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderRuntimeCryptographicLedgerBindingInput,
  context:
    ProviderRuntimeBindingResultContext,
  denialReason:
    ProviderRuntimeCryptographicLedgerBindingDenialReason,
  summaryToken:
    string
): ProviderRuntimeCryptographicLedgerBindingResult {

  const ledgerWrite =
    context.ledgerWrite;

  return {

    bindingStatus:
      "PROVIDER_RUNTIME_LEDGER_BINDING_DENIED",

    bindingDecision:
      input.bindingDecision,

    runtimeLedgerBindingAttempted:
      false,

    runtimeLedgerCryptographicallyBound:
      false,

    runtimeLedgerBindingDenied:
      true,

    immutableChainVerificationAttempted:
      false,

    immutableChainVerified:
      false,

    bindingDenialReason:
      denialReason,

    tenantId:
      context.tenantId,

    companyId:
      context.companyId,

    encryptionDomain:
      context.encryptionDomain,

    persistenceId:
      ledgerWrite.persistenceId,

    ledgerEntryId:
      ledgerWrite.ledgerEntryId,

    ledgerSequence:
      ledgerWrite.ledgerSequence,

    persistedAt:
      ledgerWrite.persistedAt,

    certifiedExecutionOutcome:
      ledgerWrite.certifiedExecutionOutcome,

    providerContract:
      ledgerWrite.providerContract,

    providerImplementation:
      ledgerWrite.providerImplementation,

    operation:
      ledgerWrite.operation,

    providerResourceId:
      ledgerWrite.providerResourceId,

    executionMetadata:
      copyExecutionMetadata(
        ledgerWrite.executionMetadata
      ),

    verificationStatus:
      ledgerWrite.verificationStatus,

    classificationStatus:
      ledgerWrite.classificationStatus,

    runtimeFailureClass:
      ledgerWrite.runtimeFailureClass,

    runtimeResponse:
      ledgerWrite.runtimeResponse,

    responseExecutionStatus:
      ledgerWrite.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      ledgerWrite.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      ledgerWrite.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      ledgerWrite.runtimeInterventionNotRequired,

    executorFailureContained:
      ledgerWrite.executorFailureContained,

    ledgerWriteSummary:
      copySummary(
        ledgerWrite.summary
      ),

    summary: [
      ...copySummary(
        ledgerWrite.summary
      ),
      "provider_runtime_cryptographic_ledger_binding_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT-BOUND RESULT
// ============================================================

function buildNotBoundResult(
  input:
    ProviderRuntimeCryptographicLedgerBindingInput,
  context:
    ProviderRuntimeBindingResultContext,
  failureReason:
    ProviderRuntimeCryptographicLedgerBindingFailureReason,
  summaryToken:
    string,
  chainPayload?:
    ProviderRuntimeCryptographicLedgerPayload,
  chainRecord?:
    ImmutableChainRecord,
  chainVerification?:
    ImmutableChainVerification
): ProviderRuntimeCryptographicLedgerBindingResult {

  const ledgerWrite =
    context.ledgerWrite;

  return {

    bindingStatus:
      "PROVIDER_RUNTIME_LEDGER_NOT_BOUND",

    bindingDecision:
      input.bindingDecision,

    runtimeLedgerBindingAttempted:
      true,

    runtimeLedgerCryptographicallyBound:
      false,

    runtimeLedgerBindingDenied:
      false,

    immutableChainVerificationAttempted:
      chainRecord !== undefined,

    immutableChainVerified:
      false,

    bindingFailureReason:
      failureReason,

    tenantId:
      context.tenantId,

    companyId:
      context.companyId,

    encryptionDomain:
      context.encryptionDomain,

    persistenceId:
      ledgerWrite.persistenceId,

    ledgerEntryId:
      ledgerWrite.ledgerEntryId,

    ledgerSequence:
      ledgerWrite.ledgerSequence,

    persistedAt:
      ledgerWrite.persistedAt,

    certifiedExecutionOutcome:
      ledgerWrite.certifiedExecutionOutcome,

    providerContract:
      ledgerWrite.providerContract,

    providerImplementation:
      ledgerWrite.providerImplementation,

    operation:
      ledgerWrite.operation,

    providerResourceId:
      ledgerWrite.providerResourceId,

    executionMetadata:
      copyExecutionMetadata(
        ledgerWrite.executionMetadata
      ),

    verificationStatus:
      ledgerWrite.verificationStatus,

    classificationStatus:
      ledgerWrite.classificationStatus,

    runtimeFailureClass:
      ledgerWrite.runtimeFailureClass,

    runtimeResponse:
      ledgerWrite.runtimeResponse,

    responseExecutionStatus:
      ledgerWrite.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      ledgerWrite.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      ledgerWrite.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      ledgerWrite.runtimeInterventionNotRequired,

    executorFailureContained:
      ledgerWrite.executorFailureContained,

    chainPayload,

    chainRecord,

    chainVerification,

    ledgerWriteSummary:
      copySummary(
        ledgerWrite.summary
      ),

    summary: [
      ...copySummary(
        ledgerWrite.summary
      ),
      "provider_runtime_cryptographic_ledger_not_bound",
      summaryToken,
    ],

  };

}


// ============================================================
// SUCCESS RESULT
// ============================================================

function buildBoundResult(
  input:
    ProviderRuntimeCryptographicLedgerBindingInput,
  context:
    ProviderRuntimeBindingResultContext,
  chainPayload:
    ProviderRuntimeCryptographicLedgerPayload,
  chainRecord:
    ImmutableChainRecord,
  chainVerification:
    ImmutableChainVerification
): ProviderRuntimeCryptographicLedgerBindingResult {

  const ledgerWrite =
    context.ledgerWrite;

  return {

    bindingStatus:
      "PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHICALLY_BOUND",

    bindingDecision:
      input.bindingDecision,

    runtimeLedgerBindingAttempted:
      true,

    runtimeLedgerCryptographicallyBound:
      true,

    runtimeLedgerBindingDenied:
      false,

    immutableChainVerificationAttempted:
      true,

    immutableChainVerified:
      true,

    tenantId:
      context.tenantId,

    companyId:
      context.companyId,

    encryptionDomain:
      context.encryptionDomain,

    persistenceId:
      ledgerWrite.persistenceId,

    ledgerEntryId:
      ledgerWrite.ledgerEntryId,

    ledgerSequence:
      ledgerWrite.ledgerSequence,

    persistedAt:
      ledgerWrite.persistedAt,

    certifiedExecutionOutcome:
      ledgerWrite.certifiedExecutionOutcome,

    providerContract:
      ledgerWrite.providerContract,

    providerImplementation:
      ledgerWrite.providerImplementation,

    operation:
      ledgerWrite.operation,

    providerResourceId:
      ledgerWrite.providerResourceId,

    executionMetadata:
      copyExecutionMetadata(
        ledgerWrite.executionMetadata
      ),

    verificationStatus:
      ledgerWrite.verificationStatus,

    classificationStatus:
      ledgerWrite.classificationStatus,

    runtimeFailureClass:
      ledgerWrite.runtimeFailureClass,

    runtimeResponse:
      ledgerWrite.runtimeResponse,

    responseExecutionStatus:
      ledgerWrite.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      ledgerWrite.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      ledgerWrite.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      ledgerWrite.runtimeInterventionNotRequired,

    executorFailureContained:
      ledgerWrite.executorFailureContained,

    chainPayload,

    chainRecord,

    chainVerification,

    ledgerWriteSummary:
      copySummary(
        ledgerWrite.summary
      ),

    summary: [
      ...copySummary(
        ledgerWrite.summary
      ),
      ...chainVerification.summary,
      "provider_runtime_ledger_cryptographically_bound",
      "provider_runtime_immutable_chain_verified",
    ],

  };

}


// ============================================================
// PROVIDER RUNTIME CRYPTOGRAPHIC LEDGER BINDING
// ============================================================

export async function bindAndVerifyProviderRuntimeLedger(
  input:
    ProviderRuntimeCryptographicLedgerBindingInput
): Promise<ProviderRuntimeCryptographicLedgerBindingResult> {

  const ledgerWrite =
    asLedgerWriteView(
      input.ledgerWrite
    );

  const context:
    ProviderRuntimeBindingResultContext = {

      ledgerWrite,

      tenantId:
        input.tenantId,

      companyId:
        input.companyId,

      encryptionDomain:
        input.encryptionDomain,

    };

  // ----------------------------------------------------------
  // 1. BINDING DECISION REJECTED
  // ----------------------------------------------------------

  if (
    input.bindingDecision ===
    "REJECT_PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHIC_BINDING"
  ) {

    return buildDeniedResult(
      input,
      context,
      "RUNTIME_LEDGER_BINDING_NOT_ALLOWED",
      "runtime_ledger_binding_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. P9R DURABLE LEDGER WRITE REQUIRED
  // ----------------------------------------------------------

  if (
    !runtimeLedgerWasWritten(
      ledgerWrite
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "RUNTIME_LEDGER_WRITE_NOT_COMPLETED",
      "runtime_ledger_write_not_completed"
    );

  }

  // ----------------------------------------------------------
  // 3. P9R DURABLE IDENTITY REQUIRED
  // ----------------------------------------------------------

  if (
    !durableLedgerIdentityExists(
      ledgerWrite
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "RUNTIME_LEDGER_DURABLE_IDENTITY_MISSING",
      "runtime_ledger_durable_identity_missing"
    );

  }

  // ----------------------------------------------------------
  // 4. SOVEREIGN TENANT CONTEXT REQUIRED
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      input.tenantId
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "SOVEREIGN_TENANT_CONTEXT_MISSING",
      "sovereign_tenant_context_missing"
    );

  }

  // ----------------------------------------------------------
  // 5. SOVEREIGN COMPANY CONTEXT REQUIRED
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      input.companyId
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "SOVEREIGN_COMPANY_CONTEXT_MISSING",
      "sovereign_company_context_missing"
    );

  }

  // ----------------------------------------------------------
  // 6. RUNTIME TENANT OWNERSHIP COHERENCE
  // ----------------------------------------------------------

  const runtimeTenantId =
    extractRuntimeTenantId(
      ledgerWrite
    );

  if (
    runtimeTenantId !== undefined &&
    runtimeTenantId !== input.tenantId
  ) {

    return buildDeniedResult(
      input,
      context,
      "RUNTIME_LEDGER_TENANT_MISMATCH",
      "runtime_ledger_tenant_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 7. CANONICAL PAYLOAD CREATION
  // ----------------------------------------------------------

  const chainPayload =
    createCanonicalChainPayload(
      ledgerWrite
    );

  if (!chainPayload) {

    return buildNotBoundResult(
      input,
      context,
      "CANONICAL_CHAIN_PAYLOAD_NOT_CREATED",
      "canonical_chain_payload_not_created"
    );

  }

  // ----------------------------------------------------------
  // 8. CANONICAL PAYLOAD COHERENCE
  // ----------------------------------------------------------

  if (
    !chainPayloadIsCoherent(
      chainPayload,
      ledgerWrite
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "IMMUTABLE_CHAIN_PAYLOAD_INCOHERENT",
      "immutable_chain_payload_incoherent",
      chainPayload
    );

  }

  // ----------------------------------------------------------
  // 9. IMMUTABLE CHAIN APPEND
  // ----------------------------------------------------------

  let chainRecord:
    ImmutableChainRecord;

  try {

    const appendInput:
      AppendImmutableRecordInput = {

        tenant_id:
          input.tenantId,

        company_id:
          input.companyId,

        domain:
          "EXECUTION",

        encryption_domain:
          input.encryptionDomain,

        payload:
          chainPayload,

        previous:
          input.previousRecord ?? null,

        metadata: {

          source:
            "P9U.1",

          source_layer:
            "PROVIDER_RUNTIME",

          source_result:
            "P9R_PROVIDER_RUNTIME_LEDGER_WRITE",

          persistence_id:
            chainPayload.persistenceId,

          ledger_entry_id:
            chainPayload.ledgerEntryId,

          ledger_sequence:
            chainPayload.ledgerSequence,

          certified_execution_outcome:
            chainPayload.certifiedExecutionOutcome,

        },

      };

    chainRecord =
      await appendImmutableRecord(
        appendInput
      );

  } catch {

    return buildNotBoundResult(
      input,
      context,
      "IMMUTABLE_CHAIN_APPEND_FAILED",
      "immutable_chain_append_failed",
      chainPayload
    );

  }

  // ----------------------------------------------------------
  // 10. IMMUTABLE CHAIN RECORD PRESENCE
  // ----------------------------------------------------------

  if (!chainRecord) {

    return buildNotBoundResult(
      input,
      context,
      "IMMUTABLE_CHAIN_RECORD_NOT_CREATED",
      "immutable_chain_record_not_created",
      chainPayload
    );

  }

  // ----------------------------------------------------------
  // 11. CHAIN RECORD IDENTITY COHERENCE
  // ----------------------------------------------------------

  if (
    !chainRecordIdentityIsCoherent(
      chainRecord,
      input
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "IMMUTABLE_CHAIN_IDENTITY_INCOHERENT",
      "immutable_chain_identity_incoherent",
      chainPayload,
      chainRecord
    );

  }

  // ----------------------------------------------------------
  // 12. COMPLETE CHAIN MATERIAL
  // ----------------------------------------------------------

  const previousRecords =
    input.previousRecord
      ? [
          input.previousRecord,
        ]
      : [];

  const previousPayloads =
    input.previousPayloads
      ? [
          ...input.previousPayloads,
        ]
      : [];

  if (
    previousRecords.length !==
    previousPayloads.length
  ) {

    return buildNotBoundResult(
      input,
      context,
      "IMMUTABLE_CHAIN_VERIFICATION_FAILED",
      "immutable_chain_payload_record_count_mismatch",
      chainPayload,
      chainRecord
    );

  }

  const records:
    ImmutableChainRecord[] = [

      ...previousRecords,

      chainRecord,

    ];

  const payloads:
    ProviderRuntimeCryptographicLedgerPayload[] = [

      ...previousPayloads,

      chainPayload,

    ];

  // ----------------------------------------------------------
  // 13. IMMUTABLE CHAIN VERIFICATION
  // ----------------------------------------------------------

  let chainVerification:
    ImmutableChainVerification;

  try {

    chainVerification =
      await verifyImmutableChainWithPayloads(
        records,
        payloads
      );

  } catch {

    return buildNotBoundResult(
      input,
      context,
      "IMMUTABLE_CHAIN_VERIFICATION_FAILED",
      "immutable_chain_verification_failed",
      chainPayload,
      chainRecord
    );

  }

  if (!chainVerification.valid) {

    return buildNotBoundResult(
      input,
      context,
      "IMMUTABLE_CHAIN_VERIFICATION_FAILED",
      "immutable_chain_verification_failed",
      chainPayload,
      chainRecord,
      chainVerification
    );

  }

  // ----------------------------------------------------------
  // 14. CRYPTOGRAPHIC BINDING COMPLETE
  // ----------------------------------------------------------

  return buildBoundResult(
    input,
    context,
    chainPayload,
    chainRecord,
    chainVerification
  );

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// P9U receives one durable P9R provider-runtime
// ledger-write result.
//
// P9U preserves:
//
// - persistenceId
// - ledgerEntryId
// - ledgerSequence
// - persistedAt
// - certifiedExecutionOutcome
// - provider/runtime context
// - P9L verification context
// - P9M classification context
// - P9N response decision
// - P9O response execution state
// - P9P certified outcome
// - P9Q admission lineage
// - P9R persistence and ledger-write lineage
//
// P9U creates:
//
// - one canonical immutable-chain payload
// - one immutable governance-chain record
// - one cryptographic chain-verification result
//
// P9U does not modify the P9R result.
//
// P9U does not manufacture P9R identifiers.
//
// ============================================================


// ============================================================
// BINDING PRINCIPLES
// ============================================================
//
// Durable Ledger Fact
// ≠
// Cryptographically Bound Ledger Fact
//
// Cryptographic Binding
// ≠
// Provider Runtime Verification
//
// Cryptographic Binding
// ≠
// Execution Outcome Certification
//
// Cryptographic Chain Verification
// ≠
// Ledger Audit Admission
//
// Cryptographic Chain Verification
// ≠
// Audit Execution
//
// Payload Integrity
// ≠
// Payload Authenticity
//
// Record Integrity
// ≠
// Signer Identity
//
// Immutable Chain
// ≠
// Persistence Mechanism
//
// ============================================================


// ============================================================
// SOVEREIGN CONTINUITY
// ============================================================
//
// Every provider-runtime chain record is bound to:
//
// - one chain identity
// - one tenant identity
// - one company identity
// - one ledger domain
// - one encryption domain
// - one previous record hash
// - one canonical payload hash
// - one sequence number
//
// A provider-runtime fact may not be appended
// across:
//
// - tenant boundary
// - company boundary
// - ledger-domain boundary
// - encryption-domain boundary
// - chain-identity boundary
//
// P9U does not repair sovereign discontinuity.
//
// P9U refuses to claim successful binding.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - verify provider execution
// - classify provider failure
// - decide runtime response
// - execute runtime response
// - invoke governed response executors
// - certify execution outcome
// - admit evidence
// - persist provider-runtime evidence
// - create P9R durable identifiers
// - rewrite P9R durable identifiers
// - admit ledger facts to audit
// - execute provider-runtime audit
// - verify ledger business meaning
// - reinterpret certified outcomes
// - authorize cryptographic execution
// - encrypt payloads
// - decrypt payloads
// - sign payloads
// - verify payload signatures
// - claim payload authenticity
// - claim signer identity
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - replace runtime responses
// - alter upstream summaries
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9R durable ledger-write result
//
// ✓ require completed P9R ledger write
//
// ✓ require P9R durable identifiers
//
// ✓ require sovereign tenant context
//
// ✓ require sovereign company context
//
// ✓ validate runtime tenant ownership
//
// ✓ create canonical provider-runtime
//   immutable-chain payload
//
// ✓ preserve provider/runtime lineage
//
// ✓ preserve P9R durable identity
//
// ✓ append one immutable-chain record
//
// ✓ bind record to EXECUTION domain
//
// ✓ bind record to encryption domain
//
// ✓ bind record to tenant identity
//
// ✓ bind record to company identity
//
// ✓ verify payload hash
//
// ✓ verify record hash
//
// ✓ verify chain identity
//
// ✓ verify sequence continuity
//
// ✓ verify sovereign continuity
//
// ✓ fail closed on append failure
//
// ✓ fail closed on verification failure
//
// ✗ verify provider execution
//
// ✗ classify provider failure
//
// ✗ decide runtime response
//
// ✗ execute runtime response
//
// ✗ certify execution outcome
//
// ✗ persist provider-runtime evidence
//
// ✗ manufacture durable identifiers
//
// ✗ execute audit
//
// ✗ encrypt or decrypt payloads
//
// ✗ call provider APIs or SDKs
//
// ============================================================