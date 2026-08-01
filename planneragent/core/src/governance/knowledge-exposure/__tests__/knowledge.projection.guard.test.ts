import { describe, expect, it } from "vitest";
import { knowledgeProjectionDigestV1, validateKnowledgeProjectionManifestV1 } from "../knowledge.projection.guard.v1";
import { knowledge, manifest } from "./fixtures";

describe("OKS-WU1 projection guard", () => {
  it("accepts an explicit deterministic projection", () => { const k = knowledge(); expect(validateKnowledgeProjectionManifestV1(manifest([k]), [k])).toEqual([]); });
  it("rejects wildcard fields", () => { const k = knowledge({ authorized_fields: ["*"] }); expect(validateKnowledgeProjectionManifestV1(manifest([k], [{ field: "*", knowledge_reference: k.knowledge_reference, category: k.category }]), [k])).toContain("KNOWLEDGE_PROJECTION_INVALID"); });
  it("rejects unknown field syntax", () => { const k = knowledge(); expect(validateKnowledgeProjectionManifestV1(manifest([k], [{ field: "unknown[0]", knowledge_reference: k.knowledge_reference, category: k.category }]), [k])).toContain("KNOWLEDGE_PROJECTION_INVALID"); });
  it("rejects duplicate fields", () => { const k = knowledge(); const f = { field: "price", knowledge_reference: k.knowledge_reference, category: k.category }; expect(validateKnowledgeProjectionManifestV1(manifest([k], [f, f]), [k])).toContain("KNOWLEDGE_PROJECTION_INVALID"); });
  it("rejects nondeterministic ordering", () => { const k = knowledge(); const p = manifest([k], [{ field: "terms", knowledge_reference: k.knowledge_reference, category: k.category }, { field: "price", knowledge_reference: k.knowledge_reference, category: k.category }]); const bad = { ...p, included_fields: [...p.included_fields].reverse() }; expect(validateKnowledgeProjectionManifestV1({ ...bad, projection_digest: knowledgeProjectionDigestV1(bad) }, [k])).toContain("KNOWLEDGE_PROJECTION_INVALID"); });
  it("rejects unauthorized projected fields", () => { const k = knowledge(); expect(validateKnowledgeProjectionManifestV1(manifest([k], [{ field: "supplier_cost", knowledge_reference: k.knowledge_reference, category: k.category }]), [k])).toContain("KNOWLEDGE_PROJECTION_FIELD_UNAUTHORIZED"); });
  it("rejects explicitly excluded categories", () => { const k = knowledge({ category: "OPTIMIZER_OUTPUT" }); expect(validateKnowledgeProjectionManifestV1(manifest([k]), [k])).toContain("KNOWLEDGE_PROJECTION_FIELD_UNAUTHORIZED"); });
  it("rejects digest mismatch", () => { const k = knowledge(); expect(validateKnowledgeProjectionManifestV1({ ...manifest([k]), projection_digest: "b".repeat(64) }, [k])).toContain("KNOWLEDGE_PROJECTION_DIGEST_MISMATCH"); });
  it("rejects substituted projection", () => { const k = knowledge(); const p = manifest([k]); expect(validateKnowledgeProjectionManifestV1({ ...p, schema_version: "2" }, [k])).toContain("KNOWLEDGE_PROJECTION_DIGEST_MISMATCH"); });
  it("produces the same manifest digest repeatedly", () => { const k = knowledge(); const p = manifest([k]); expect(knowledgeProjectionDigestV1(p)).toBe(knowledgeProjectionDigestV1(p)); });
});
