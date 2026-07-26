import {
  evaluateGovernanceSignExecutionEligibility,
  type GovernanceSignDecisionEnvelope,
} from "../governance/governance.sign.decision";
import {
  evaluateInfrastructureSigningKeyUsageEligibility,
  type InfrastructureSigningKeyUsageAuthorization,
} from "../infrastructure/signing.key.usage.authorization";
import type {
  FinancialDecisionCommitSubjectMaterialization,
} from "../mechanisms/financial.decision.commit.subject";
import type {
  MechanismsProofProfileAuthorization,
} from "../mechanisms/signing.proof.profile.authorization";

export type TrustedSignCompositionDenialReason =
  | "COMPOSITION_IDENTITY_INVALID"
  | "GOVERNANCE_DECISION_INELIGIBLE"
  | "INFRASTRUCTURE_AUTHORIZATION_INELIGIBLE"
  | "MECHANISMS_PROFILE_NOT_AUTHORIZED"
  | "SIGNING_SUBJECT_NOT_MATERIALIZED"
  | "AUTHORITATIVE_RESULTS_INCOHERENT";

export type TrustedSignCompositionResult =
  | Readonly<{
      composed: true;
      compositionId: string;
      composedAt: string;
      governanceDecisionId: string;
      infrastructureAuthorizationId: string;
      mechanismsAuthorizationId: string;
      subjectId: string;
      proofProfileId: string;
      proofProfileVersion: string;
      providerKeyReference: string;
      providerAlgorithm: "RSASSA_PSS_SHA_256";
      messageType: "RAW";
      signingInput: Uint8Array;
    }>
  | Readonly<{
      composed: false;
      compositionId: string;
      composedAt: string;
      denialReason: TrustedSignCompositionDenialReason;
    }>;

export interface TrustedSignCompositionInput {
  readonly compositionId: string;
  readonly composedAt: string;
  readonly governanceDecision: GovernanceSignDecisionEnvelope;
  readonly infrastructureAuthorization:
    InfrastructureSigningKeyUsageAuthorization;
  readonly mechanismsAuthorization:
    MechanismsProofProfileAuthorization;
  readonly subjectMaterialization:
    FinancialDecisionCommitSubjectMaterialization;
}

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function deny(
  input: TrustedSignCompositionInput,
  denialReason: TrustedSignCompositionDenialReason,
): TrustedSignCompositionResult {
  return Object.freeze({
    composed: false,
    compositionId: input.compositionId,
    composedAt: input.composedAt,
    denialReason,
  });
}

export function composeTrustedSignPreCall(
  input: TrustedSignCompositionInput,
): TrustedSignCompositionResult {
  if (
    !UUID_V4.test(input.compositionId) ||
    !TIME.test(input.composedAt) ||
    !Number.isFinite(Date.parse(input.composedAt))
  ) return deny(input, "COMPOSITION_IDENTITY_INVALID");

  if (
    !evaluateGovernanceSignExecutionEligibility(
      input.governanceDecision,
      input.composedAt,
    ).eligible
  ) return deny(input, "GOVERNANCE_DECISION_INELIGIBLE");

  if (
    !evaluateInfrastructureSigningKeyUsageEligibility(
      input.infrastructureAuthorization,
      input.composedAt,
    ).eligible
  ) return deny(input, "INFRASTRUCTURE_AUTHORIZATION_INELIGIBLE");

  if (
    input.mechanismsAuthorization.decision !== "AUTHORIZED" ||
    !input.mechanismsAuthorization.proofProfile
  ) return deny(input, "MECHANISMS_PROFILE_NOT_AUTHORIZED");

  if (!input.subjectMaterialization.materialized) {
    return deny(input, "SIGNING_SUBJECT_NOT_MATERIALIZED");
  }

  const infrastructure = input.infrastructureAuthorization;
  const subject = input.subjectMaterialization.subject;
  const profile = input.mechanismsAuthorization.proofProfile;
  if (
    !infrastructure.providerMapping ||
    infrastructure.request.governanceDecisionReference !==
      input.governanceDecision.decisionId ||
    infrastructure.request.tenantId !== subject.tenantId ||
    infrastructure.request.companyId !== subject.companyId ||
    input.governanceDecision.request.tenantId !== subject.tenantId ||
    input.governanceDecision.request.companyId !== subject.companyId ||
    input.governanceDecision.request.subjectId !== subject.subjectId ||
    profile.subjectSchema !== "FINANCIAL_DECISION_COMMIT_V1" ||
    profile.requiredKeyCapability.keyFamily !==
      infrastructure.providerMapping.keyFamily ||
    profile.requiredKeyCapability.parameterConstraints.modulusBits !==
      infrastructure.providerMapping.keySizeBits ||
    profile.requiredKeyCapability.keyPurpose !==
      infrastructure.providerMapping.keyPurpose
  ) return deny(input, "AUTHORITATIVE_RESULTS_INCOHERENT");

  return Object.freeze({
    composed: true,
    compositionId: input.compositionId,
    composedAt: input.composedAt,
    governanceDecisionId: input.governanceDecision.decisionId,
    infrastructureAuthorizationId: infrastructure.authorizationId,
    mechanismsAuthorizationId: input.mechanismsAuthorization.authorizationId,
    subjectId: subject.subjectId,
    proofProfileId: profile.profileId,
    proofProfileVersion: profile.profileVersion,
    providerKeyReference: infrastructure.providerMapping.providerKeyReference,
    providerAlgorithm: profile.signingScheme.providerAlgorithm,
    messageType: profile.signingScheme.signingInputTreatment.messageType,
    signingInput: input.subjectMaterialization.canonicalSubjectBytes.slice(),
  });
}
