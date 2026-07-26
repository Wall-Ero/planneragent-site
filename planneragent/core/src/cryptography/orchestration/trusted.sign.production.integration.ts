import type {
  ProviderRuntimeCryptographicLedgerBindingResult,
} from "../provider/runtime/P9U.provider.runtime.cryptographic.ledger.binding.chain.verification";
import {
  bindAndAdmitTrustedSignAttestation,
  type TrustedSignBindingAdmissionInput,
} from "../provider/runtime/trusted.sign.binding.admission";
import {
  persistP9XAuthenticityEvidenceAndAudit,
  type P9XAuthenticityEvidenceAuditStore,
} from "../provider/runtime/P9X.authenticity.evidence.audit.persistence";
import {
  runTrustedSignProductionSmoke,
  type TrustedSignProductionSmokeInput,
} from "./trusted.sign.production.smoke";

export interface IntegratedTrustedSignProductionInput
extends Omit<
  TrustedSignProductionSmokeInput,
  "bindAndAdmitAttestation"
> {
  readonly runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult;
  readonly cryptographicOperationId: string;
  readonly observedAt: string;
  readonly attestationId: string;
  readonly attestedAt: string;
  readonly evidenceId: string;
  readonly auditRecordId: string;
  readonly persistedAt: string;
  readonly evidenceAuditStore: P9XAuthenticityEvidenceAuditStore;
}

export interface IntegratedTrustedSignProductionDependencies {
  readonly bindAndAdmit?: typeof bindAndAdmitTrustedSignAttestation;
}

export type IntegratedTrustedSignProductionResult =
  | Readonly<{
      completed: true;
      certificateId: string;
      evidenceId: string;
      auditRecordId: string;
      certificateDigest: string;
      auditRecordDigest: string;
    }>
  | Readonly<{
      completed: false;
      failedStage: "TRUSTED_SIGN_PIPELINE" | "P9X_EVIDENCE_AUDIT";
    }>;

export async function runIntegratedTrustedSignProduction(
  input: IntegratedTrustedSignProductionInput,
  dependencies: IntegratedTrustedSignProductionDependencies = {},
): Promise<IntegratedTrustedSignProductionResult> {
  const bindAndAdmit =
    dependencies.bindAndAdmit ?? bindAndAdmitTrustedSignAttestation;
  const smoke = await runTrustedSignProductionSmoke({
    ...input,
    bindAndAdmitAttestation: async (
      composition,
      execution,
      mathematicalVerification,
    ) => bindAndAdmit({
      composition,
      execution,
      mathematicalVerification,
      runtimeLedgerBinding: input.runtimeLedgerBinding,
      cryptographicOperationId: input.cryptographicOperationId,
      observedAt: input.observedAt,
      attestationId: input.attestationId,
      attestedAt: input.attestedAt,
    } satisfies TrustedSignBindingAdmissionInput),
  });
  if (!smoke.completed) {
    return Object.freeze({
      completed: false,
      failedStage: "TRUSTED_SIGN_PIPELINE",
    });
  }
  const persistence = await persistP9XAuthenticityEvidenceAndAudit(
    smoke.certificate,
    input.evidenceId,
    input.auditRecordId,
    input.persistedAt,
    input.evidenceAuditStore,
  );
  if (!persistence.persisted) {
    return Object.freeze({
      completed: false,
      failedStage: "P9X_EVIDENCE_AUDIT",
    });
  }
  return Object.freeze({
    completed: true,
    certificateId: smoke.certificate.certificate.certificateId,
    evidenceId: persistence.record.evidenceId,
    auditRecordId: persistence.record.auditRecordId,
    certificateDigest: smoke.certificate.certificateDigest,
    auditRecordDigest: persistence.record.auditRecordDigest,
  });
}
