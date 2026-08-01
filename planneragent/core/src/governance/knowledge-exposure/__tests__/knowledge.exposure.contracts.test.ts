import { describe, expect, it } from "vitest";
import { buildKnowledgeExposureEvidenceV1 } from "../knowledge.exposure.evidence.v1";
import { evaluateKnowledgeExposurePolicyV1 } from "../knowledge.exposure.policy.v1";
import { disclosure, knowledge, manifest, NOW, request } from "./fixtures";

describe("OKS-WU1 contracts and evidence", () => {
  it("deeply freezes the decision", () => { const d = evaluateKnowledgeExposurePolicyV1(request(), NOW); expect(Object.isFrozen(d)).toBe(true); expect(Object.isFrozen(d.reason_codes)).toBe(true); });
  it("defensively copies request inputs", () => { const fields = ["price"]; const k = knowledge({ authorized_fields: fields }); const q = request({ knowledge: [k], projection: manifest([k]) }); const d = evaluateKnowledgeExposurePolicyV1(q, NOW); fields.push("margin"); expect(d.outcome).toBe("ADMITTED"); expect(d.knowledge_digests).toEqual(["a".repeat(64)]); });
  it("builds content-free evidence", () => { const q = request(); const e = buildKnowledgeExposureEvidenceV1(q, evaluateKnowledgeExposurePolicyV1(q, NOW)); expect(e).not.toHaveProperty("content"); expect(e).not.toHaveProperty("payload"); expect(e).not.toHaveProperty("provider_response_digest"); });
  it("does not include raw protected knowledge in evidence", () => { const q = request(); const e = buildKnowledgeExposureEvidenceV1(q, evaluateKnowledgeExposurePolicyV1(q, NOW)); expect(JSON.stringify(e)).not.toContain("supplier-price-secret"); });
  it("does not include provider credentials in evidence", () => { const q = request({ target_identity: "provider:approved" }); const e = buildKnowledgeExposureEvidenceV1(q, evaluateKnowledgeExposurePolicyV1(q, NOW)); expect(JSON.stringify(e)).not.toMatch(/credential|api.?key|secret/i); });
  it("deeply freezes evidence", () => { const q = request(); const e = buildKnowledgeExposureEvidenceV1(q, evaluateKnowledgeExposurePolicyV1(q, NOW)); expect(Object.isFrozen(e)).toBe(true); expect(Object.isFrozen(e.knowledge_digests)).toBe(true); });
  it("preserves independent cognitive evidence", () => { const q = request(); const e = buildKnowledgeExposureEvidenceV1(q, evaluateKnowledgeExposurePolicyV1(q, NOW)); expect(e.operation).toBe("COGNITIVE_EXPOSURE"); });
  it("preserves independent disclosure evidence", () => { const q = disclosure(); const e = buildKnowledgeExposureEvidenceV1(q, evaluateKnowledgeExposurePolicyV1(q, NOW)); expect(e.operation).toBe("OUTBOUND_DISCLOSURE"); });
  it("serializes as plain governed data", () => { const q = request(); const e = buildKnowledgeExposureEvidenceV1(q, evaluateKnowledgeExposurePolicyV1(q, NOW)); expect(JSON.parse(JSON.stringify(e))).toEqual(e); });
});
