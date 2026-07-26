import type { AdapterExecutionResult } from "../adapter.runtime";
import {
  canonicalizeProductionErpOrders,
  PRODUCTION_ERP_ORDER_TRANSFORMATION,
  PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
} from "./authoritative.order.fact";
import {
  persistCanonicalOrderFactBatch,
  type CanonicalFactAppendOnlyStore,
} from "./canonical.order.integrity";
import {
  admitVerifiedCanonicalFactBatchAsDecisionEvidence,
  type VerifiedCanonicalFactDecisionEvidence,
} from "./verified.canonical.fact.decision.evidence";

export type CanonicalOrderDecisionEvidenceOrchestrationResult =
  | Readonly<{
      completed: true;
      evidence: readonly VerifiedCanonicalFactDecisionEvidence[];
    }>
  | Readonly<{
      completed: false;
      failedStage:
        | "CANONICALIZATION"
        | "PERSISTENCE_INTEGRITY"
        | "READBACK_VERIFICATION_ADMISSION";
    }>;

export async function createVerifiedOrderDecisionEvidenceFromAcquisition(
  acquisition: AdapterExecutionResult,
  persistedAt: string,
  store: CanonicalFactAppendOnlyStore,
): Promise<CanonicalOrderDecisionEvidenceOrchestrationResult> {
  const canonicalization = canonicalizeProductionErpOrders(acquisition, {
    transformationId: PRODUCTION_ERP_ORDER_TRANSFORMATION,
    transformationVersion: PRODUCTION_ERP_ORDER_TRANSFORMATION_VERSION,
  });
  if (!canonicalization.ok) {
    return Object.freeze({
      completed: false,
      failedStage: "CANONICALIZATION",
    });
  }
  const persistence = await persistCanonicalOrderFactBatch(
    canonicalization.facts,
    persistedAt,
    store,
  );
  if (!persistence.persisted) {
    return Object.freeze({
      completed: false,
      failedStage: "PERSISTENCE_INTEGRITY",
    });
  }
  const admission =
    await admitVerifiedCanonicalFactBatchAsDecisionEvidence(
      canonicalization.facts.map(fact => Object.freeze({
        tenantId: fact.owner.tenantId,
        factId: fact.factId,
      })),
      store,
    );
  if (!admission.admitted) {
    return Object.freeze({
      completed: false,
      failedStage: "READBACK_VERIFICATION_ADMISSION",
    });
  }
  return Object.freeze({
    completed: true,
    evidence: admission.evidence,
  });
}
