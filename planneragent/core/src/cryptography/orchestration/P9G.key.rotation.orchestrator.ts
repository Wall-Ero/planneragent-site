
// ============================================================
// PlannerAgent — Key Rotation Orchestrator
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/orchestration/
// P9G.key.rotation.orchestrator.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Key Rotation Orchestration
//
// DOMAIN
// ------------------------------------------------------------
// P9G.1 — Key Rotation Orchestrator
//
// PURPOSE
// ------------------------------------------------------------
// Orchestrate the approved key
// rotation flow across Governance,
// Mechanism and Infrastructure.
//
// Orchestration connects families.
//
// Orchestration never replaces
// family responsibilities.
//
// This file does not:
//
// - redefine governance policy
// - reinterpret governance decisions
// - redefine mechanism policy
// - redefine infrastructure policy
// - execute provider operations
// - call KMS APIs
// - call Vault APIs
// - mutate evidence
// - mutate ledger
// - perform audits directly
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance authorizes.
//
// Mechanism executes.
//
// Infrastructure provides approved
// execution environment.
//
// Orchestration connects
// contractual results.
//
// Orchestration preserves
// family boundaries.
//
// ============================================================

import {
  evaluateKeyRotationGovernance,
  KeyRotationGovernanceRequest,
  KeyRotationGovernanceDecision,
} from "../governance/P9F.key.rotation.governance.runtime";

import {
  generateKeyRotationGovernanceEvidence,
  KeyRotationGovernanceEvidence,
} from "../governance/P9F.key.rotation.governance.evidence";

import {
  recordKeyRotationGovernanceEvidence,
  KeyRotationGovernanceLedgerRecord,
} from "../governance/P9F.key.rotation.governance.ledger";

import {
  auditKeyRotationGovernanceLedger,
  KeyRotationGovernanceAuditResult,
} from "../governance/P9F.key.rotation.governance.audit";

import {
  executeKeyRotationMechanism,
  KeyRotationMechanismExecutionRequest,
  KeyRotationMechanismExecutionResult,
} from "../mechanisms/P9F.key.rotation.mechanism.execution";

import {
  verifyKeyRotationMechanismExecution,
  KeyRotationMechanismVerificationResult,
} from "../mechanisms/P9F.key.rotation.mechanism.verification";

import {
  authorizeKeyRotationInfrastructureProvisioning,
  KeyRotationInfrastructureProvisioningRequest,
  KeyRotationInfrastructureProvisioningResult,
} from "../infrastructure/P9F.key.rotation.infrastructure.provisioning";

import {
  authorizeKeyRotationInfrastructureAccess,
  InfrastructureAccessDecision,
  KeyRotationInfrastructureAccessResult,
} from "../infrastructure/P9F.key.rotation.infrastructure.access";

import {
  authorizeKeyRotationInfrastructureUsage,
  InfrastructureUsageDecision,
  KeyRotationInfrastructureUsageResult,
} from "../infrastructure/P9F.key.rotation.infrastructure.usage";

import {
  authorizeKeyRotationInfrastructureRecovery,
  InfrastructureRecoveryDecision,
  KeyRotationInfrastructureRecoveryResult,
} from "../infrastructure/P9F.key.rotation.infrastructure.recovery";


// ============================================================
// STATUS
// ============================================================

export type KeyRotationOrchestrationStatus =
  | "KEY_ROTATION_ORCHESTRATION_COMPLETED"
  | "KEY_ROTATION_ORCHESTRATION_DENIED";


// ============================================================
// DENIAL
// ============================================================

export type KeyRotationOrchestrationDenialReason =
  | "GOVERNANCE_DENIED"
  | "GOVERNANCE_AUDIT_FAILED"
  | "MECHANISM_EXECUTION_DENIED"
  | "MECHANISM_VERIFICATION_FAILED"
  | "INFRASTRUCTURE_PROVISIONING_DENIED"
  | "INFRASTRUCTURE_ACCESS_DENIED"
  | "INFRASTRUCTURE_USAGE_DENIED"
  | "INFRASTRUCTURE_RECOVERY_DENIED";


// ============================================================
// INPUT
// ============================================================

export interface KeyRotationOrchestrationInput {

  governanceRequest:
    KeyRotationGovernanceRequest;

  mechanismRequest:
    Omit<
      KeyRotationMechanismExecutionRequest,
      "rotationAuthorized"
    >;

  infrastructureProvisioningRequest:
    KeyRotationInfrastructureProvisioningRequest;

  accessDecision:
    InfrastructureAccessDecision;

  usageDecision:
    InfrastructureUsageDecision;

  recoveryDecision:
    InfrastructureRecoveryDecision;

  evidenceId:
    string;

  evidenceGeneratedAt:
    string;

  ledgerRecordId:
    string;

  ledgerRecordedAt:
    string;

  auditId:
    string;

  auditedAt:
    string;

  verificationId:
    string;

  verifiedAt:
    string;

}


// ============================================================
// RESULT
// ============================================================

export interface KeyRotationOrchestrationResult {

  orchestrationStatus:
    KeyRotationOrchestrationStatus;

  denialReason?:
    KeyRotationOrchestrationDenialReason;

  governanceDecision:
    KeyRotationGovernanceDecision;

  governanceEvidence?:
    KeyRotationGovernanceEvidence;

  governanceLedgerRecord?:
    KeyRotationGovernanceLedgerRecord;

  governanceAuditResult?:
    KeyRotationGovernanceAuditResult;

  mechanismExecutionResult?:
    KeyRotationMechanismExecutionResult;

  mechanismVerificationResult?:
    KeyRotationMechanismVerificationResult;

  infrastructureProvisioningResult?:
    KeyRotationInfrastructureProvisioningResult;

  infrastructureAccessResult?:
    KeyRotationInfrastructureAccessResult;

  infrastructureUsageResult?:
    KeyRotationInfrastructureUsageResult;

  infrastructureRecoveryResult?:
    KeyRotationInfrastructureRecoveryResult;

  summary:
    string[];

}


// ============================================================
// ORCHESTRATOR
// ============================================================

export function orchestrateKeyRotation(
  input: KeyRotationOrchestrationInput
): KeyRotationOrchestrationResult {

  const governanceDecision =
    evaluateKeyRotationGovernance(
      input.governanceRequest
    );

  const governanceEvidence =
    generateKeyRotationGovernanceEvidence({

      evidenceId:
        input.evidenceId,

      generatedAt:
        input.evidenceGeneratedAt,

      decision:
        governanceDecision,

    });

  const governanceLedgerRecord =
    recordKeyRotationGovernanceEvidence({

      ledgerRecordId:
        input.ledgerRecordId,

      recordedAt:
        input.ledgerRecordedAt,

      evidence:
        governanceEvidence,

    });

  const governanceAuditResult =
    auditKeyRotationGovernanceLedger({

      auditId:
        input.auditId,

      auditedAt:
        input.auditedAt,

      ledgerRecord:
        governanceLedgerRecord,

    });

  if (
    governanceDecision.decisionStatus ===
    "ROTATION_DENIED"
  ) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "GOVERNANCE_DENIED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      summary: [
        ...governanceDecision.summary,
        "orchestration_denied",
      ],

    };

  }

  if (
    governanceAuditResult.auditStatus !==
    "AUDIT_PASSED"
  ) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "GOVERNANCE_AUDIT_FAILED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      summary: [
        ...governanceAuditResult.summary,
        "orchestration_denied",
      ],

    };

  }

  const mechanismExecutionResult =
    executeKeyRotationMechanism({

      rotationAuthorized:
        true,

      mechanism:
        input.mechanismRequest.mechanism,

      wrappingOperation:
        input.mechanismRequest.wrappingOperation,

    });

  if (
    mechanismExecutionResult.executionStatus !==
    "EXECUTION_COMPLETED"
  ) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "MECHANISM_EXECUTION_DENIED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      mechanismExecutionResult,

      summary: [
        ...governanceAuditResult.summary,
        ...mechanismExecutionResult.summary,
        "orchestration_denied",
      ],

    };

  }

  const mechanismVerificationResult =
    verifyKeyRotationMechanismExecution({

      verificationId:
        input.verificationId,

      verifiedAt:
        input.verifiedAt,

      executionResult:
        mechanismExecutionResult,

    });

  if (
    mechanismVerificationResult.verificationStatus !==
    "VERIFICATION_PASSED"
  ) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "MECHANISM_VERIFICATION_FAILED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      mechanismExecutionResult,

      mechanismVerificationResult,

      summary: [
        ...governanceAuditResult.summary,
        ...mechanismVerificationResult.summary,
        "orchestration_denied",
      ],

    };

  }

  const infrastructureProvisioningResult =
    authorizeKeyRotationInfrastructureProvisioning(
      input.infrastructureProvisioningRequest
    );

  if (
    !infrastructureProvisioningResult.provisioningAuthorized
  ) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "INFRASTRUCTURE_PROVISIONING_DENIED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      mechanismExecutionResult,

      mechanismVerificationResult,

      infrastructureProvisioningResult,

      summary: [
        ...governanceAuditResult.summary,
        ...mechanismVerificationResult.summary,
        ...infrastructureProvisioningResult.summary,
        "orchestration_denied",
      ],

    };

  }

  const infrastructureAccessResult =
    authorizeKeyRotationInfrastructureAccess({

      provisioning:
        infrastructureProvisioningResult,

      accessDecision:
        input.accessDecision,

    });

  if (!infrastructureAccessResult.accessGranted) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "INFRASTRUCTURE_ACCESS_DENIED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      mechanismExecutionResult,

      mechanismVerificationResult,

      infrastructureProvisioningResult,

      infrastructureAccessResult,

      summary: [
        ...governanceAuditResult.summary,
        ...mechanismVerificationResult.summary,
        ...infrastructureAccessResult.summary,
        "orchestration_denied",
      ],

    };

  }

  const infrastructureUsageResult =
    authorizeKeyRotationInfrastructureUsage({

      access:
        infrastructureAccessResult,

      usageDecision:
        input.usageDecision,

    });

  if (!infrastructureUsageResult.usageAuthorized) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "INFRASTRUCTURE_USAGE_DENIED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      mechanismExecutionResult,

      mechanismVerificationResult,

      infrastructureProvisioningResult,

      infrastructureAccessResult,

      infrastructureUsageResult,

      summary: [
        ...governanceAuditResult.summary,
        ...mechanismVerificationResult.summary,
        ...infrastructureUsageResult.summary,
        "orchestration_denied",
      ],

    };

  }

  const infrastructureRecoveryResult =
    authorizeKeyRotationInfrastructureRecovery({

      usage:
        infrastructureUsageResult,

      recoveryDecision:
        input.recoveryDecision,

    });

  if (!infrastructureRecoveryResult.recoveryAuthorized) {

    return {

      orchestrationStatus:
        "KEY_ROTATION_ORCHESTRATION_DENIED",

      denialReason:
        "INFRASTRUCTURE_RECOVERY_DENIED",

      governanceDecision,

      governanceEvidence,

      governanceLedgerRecord,

      governanceAuditResult,

      mechanismExecutionResult,

      mechanismVerificationResult,

      infrastructureProvisioningResult,

      infrastructureAccessResult,

      infrastructureUsageResult,

      infrastructureRecoveryResult,

      summary: [
        ...governanceAuditResult.summary,
        ...mechanismVerificationResult.summary,
        ...infrastructureRecoveryResult.summary,
        "orchestration_denied",
      ],

    };

  }

  return {

    orchestrationStatus:
      "KEY_ROTATION_ORCHESTRATION_COMPLETED",

    governanceDecision,

    governanceEvidence,

    governanceLedgerRecord,

    governanceAuditResult,

    mechanismExecutionResult,

    mechanismVerificationResult,

    infrastructureProvisioningResult,

    infrastructureAccessResult,

    infrastructureUsageResult,

    infrastructureRecoveryResult,

    summary: [
      ...governanceAuditResult.summary,
      ...mechanismVerificationResult.summary,
      ...infrastructureRecoveryResult.summary,
      "key_rotation_orchestration_completed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Orchestration composes family results.
//
// It never absorbs family
// responsibilities.
//
// Family contracts remain the
// canonical source of truth.
//
// Orchestration preserves those
// contracts without reinterpreting
// them.
//
// Provider Runtime remains a future
// implementation layer.
//
// ============================================================


// ============================================================
// POSSIBLE FUTURE EVOLUTION
// ============================================================
//
// executeKeyRotationGovernancePipeline()
//
// ↓
//
// Decision
// ↓
// Evidence
// ↓
// Ledger
// ↓
// Audit
//
// ↓
//
// GovernancePipelineResult
//
// The Orchestrator may eventually
// depend on a single Governance
// Family contract instead of its
// internal components.
//
// This is an architectural evolution,
// not part of the current contract.
//
// ============================================================


// ============================================================
// P9G.1 PRINCIPLE
// ============================================================
//
// Governance Result
// ≠
// Mechanism Result
//
// Mechanism Result
// ≠
// Infrastructure Result
//
// Infrastructure Result
// ≠
// Provider Runtime
//
// Orchestration connects.
//
// Orchestration never replaces
// family responsibilities.
//
// Each family remains responsible
// for its own contractual boundary.
//
// Domains produce evidence.
//
// Orchestration preserves evidence.
//
// Orchestration does not reinterpret
// evidence.
//
// Orchestration never invents state.
//
// Orchestration propagates
// contractual state.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - redefine governance policies
// - redefine mechanism policies
// - redefine infrastructure policies
// - mutate governance decisions
// - mutate evidence
// - mutate ledger records
// - reinterpret audit results
// - execute provider operations
// - call KMS APIs
// - call Vault APIs
// - call HSM APIs
// - select cloud providers
// - execute cryptographic operations
//
// Orchestration coordinates.
//
// Families remain responsible.
//
// Provider Runtime executes.
//
// ============================================================