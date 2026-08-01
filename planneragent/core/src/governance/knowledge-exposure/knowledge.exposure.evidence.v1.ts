import { createHash } from "node:crypto";
import type {
  KnowledgeExposureDecisionV1,
  KnowledgeExposureEvidenceV1,
  KnowledgeExposureRequestV1,
} from "./knowledge.exposure.contracts.v1";
import { KnowledgeExposureError } from "./knowledge.exposure.contracts.v1";
import { deepCopyAndFreeze } from "./knowledge.projection.guard.v1";

export function buildKnowledgeExposureEvidenceV1(
  request: KnowledgeExposureRequestV1,
  decision: KnowledgeExposureDecisionV1,
): KnowledgeExposureEvidenceV1 {
  if (!request || !decision || decision.request_id.length === 0 || request.correlation_id !== decision.correlation_id) {
    throw new KnowledgeExposureError("KNOWLEDGE_EVIDENCE_INVALID");
  }
  const subject = {
    request_id: decision.request_id,
    decision_id: decision.decision_id,
    outcome: decision.outcome,
    projection_digest: decision.projection_digest,
    policy_version: decision.policy_version,
  };
  return deepCopyAndFreeze({
    version: 1,
    evidence_id: `knowledge-exposure-evidence:sha256:${createHash("sha256").update(JSON.stringify(subject), "utf8").digest("hex")}`,
    ...subject,
    knowledge_digests: [...decision.knowledge_digests],
    classifications: [...new Set(request.knowledge.map(item => item.classification))].sort(),
    encryption_domains: [...new Set(request.knowledge.map(item => item.encryption_domain))].sort(),
    purpose: decision.purpose,
    operation: decision.operation,
    target_class: decision.target_class,
    reason_codes: [...decision.reason_codes],
    issued_at: decision.issued_at,
    causal_references: [...request.causal_references],
  }) as KnowledgeExposureEvidenceV1;
}
